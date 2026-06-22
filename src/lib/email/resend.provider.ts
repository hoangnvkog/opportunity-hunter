import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Initializes the Resend email provider.
 * Returns null if RESEND_API_KEY is not configured (graceful degradation).
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send an email via Resend.
 * Returns success=false if Resend is not configured or the send fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    return {
      success: false,
      error: "EMAIL_FROM env var is not configured",
    };
  }

  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  try {
    const result = await client.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown send failure",
    };
  }
}
