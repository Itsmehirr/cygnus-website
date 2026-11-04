/**
 * Minimal mail adapter. Uses Resend's HTTP API when RESEND_API_KEY is set;
 * otherwise logs the message and reports a dry run, so forms work locally
 * without any provider configured.
 *
 * Env:
 *   RESEND_API_KEY  — https://resend.com (any transactional provider can be
 *                     swapped in here; the rest of the app only calls sendMail)
 *   MAIL_FROM       — e.g. "Cygnus <hello@cygnus.example>" (verified sender)
 *   MAIL_TO         — inbox that receives enquiries and registrations
 */

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type MailResult = { ok: boolean; dryRun?: boolean; error?: string };

export async function sendMail(input: MailInput): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Cygnus <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[mail:dry-run]", {
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo,
    });
    return { ok: true, dryRun: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[mail] provider error", res.status, body);
      return { ok: false, error: `Provider responded ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[mail] send failed", err);
    return { ok: false, error: "Send failed" };
  }
}

export const houseInbox = () => process.env.MAIL_TO ?? "hello@cygnus.example";
