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
    description:
      "Public application base URL used in auth links and merge fields. Production for The JAG™ must be https://www.thejag.org (apex redirects at the edge).",
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
    name: "RESEND_API_KEY",
    description: "Resend API key for transactional email (C-6.2)",
    secret: true,
    requiredIn: ["preview", "production"],
    optionalIn: ["development"],
  },
  {
    name: "EMAIL_FROM",
    description:
      "Default From address for outbound email (verified domain; default noreply@theacademyway.org)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "RESEND_FROM_EMAIL",
    description:
      "Legacy alias for EMAIL_FROM (prefer EMAIL_FROM; verified Resend domain)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "RESEND_FROM_NAME",
    description:
      "Default From display name for outbound email (default: The Academy Way)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "VAULT_ENCRYPTION_KEY",
    description: "Encryption key for Integration Hub vault secrets (min 32 chars; required in production)",
    secret: true,
    requiredIn: ["production"],
    optionalIn: ["development", "preview"],
  },
  {
    name: "OAUTH_STATE_SECRET",
    description: "HMAC secret for signed OAuth state (falls back to VAULT_ENCRYPTION_KEY / CRON_SECRET)",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "GOOGLE_WORKSPACE_CLIENT_ID",
    description: "OAuth client ID for Google Workspace tenant connect (RC-2.01)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "GOOGLE_WORKSPACE_CLIENT_SECRET",
    description: "OAuth client secret for Google Workspace tenant connect (RC-2.01)",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "QUICKBOOKS_CLIENT_ID",
    description: "OAuth client ID for QuickBooks Online Connector™ (JAG Sprint 003B)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "QUICKBOOKS_CLIENT_SECRET",
    description: "OAuth client secret for QuickBooks Online Connector™",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "QUICKBOOKS_ENVIRONMENT",
    description: "QuickBooks API environment: sandbox | production (default sandbox)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "ENFORCE_MFA",
    description: "Force MFA enrollment for privileged users (true/false; default true in production)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Optional durable rate-limit backend (Upstash Redis REST)",
    format: "url",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Optional Upstash Redis REST token",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "TURNSTILE_SECRET_KEY",
    description: "Optional Cloudflare Turnstile secret for public admissions inquiry",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "ALLOW_SQUARE_PLANNED",
    description: "Allow simulated square_planned payment methods (non-production only)",
    requiredIn: [],
    optionalIn: ["development", "preview"],
  },
  {
    name: "EXEC_OPERATING_MODE",
    description: "Executive Command Center mode: demo | tenant (default: tenant when org context exists)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "ALLOW_EXEC_DEMO_MODE",
    description: "Allow EXEC_OPERATING_MODE=demo in production (explicit opt-in only)",
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
  {
    name: "OTEL_EXPORTER_OTLP_ENDPOINT",
    description: "Optional OpenTelemetry OTLP/HTTP endpoint (e.g. https://otel.example.com)",
    format: "url",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "OTEL_EXPORTER_OTLP_HEADERS",
    description: "Optional OTLP headers as comma-separated key=value pairs",
    secret: true,
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "OTEL_SERVICE_NAME",
    description: "OpenTelemetry service.name resource attribute (default: jag)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "OBSERVABILITY_LOG_LEVEL",
    description: "Structured log level: debug | info | warn | error (default: info)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "NEXT_PUBLIC_RUM_SAMPLE_RATE",
    description: "Client RUM sample rate 0..1 (default: 1)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
  {
    name: "OBSERVABILITY_SLOW_QUERY_MS",
    description: "Slow query threshold in milliseconds (default: 500)",
    requiredIn: [],
    optionalIn: ["development", "preview", "production"],
  },
] as const;

export function getEnvVarDefinition(name: string): EnvVarDefinition | undefined {
  return ENV_VAR_DEFINITIONS.find((definition) => definition.name === name);
}
