import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

const DIDIT_BASE_URL = 'https://verification.didit.me';

export async function createKycSession(uid: string): Promise<string> {
  if (!env.DIDIT_API_KEY || !env.DIDIT_WORKFLOW_ID) {
    logger.warn('Didit API credentials not configured');
    throw new AppError('KYC service unavailable', 503);
  }

  try {
    const response = await fetch(`${DIDIT_BASE_URL}/v3/session/`, {
      method: 'POST',
      headers: {
        'x-api-key': env.DIDIT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: env.DIDIT_WORKFLOW_ID,
        vendor_data: uid,
        callback: `${env.WEB_URL}/wallet?kyc=complete`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DIDIT SESSION ERROR DATA:', data);
      throw new Error(data.message || 'Failed to create KYC session');
    }

    // Usually the URL is returned as session_url or url
    return data.session_url || data.url;
  } catch (err: any) {
    logger.error('Didit session creation failed', { error: err.message, uid });
    throw new AppError('Failed to initialize KYC process', 502);
  }
}

export function verifyDiditWebhookSignature(payload: string, signature: string): boolean {
  if (!env.DIDIT_WEBHOOK_SECRET) {
    logger.warn('DIDIT_WEBHOOK_SECRET not set — skipping webhook verification');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', env.DIDIT_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return hash === signature;
}
