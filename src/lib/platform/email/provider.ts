import { createNoneEmailProvider } from "@/lib/platform/email/providers/none";
import { createResendEmailProvider } from "@/lib/platform/email/providers/resend";
import type { EmailProvider } from "@/lib/platform/email/types";

let cached: EmailProvider | null = null;

/**
 * Resolve the active email provider from environment.
 * Production requires RESEND_API_KEY (enforced by env schema / health).
 */
export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    cached = createResendEmailProvider(apiKey);
    return cached;
  }

  const reason =
    process.env.NODE_ENV === "production"
      ? "RESEND_API_KEY is required in production"
      : "Email provider not configured";
  cached = createNoneEmailProvider(reason);
  return cached;
}

/** Test helper — clears memoized provider. */
export function resetEmailProviderCache(): void {
  cached = null;
}
