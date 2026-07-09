import { afterEach, describe, expect, it } from "vitest";
import {
  EnvValidationError,
  resetEnvironmentValidationState,
  resolveAppEnvironment,
  validateEnvironment,
} from "@/lib/platform/env";

afterEach(() => {
  resetEnvironmentValidationState();
});

const baseValid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

describe("resolveAppEnvironment", () => {
  it("prefers VERCEL_ENV when set", () => {
    expect(resolveAppEnvironment({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(
      "preview"
    );
  });

  it("maps NODE_ENV=production to production", () => {
    expect(resolveAppEnvironment({ NODE_ENV: "production" })).toBe("production");
  });

  it("defaults to development", () => {
    expect(resolveAppEnvironment({})).toBe("development");
  });
});

describe("validateEnvironment", () => {
  it("passes development with required Supabase vars", () => {
    const result = validateEnvironment({
      env: { ...baseValid, NODE_ENV: "development" },
      appEnvironment: "development",
      throwOnError: false,
    });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("reports missing required variables without secret values", () => {
    const result = validateEnvironment({
      env: { NODE_ENV: "development" },
      appEnvironment: "development",
      throwOnError: false,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.name === "NEXT_PUBLIC_SUPABASE_URL")).toBe(true);
    expect(result.issues.some((i) => i.name === "NEXT_PUBLIC_SUPABASE_ANON_KEY")).toBe(true);
  });

  it("reports empty variables", () => {
    const result = validateEnvironment({
      env: {
        ...baseValid,
        NEXT_PUBLIC_SUPABASE_URL: "   ",
      },
      appEnvironment: "development",
      throwOnError: false,
    });
    expect(result.issues.some((i) => i.code === "empty")).toBe(true);
  });

  it("reports malformed URLs without echoing the value", () => {
    const bad = "not-a-url";
    const result = validateEnvironment({
      env: {
        ...baseValid,
        NEXT_PUBLIC_SUPABASE_URL: bad,
      },
      appEnvironment: "development",
      throwOnError: false,
    });
    const issue = result.issues.find((i) => i.name === "NEXT_PUBLIC_SUPABASE_URL");
    expect(issue?.code).toBe("malformed_url");
    expect(issue?.message).not.toContain(bad);
  });

  it("requires production-only secrets in production", () => {
    const result = validateEnvironment({
      env: {
        ...baseValid,
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        NODE_ENV: "production",
      },
      appEnvironment: "production",
      throwOnError: false,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.name).sort()).toEqual(
      ["CRON_SECRET", "SENDGRID_API_KEY"].sort()
    );
  });

  it("throws EnvValidationError by default", () => {
    expect(() =>
      validateEnvironment({
        env: {},
        appEnvironment: "development",
      })
    ).toThrow(EnvValidationError);
  });

  it("never includes secret values in thrown errors", () => {
    try {
      validateEnvironment({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "super-secret-anon-value",
          SUPABASE_SERVICE_ROLE_KEY: "",
        },
        appEnvironment: "production",
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const message = (error as Error).message;
      expect(message).not.toContain("super-secret-anon-value");
      expect(message).toContain("Secret values are never logged.");
    }
  });
});
