import type {
  EmailDeliveryResult,
  EmailProvider,
  SendEmailParams,
} from "@/lib/platform/email/types";

/** Used when no provider key is configured (non-production). */
export function createNoneEmailProvider(reason: string): EmailProvider {
  return {
    id: "none",
    async send(_params: SendEmailParams): Promise<EmailDeliveryResult> {
      return { success: false, provider: "none", error: reason };
    },
  };
}
