import type { EnvVarDefinition } from "@/lib/platform/env/types";

/**
 * Canonical environment variable contract for AcademyOS / school-platform.
 *
 * Secrets are flagged so validators never echo values.
 * Requirements differ by AppEnvironment (development | preview | production).
 */
export const ENV_VAR_DEFINITIONS: readonly EnvVarDefinition[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Supabase project URL",
    format: "url",
    requiredIn: ["development", "preview", "production"],
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Supabase anonymous (public) API key",
    secret: true,
    requiredIn: ["development", "preview", "production"],
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Supabase service-role key for privileged server operations",
    secret: true,
    requiredIn: ["preview", "production"],
    optionalIn: ["development"],
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    description: "Public application base URL used in links and merge fields",
    format: "url",
    requiredIn: ["preview", "production"],
    optionalIn: ["development"],
  },
  {
    name: "CRON_SECRET",
    description: "Bearer secret for authenticated cron / queue processing routes",
    secret: true,
    requiredIn: ["production"],
    optionalIn: ["development", "preview"],
  },
  {
    name: "SENDGRID_API_KEY",
    description: "SendGrid API key for transactional email",
    secret: true,
    requiredIn: ["production"],
    optionalIn: ["development", "preview"],
  },
  {
    name: "SENDGRID_FROM_EMAIL",
    description: "Default From address for SendGrid messages",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "SENDGRID_FROM_NAME",
    description: "Default From display name for SendGrid messages",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "VAULT_ENCRYPTION_KEY",
    description: "Encryption key for Integration Hub vault secrets",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "PLAYWRIGHT_BASE_URL",
    description: "Base URL for Playwright smoke tests (local tooling)",
    format: "url",
    requiredIn: [],
    optionalIn: ["development"],
  },
] as const;

export function getEnvVarDefinition(name: string): EnvVarDefinition | undefined {
  return ENV_VAR_DEFINITIONS.find((definition) => definition.name === name);
}
