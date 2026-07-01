import { IEmailProvider, EmailPayload } from './email.interface';

export class ZeptoMailProvider implements IEmailProvider {
  // TODO: implement when domain is verified on ZeptoMail
  // Replace RESEND_API_KEY with ZEPTOMAIL_API_KEY in .env
  // Change EMAIL_PROVIDER env var from "resend" to "zeptomail"
  async send(payload: EmailPayload): Promise<{ success: boolean; id?: string }> {
    throw new Error('ZeptoMail not configured');
  }
}
