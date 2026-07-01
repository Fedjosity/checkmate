export interface EmailPayload {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
}

export interface IEmailProvider {
  send(payload: EmailPayload): Promise<{ success: boolean; id?: string }>;
}
