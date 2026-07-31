import type { EmailProvider } from "@/applications/academyos/infrastructure/email/types";

/**
 * Resend-backed email provider.
 * Uses JAG platform email facade so AcademyOS never imports the Resend SDK.
 */
export function createResendEmailProvider(): EmailProvider {
  return {
    id: "resend",
    async send(message) {
      const { getEmailProvider } = await import("@/lib/platform/email");
      const provider = getEmailProvider();
      const result = await provider.send({
        to: message.to,
        subject: message.subject,
        body: message.body,
        text: message.text,
        from: message.from,
        fromName: message.fromName,
        replyTo: message.replyTo,
        kind: "transactional",
      });
      return {
        success: result.success,
        provider: result.provider === "resend" ? "resend" : "none",
        messageId: result.messageId,
        error: result.error,
      };
    },
  };
}
