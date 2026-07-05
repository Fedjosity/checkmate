import { env } from '../config/env.config';
import { convertUSDToLocal } from './exchangeRate.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

// Flutterwave SDK will be dynamically loaded to handle missing credentials gracefully
let Flutterwave: any;

function getFlw() {
  if (!Flutterwave) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FlwModule = require('flutterwave-node-v3');
      Flutterwave = new FlwModule(env.FLW_PUBLIC_KEY, env.FLW_SECRET_KEY);
    } catch (err) {
      logger.error('Flutterwave SDK initialization failed', { error: (err as Error).message });
      throw new AppError('Payment service unavailable', 503);
    }
  }
  return Flutterwave;
}

export interface InitiatePaymentParams {
  uid: string;
  email: string;
  displayName: string;
  bundleId: string;
  crowns: number;
  priceWithFeeUSD: number;
  currency: string;
  txRef: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<{
  paymentLink: string;
  txRef: string;
}> {
  const flw = getFlw();

  const localAmount = convertUSDToLocal(params.priceWithFeeUSD, params.currency);

  const payload = {
    tx_ref: params.txRef,
    amount: Number(localAmount.toFixed(2)),
    currency: params.currency,
    redirect_url: `${env.WEB_URL}/wallet?deposit=complete`,
    customer: {
      email: params.email,
      name: params.displayName,
    },
    customizations: {
      title: `CheckMate — ${params.crowns} Crowns`,
      description: `${params.crowns} ♛ CheckMate Crowns`,
      logo: `${env.WEB_URL}/logo.png`,
    },
    meta: {
      uid: params.uid,
      bundleId: params.bundleId,
      crowns: params.crowns,
    },
  };

  try {
    const response = await flw.Charge.card(payload);
    // Flutterwave Standard returns a link in response.data.link
    const paymentLink = response?.data?.link || response?.meta?.authorization?.redirect;

    if (!paymentLink) {
      // Fallback: use the payment links API
      const linkResponse = await flw.PaymentPlan.create(payload);
      return {
        paymentLink: linkResponse?.data?.link ?? '',
        txRef: params.txRef,
      };
    }

    return { paymentLink, txRef: params.txRef };
  } catch (err: any) {
    logger.error('Flutterwave payment initiation failed', {
      error: err.message,
      txRef: params.txRef,
    });
    throw new AppError('Payment initiation failed. Please try again.', 502);
  }
}

export interface InitiateTransferParams {
  uid: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amountUSD: number; // in dollars
  currency: string;
  reference: string;
}

export async function initiateTransfer(params: InitiateTransferParams): Promise<{
  transferId: string;
}> {
  const flw = getFlw();

  const localAmount = convertUSDToLocal(params.amountUSD, params.currency);

  try {
    const response = await flw.Transfer.initiate({
      account_bank: params.bankCode,
      account_number: params.accountNumber,
      amount: Number(localAmount.toFixed(2)),
      currency: params.currency,
      narration: 'CheckMate Winnings',
      reference: params.reference,
      callback_url: `${env.API_URL}/webhooks/flutterwave`,
      debit_currency: 'USD',
    });

    return { transferId: response?.data?.id?.toString() ?? '' };
  } catch (err: any) {
    logger.error('Flutterwave transfer failed', {
      error: err.message,
      reference: params.reference,
    });
    throw new AppError('Withdrawal initiation failed. Please try again.', 502);
  }
}

export async function resolveAccount(
  bankCode: string,
  accountNumber: string
): Promise<{ accountName: string }> {
  const flw = getFlw();

  try {
    const response = await flw.Misc.verify_Account({
      account_number: accountNumber,
      account_bank: bankCode,
    });

    if (!response?.data?.account_name) {
      throw new AppError('Could not resolve account. Please check the details.', 400);
    }

    return { accountName: response.data.account_name };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    logger.error('Account resolution failed', { error: err.message });
    throw new AppError('Could not resolve bank account. Please verify the details.', 400);
  }
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!env.FLW_WEBHOOK_SECRET) {
    logger.warn('FLW_WEBHOOK_SECRET not set — skipping webhook verification');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', env.FLW_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
