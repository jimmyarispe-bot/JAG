import { describe, expect, it } from "vitest";
import { checkRateLimitMemory } from "@/lib/platform/api-rate-limit";
import {
  EnvValidationError,
  validateEnvironment,
} from "@/lib/platform/env";

describe("Phase E — error handling certification", () => {
  it("rejects empty production secrets without echoing values", () => {
    const secret = "super-secret-value-should-not-leak";
    const result = validateEnvironment({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        NODE_ENV: "production",
        CRON_SECRET: "",
        SENDGRID_API_KEY: secret,
      },
      appEnvironment: "production",
      throwOnError: false,
    });

    expect(result.ok).toBe(false);
    const joined = result.issues.map((i) => i.message).join(" | ");
    expect(joined).not.toContain(secret);
  });

  it("throws EnvValidationError for missing required development vars", () => {
    expect(() =>
      validateEnvironment({
        env: {},
        appEnvironment: "development",
      })
    ).toThrow(EnvValidationError);
  });

  it("rate limiter returns a structured denial after threshold", () => {
    const key = `phase-e-${Date.now()}-${Math.random()}`;
    expect(checkRateLimitMemory(key, 1, 60_000).ok).toBe(true);
    const denied = checkRateLimitMemory(key, 1, 60_000);
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.retryAfter).toBeGreaterThan(0);
    }
  });
});
