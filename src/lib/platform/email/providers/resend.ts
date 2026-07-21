import { Resend } from "resend";
import type {
  EmailDeliveryResult,
  EmailProvider,
  SendEmailParams,
} from "@/lib/platform/email/types";

function asHtml(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body.replace(/\n/g, "<br>");
}

function formatFrom(email: string, name?: string | null): string {
  const trimmedName = name?.trim();
  if (!trimmedName) return email;
  return `${trimmedName} <${email}>`;
}

export function createResendEmailProvider(apiKey: string): EmailProvider {
  const client = new Resend(apiKey);

  return {
    id: "resend",
    async send(params: SendEmailParams): Promise<EmailDeliveryResult> {
      const recipients = (Array.isArray(params.to) ? params.to : [params.to])
        .map((e) => e.trim())
        .filter(Boolean);

      if (!recipients.length || recipients.some((e) => !e.includes("@"))) {
        return { success: false, provider: "resend", error: "Invalid recipient email" };
      }

      const fromEmail =
        params.from?.trim() ||
        process.env.RESEND_FROM_EMAIL?.trim() ||
        "noreply@academyos.org";
      const fromName =
        params.fromName?.trim() ||
        process.env.RESEND_FROM_NAME?.trim() ||
        "AcademyOS";

      try {
        const { data, error } = await client.emails.send({
          from: formatFrom(fromEmail, fromName),
          to: recipients,
          subject: params.subject,
          html: asHtml(params.body),
          ...(params.replyTo ? { replyTo: params.replyTo } : {}),
        });

        if (error) {
          return {
            success: false,
            provider: "resend",
            error: error.message || "Resend delivery failed",
          };
        }

        return {
          success: true,
          provider: "resend",
          messageId: data?.id,
        };
      } catch (err) {
        return {
          success: false,
          provider: "resend",
          error: err instanceof Error ? err.message : "Resend request failed",
        };
      }
    },
  };
}
