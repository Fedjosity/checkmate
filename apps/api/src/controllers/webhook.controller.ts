import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { db } from '../config/firebase.config';
import { getIO } from '../socket';
import * as walletService from '../services/wallet.service';
import { env } from '../config/env.config';

export const webhookController = {
  async handleFlutterwave(req: Request, res: Response): Promise<void> {
    // Verify signature
    const signature = req.headers['verif-hash'] as string;
    if (!signature || signature !== env.FLW_WEBHOOK_SECRET) {
      logger.warn('Webhook signature mismatch');
      res.status(401).send('Unauthorized');
      return;
    }

    // Always respond 200 immediately
    res.sendStatus(200);

    // Process asynchronously
    try {
      console.log('WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));
      const { event, data } = req.body;

      if (event === 'charge.completed' && data.status === 'successful') {
        await handleChargeCompleted(data);
      } else if (event === 'transfer.completed') {
        await handleTransferCompleted(data);
      }
    } catch (err: any) {
      logger.error('Webhook processing error', { error: err.message });
    }
  },
};

async function handleChargeCompleted(data: any): Promise<void> {
  const txRef = data.tx_ref;
  if (!txRef) return;

  const txDoc = await db.collection('transactions').doc(txRef).get();
  if (!txDoc.exists) {
    logger.warn('Webhook: transaction not found', { txRef });
    return;
  }

  const txData = txDoc.data()!;

  // Idempotency — skip if already complete
  if (txData.status === 'complete') {
    logger.info('Webhook: duplicate charge event, skipping', { txRef });
    return;
  }

  const uid = txData.uid;
  const crowns = txData.crownsAmount;

  // Credit the Crowns
  const newBalance = await walletService.creditCrownsFromDeposit(uid, txRef);

  // Update provider ref
  await db.collection('transactions').doc(txRef).update({
    providerRef: data.id?.toString() ?? null,
  });

  // Emit socket event
  try {
    const io = getIO();
    io.to(uid).emit('wallet:crowns_update', {
      availableBalance: newBalance,
      transaction: { type: 'crown_purchase', crowns },
    });
  } catch {
    // Socket may not be initialized in test
  }

  logger.info('Deposit credited via webhook', { uid, crowns, txRef });
}

async function handleTransferCompleted(data: any): Promise<void> {
  const reference = data.reference;
  if (!reference) return;

  const txDoc = await db.collection('transactions').doc(reference).get();
  if (!txDoc.exists) {
    logger.warn('Webhook: withdrawal transaction not found', { reference });
    return;
  }

  const txData = txDoc.data()!;
  const uid = txData.uid;

  if (data.status === 'SUCCESSFUL') {
    await db.collection('transactions').doc(reference).update({
      status: 'complete',
      completedAt: new Date().toISOString(),
    });

    try {
      const io = getIO();
      const userDoc = await db.collection('users').doc(uid).get();
      const balance = userDoc.data()?.wallet?.availableBalance ?? 0;
      io.to(uid).emit('wallet:crowns_update', {
        availableBalance: balance,
        transaction: { type: 'withdrawal', status: 'complete' },
      });
    } catch {
      // Socket may not be initialized
    }

    logger.info('Withdrawal completed', { uid, reference });
  } else if (data.status === 'FAILED') {
    const crowns = Math.abs(txData.crownsAmount);

    // Refund the Crowns
    const newBalance = await walletService.creditWallet(
      uid,
      crowns,
      `refund_${reference}`,
      'refund',
      'Withdrawal failed — Crowns refunded'
    );

    await db.collection('transactions').doc(reference).update({
      status: 'failed',
      completedAt: new Date().toISOString(),
    });

    try {
      const io = getIO();
      io.to(uid).emit('wallet:crowns_update', {
        availableBalance: newBalance,
        transaction: { type: 'refund', crowns },
      });
    } catch {
      // Socket may not be initialized
    }

    logger.error('Withdrawal failed, Crowns refunded', { uid, crowns, reference });
  }
}
