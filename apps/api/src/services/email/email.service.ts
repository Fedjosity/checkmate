/*
 * TO SWITCH FROM RESEND TO ZEPTOMAIL:
 * 1. Verify your domain on ZeptoMail dashboard
 * 2. Get your ZeptoMail API key from their dashboard
 * 3. Update .env:
 *    EMAIL_PROVIDER=zeptomail
 *    ZEPTOMAIL_API_KEY=your_key_here
 *    ZEPTOMAIL_FROM_EMAIL=beta@yourdomain.com
 *    ZEPTOMAIL_FROM_NAME=CheckMate
 * 4. Implement zeptomail.provider.ts using ZeptoMail's 
 *    REST API (docs: zeptomail.com/help/api)
 * 5. No other files need to change.
 */

import { ResendProvider }    from './resend.provider';
import { ZeptoMailProvider } from './zeptomail.provider';
import { IEmailProvider }    from './email.interface';

function getEmailProvider(): IEmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? 'resend';
  if (provider === 'zeptomail') return new ZeptoMailProvider();
  return new ResendProvider();
}

export const emailService = getEmailProvider();
