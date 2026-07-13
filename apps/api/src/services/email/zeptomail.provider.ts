import { IEmailProvider, EmailPayload } from "./email.interface";

import { env } from "../../config/env.config";
import { logger } from "../../utils/logger";

export class ZeptoMailProvider implements IEmailProvider {
  async send(
    payload: EmailPayload,
  ): Promise<{ success: boolean; id?: string }> {
    if (!env.ZEPTOMAIL_API_KEY) {
      logger.error("ZEPTOMAIL_API_KEY is not defined");
      return { success: false };
    }

    try {
      const response = await fetch(env.ZEPTOMAIL_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: env.ZEPTOMAIL_API_KEY,
        },
        body: JSON.stringify({
          from: {
            address: "hello@mail.playcheckmate.app",
            name: "CheckMate",
          },
          to: [
            {
              email_address: {
                address: payload.to,
              },
            },
          ],
          subject: payload.subject,
          htmlbody: payload.htmlBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error("ZeptoMail API error", { status: response.status, data });
        return { success: false };
      }

      return { success: true, id: data.data?.[0]?.request_id };
    } catch (error) {
      logger.error("ZeptoMail unexpected error", { error, payload });
      return { success: false };
    }
  }
}
