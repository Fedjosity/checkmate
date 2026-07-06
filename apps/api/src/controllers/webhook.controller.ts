import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { db } from "../config/firebase.config";
import { getIO } from "../socket";
import * as walletService from "../services/wallet.service";
import { env } from "../config/env.config";
import { verifyDiditWebhookSignature } from "../services/didit.service";

export const webhookController = {
  async handleDidit(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-signature-v2'] as string;
      const payload = JSON.stringify(req.body);

      console.log('DIDIT WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));
      
      if (signature && !verifyDiditWebhookSignature(payload, signature)) {
        logger.warn('Invalid Didit webhook signature');
        res.status(401).send('Invalid signature');
        return;
      }

      const payloadObj = req.body;
      const { webhook_type, status, vendor_data, changes } = payloadObj;
      
      // Look for session status updates or user data updates that indicate approval
      if (webhook_type === 'status.updated' || webhook_type === 'user.data.updated') {
        const uid = vendor_data;
        if (!uid) {
          res.status(400).send('No vendor_data (uid) provided');
          return;
        }

        // Determine if they passed KYC
        let kycStatus = 'pending';
        
        if (status === 'Approved' || status === 'Completed' || status === 'ACTIVE') {
          // Sometimes Didit sends 'ACTIVE' for user.data.updated when they are fully approved
          // Let's also check if features are approved
          if (changes?.features?.current) {
            const features = changes.features.current;
            const isApproved = Object.values(features).every(val => val === 'Approved');
            if (isApproved) {
              kycStatus = 'verified';
            }
          } else if (status === 'Approved' || status === 'Completed') {
            kycStatus = 'verified';
          } else {
            kycStatus = 'verified'; // Fallback if just ACTIVE
          }
        } else if (status === 'Declined' || status === 'Failed') {
          kycStatus = 'failed';
        }

        if (kycStatus !== 'pending') {
          await db.collection('users').doc(uid).update({
            kycStatus
          });
          logger.info(`Didit KYC status updated for ${uid} to ${kycStatus}`);
        }
      }

      res.status(200).send('Webhook received');
    } catch (error: any) {
      logger.error('Didit webhook error', { error: error.message });
      res.status(500).send('Webhook error');
    }
  },

  async handleFlutterwave(req: Request, res: Response): Promise<void> {
    // Verify signature
    const signature = req.headers["verif-hash"] as string;
    if (!signature || signature !== env.FLW_WEBHOOK_SECRET) {
      logger.warn("Webhook signature mismatch");
      res.status(401).send("Unauthorized");
      return;
    }

    // Always respond 200 immediately
    res.sendStatus(200);

    // Process asynchronously
    try {
      console.log('WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));
      require('fs').appendFileSync('webhook_logs.json', JSON.stringify(req.body) + '\n');
      
      const { event, data } = req.body;

      // V3 Webhook
      if (event === 'charge.completed' && data?.status === 'successful') {
        await handleChargeCompleted({ tx_ref: data.tx_ref, id: data.id, status: data.status });
      } 
      // V2 Webhook (fallback if "Enable v3 webhooks" is unchecked)
      else if (req.body.status === 'successful' && (req.body.txRef || req.body.tx_ref)) {
        await handleChargeCompleted({ tx_ref: req.body.txRef || req.body.tx_ref, id: req.body.id, status: req.body.status });
      } else if (event === "transfer.completed") {
        await handleTransferCompleted(data);
      }
    } catch (err: any) {
      logger.error("Webhook processing error", { error: err.message });
    }
  },
};

async function handleChargeCompleted(data: any): Promise<void> {
  const txRef = data.tx_ref;
  if (!txRef) return;

  const txDoc = await db.collection("transactions").doc(txRef).get();
  if (!txDoc.exists) {
    logger.warn("Webhook: transaction not found", { txRef });
    return;
  }

  const txData = txDoc.data()!;

  // Idempotency — skip if already complete
  if (txData.status === "complete") {
    logger.info("Webhook: duplicate charge event, skipping", { txRef });
    return;
  }

  const uid = txData.uid;
  const crowns = txData.crownsAmount;

  // Credit the Crowns
  const newBalance = await walletService.creditCrownsFromDeposit(uid, txRef);

  // Update provider ref
  await db
    .collection("transactions")
    .doc(txRef)
    .update({
      providerRef: data.id?.toString() ?? null,
    });

  // Emit socket event
  try {
    const io = getIO();
    io.to(uid).emit("wallet:crowns_update", {
      availableBalance: newBalance,
      transaction: { type: "crown_purchase", crowns },
    });
  } catch {
    // Socket may not be initialized in test
  }

  logger.info("Deposit credited via webhook", { uid, crowns, txRef });
}

async function handleTransferCompleted(data: any): Promise<void> {
  const reference = data.reference;
  if (!reference) return;

  const txDoc = await db.collection("transactions").doc(reference).get();
  if (!txDoc.exists) {
    logger.warn("Webhook: withdrawal transaction not found", { reference });
    return;
  }

  const txData = txDoc.data()!;
  const uid = txData.uid;

  if (data.status === "SUCCESSFUL") {
    await db.collection("transactions").doc(reference).update({
      status: "complete",
      completedAt: new Date().toISOString(),
    });

    try {
      const io = getIO();
      const userDoc = await db.collection("users").doc(uid).get();
      const balance = userDoc.data()?.wallet?.availableBalance ?? 0;
      io.to(uid).emit("wallet:crowns_update", {
        availableBalance: balance,
        transaction: { type: "withdrawal", status: "complete" },
      });
    } catch {
      // Socket may not be initialized
    }

    logger.info("Withdrawal completed", { uid, reference });
  } else if (data.status === "FAILED") {
    const crowns = Math.abs(txData.crownsAmount);

    // Refund the Crowns
    const newBalance = await walletService.creditWallet(
      uid,
      crowns,
      `refund_${reference}`,
      "refund",
      "Withdrawal failed — Crowns refunded",
    );

    await db.collection("transactions").doc(reference).update({
      status: "failed",
      completedAt: new Date().toISOString(),
    });

    try {
      const io = getIO();
      io.to(uid).emit("wallet:crowns_update", {
        availableBalance: newBalance,
        transaction: { type: "refund", crowns },
      });
    } catch {
      // Socket may not be initialized
    }

    logger.error("Withdrawal failed, Crowns refunded", {
      uid,
      crowns,
      reference,
    });
  }
}
