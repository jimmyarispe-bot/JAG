import { Resend } from "resend";
import {
  resolveEmailFrom,
  resolveEmailFromName,
} from "@/lib/platform/email/from";
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

      if (!recipients.length) {
        return { success: false, provider: "resend", error: "No recipient" };
      }

      /**
       * A COMMA MEANS SOMEBODY JOINED A LIST THAT SHOULD HAVE STAYED A LIST.
       *
       * The old guard only asked whether each recipient contained an "@", so
       * "nina@a.org, jimmy@b.com" sailed through it - one string, one @ sign,
       * no complaint - and Resend returned a 422 nobody was watching for.
       *
       * Checked here rather than only at the call site because this is the last
       * place every caller passes through, and a rejection with a reason beats
       * a 422 in somebody else's log. Whitespace is caught for the same reason:
       * a real address has none.
       */
      const malformed = recipients.filter(
        (e) => !e.includes("@") || e.includes(",") || /\s/.test(e)
      );
      if (malformed.length) {
        return {
          success: false,
          provider: "resend",
          error:
            `Invalid recipient: ${malformed.join(" | ")}. ` +
            `Addresses must be passed as separate entries, not joined into one string.`,
        };
      }

      const fromEmail = resolveEmailFrom(params.from);
      const fromName = resolveEmailFromName(params.fromName);

      try {
        const { data, error } = await client.emails.send({
          from: formatFrom(fromEmail, fromName),
          to: recipients,
          subject: params.subject,
          html: asHtml(params.body),
          ...(params.text?.trim() ? { text: params.text } : {}),
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
