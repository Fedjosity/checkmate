import { Resend } from 'resend';
import { IEmailProvider, EmailPayload } from './email.interface';
import { logger } from '../../utils/logger';

export class ResendProvider implements IEmailProvider {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async send(payload: EmailPayload): Promise<{ success: boolean; id?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'CheckMate <onboarding@resend.dev>',
        to: [payload.to],
        subject: payload.subject,
        html: payload.htmlBody,
      });

      if (error) {
        logger.error('Resend email failed', { error, payload });
        return { success: false };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      logger.error('Resend unexpected error', { error, payload });
      return { success: false };
    }
  }
}
