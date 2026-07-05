import { Request, Response } from "express";
import { db } from "../config/firebase.config";
import { logger } from "../utils/logger";
import { success, error } from "../utils/response";
import { AppError } from "../utils/errors";
import { CROWN_BUNDLES } from "@checkmate/shared-types";
import { getCurrencyForCountry } from "../services/exchangeRate.service";
import * as walletService from "../services/wallet.service";
import * as flutterwaveService from "../services/flutterwave.service";

export const walletController = {
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const doc = await db.collection("users").doc(uid).get();

      if (!doc.exists) {
        res.status(404).json(error("User not found"));
        return;
      }

      const userData = doc.data()!;
      const wallet = userData.wallet ?? {
        availableBalance: 0,
        stakedBalance: 0,
        bonusBalance: 0,
        currency: "USD",
      };

      res.json(success({ wallet }));
    } catch (err: any) {
      logger.error("GetBalance error", { error: err.message });
      res.status(500).json(error("Failed to fetch wallet balance"));
    }
  },

  async initiateDeposit(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const { bundleId } = req.body;

      if (!bundleId) {
        res.status(400).json(error("Bundle ID is required"));
        return;
      }

      const bundle = CROWN_BUNDLES.find((b) => b.id === bundleId);
      if (!bundle) {
        res.status(400).json(error("Invalid bundle ID"));
        return;
      }

      const crowns = bundle.crowns;
      const priceWithFeeUSD = bundle.priceWithFeeUSD;
      const selectedBundleId = bundle.id;

      // Get user info for payment
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        res.status(404).json(error("User not found"));
        return;
      }
      const userData = userDoc.data()!;
      const currency = getCurrencyForCountry(userData.country ?? "Other");

      // Generate unique tx reference
      const txRef = `cm_deposit_${uid}_${Date.now()}`;

      // Create pending transaction in Firestore
      await db
        .collection("transactions")
        .doc(txRef)
        .set({
          uid,
          type: "crown_purchase",
          crownsAmount: crowns,
          usdAmount: Math.round(priceWithFeeUSD * 100),
          status: "pending",
          provider: "flutterwave",
          providerRef: null,
          description: `${crowns} Crowns purchase`,
          createdAt: new Date().toISOString(),
          completedAt: null,
        });

      // Initiate Flutterwave payment
      const { paymentLink } = await flutterwaveService.initiatePayment({
        uid,
        email: userData.email,
        displayName: userData.displayName,
        bundleId: selectedBundleId,
        crowns,
        priceWithFeeUSD,
        currency,
        txRef,
      });

      res.json(success({ paymentLink, txRef }));
    } catch (err: any) {
      logger.error("InitiateDeposit error", { error: err.message });
      if (err instanceof AppError) {
        res.status(err.statusCode).json(error(err.message));
        return;
      }
      res.status(500).json(error("Failed to initiate deposit"));
    }
  },

  async initiateWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const { crowns } = req.body;

      // Get user and check bank account
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        res.status(404).json(error("User not found"));
        return;
      }

      const userData = userDoc.data()!;
      const bankAccount = userData.bankAccount;

      if (!bankAccount || !bankAccount.accountNumber) {
        res
          .status(400)
          .json(error("Add a bank account in Settings before withdrawing"));
        return;
      }

      const currency = getCurrencyForCountry(userData.country ?? "Other");
      const usdAmount = crowns / 100;
      const reference = `cm_wdl_${uid}_${Date.now()}`;

      // Debit Crowns atomically
      await walletService.debitWallet(uid, crowns, reference, "withdrawal");

      // Initiate Flutterwave transfer
      let transferId = "";
      try {
        const result = await flutterwaveService.initiateTransfer({
          uid,
          bankCode: bankAccount.bankCode,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
          amountUSD: usdAmount,
          currency,
          reference,
        });
        transferId = result.transferId;
      } catch (transferErr) {
        // If transfer fails, refund the Crowns
        await walletService.creditWallet(
          uid,
          crowns,
          `refund_${reference}`,
          "refund",
          "Withdrawal transfer failed — Crowns refunded",
        );
        throw transferErr;
      }

      // Update transaction with Flutterwave transfer ID
      await db.collection("transactions").doc(reference).update({
        providerRef: transferId,
      });

      res.json(
        success({
          reference,
          status: "pending",
          crownsDeducted: crowns,
          usdAmount,
        }),
      );
    } catch (err: any) {
      logger.error("InitiateWithdrawal error", { error: err.message });
      if (err instanceof AppError) {
        res.status(err.statusCode).json(error(err.message));
        return;
      }
      res.status(500).json(error("Failed to initiate withdrawal"));
    }
  },

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit as string) || 20),
      );

      const result = await walletService.getTransactions(uid, page, limit);
      res.json(success({ ...result, page, limit }));
    } catch (err: any) {
      logger.error("GetTransactions error", { error: err.message });
      res.status(500).json(error("Failed to fetch transactions"));
    }
  },

  async saveBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const { bankCode, accountNumber } = req.body;

      // Resolve account name via Flutterwave
      const { accountName } = await flutterwaveService.resolveAccount(
        bankCode,
        accountNumber,
      );

      // Save to user document
      const bankAccount = {
        bankCode,
        accountNumber,
        accountName,
        bankName: bankCode, // Will be overridden with display name from frontend
      };

      await db.collection("users").doc(uid).update({ bankAccount });

      res.json(success({ bankAccount }));
    } catch (err: any) {
      logger.error("SaveBankAccount error", { error: err.message });
      if (err instanceof AppError) {
        res.status(err.statusCode).json(error(err.message));
        return;
      }
      res.status(500).json(error("Failed to save bank account"));
    }
  },

  async getBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        res.status(404).json(error("User not found"));
        return;
      }

      const bankAccount = userDoc.data()?.bankAccount ?? null;
      res.json(success({ bankAccount }));
    } catch (err: any) {
      logger.error("GetBankAccount error", { error: err.message });
      res.status(500).json(error("Failed to fetch bank account"));
    }
  },
};
