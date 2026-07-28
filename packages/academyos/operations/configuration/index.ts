/**
 * Configuration Validator — development and production profiles.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  ConfigurationReport,
  OpsCheck,
  OpsEnvironment,
  OperationsRunOptions,
} from "../types";

function envMode(options?: OperationsRunOptions): OpsEnvironment {
  if (options?.environment) return options.environment;
  const e = options?.env ?? process.env;
  if (e.NODE_ENV === "production") return "production";
  if (e.NODE_ENV === "test") return "test";
  return "development";
}

export function validateConfiguration(
  options: OperationsRunOptions = {}
): ConfigurationReport {
  const root = options.root ?? process.cwd();
  const env = options.env ?? process.env;
  const environment = envMode(options);
  const production = environment === "production";

  const missing: string[] = [];
  const invalid: string[] = [];
  const deprecated: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const checks: OpsCheck[] = [];

  const keys = {
    supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
    supabaseAnon: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    serviceRole: "SUPABASE_SERVICE_ROLE_KEY",
    resend: "RESEND_API_KEY",
    resendFrom: "RESEND_FROM_EMAIL",
    legacySmtp: "SMTP_HOST",
  } as const;

  for (const [label, key] of Object.entries(keys)) {
    const value = env[key]?.trim();
    const required =
      production &&
      (key === keys.supabaseUrl ||
        key === keys.supabaseAnon ||
        key === keys.serviceRole ||
        key === keys.resend);
    if (!value) {
      if (required) missing.push(key);
      else if (key !== keys.legacySmtp) warnings.push(`${key} not set (${environment})`);
      checks.push({
        id: `cfg.${label}`,
        name: key,
        ok: !required,
        severity: required ? "critical" : "warning",
        detail: value ? "present" : required ? "missing required" : "optional unset",
        evidence: Object.freeze([key]),
        recommendation: required ? `Provide ${key}` : undefined,
      });
      continue;
    }
    if (key === keys.supabaseUrl) {
      try {
        const u = new URL(value);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          invalid.push(key);
        }
      } catch {
        invalid.push(key);
      }
    }
    checks.push({
      id: `cfg.${label}`,
      name: key,
      ok: !invalid.includes(key),
      severity: invalid.includes(key) ? "error" : "info",
      detail: invalid.includes(key) ? "invalid value" : "valid",
      evidence: Object.freeze([key]),
    });
  }

  if (env[keys.legacySmtp]?.trim()) {
    deprecated.push(keys.legacySmtp);
    recommendations.push(
      "Migrate SMTP_HOST usage to Resend (RESEND_API_KEY) — see RC-3 configuration guide"
    );
    checks.push({
      id: "cfg.deprecated.smtp",
      name: "Deprecated SMTP_HOST",
      ok: true,
      severity: "warning",
      detail: "SMTP_HOST is deprecated in favor of Resend",
      evidence: Object.freeze([keys.legacySmtp]),
      recommendation: "Remove SMTP_HOST after Resend cutover",
    });
  }

  const docsOk = existsSync(
    join(root, "docs/academyos/rc3/02_CONFIGURATION.md")
  );
  if (!docsOk) {
    missing.push("docs/academyos/rc3/02_CONFIGURATION.md");
    recommendations.push("Add RC-3 configuration documentation");
  }
  checks.push({
    id: "cfg.docs",
    name: "Configuration documentation",
    ok: docsOk,
    severity: docsOk ? "info" : "error",
    detail: docsOk ? "present" : "missing",
    evidence: Object.freeze(["docs/academyos/rc3/02_CONFIGURATION.md"]),
  });

  // Feature flags — pack uses extension featureFlags; document presence
  checks.push({
    id: "cfg.feature_flags",
    name: "Feature flag surface",
    ok: true,
    severity: "info",
    detail: "AcademyOS extension featureFlags validated at install time",
    evidence: Object.freeze(["academyos.enabled"]),
  });

  if (production && !env.RESEND_FROM_EMAIL?.trim()) {
    warnings.push("RESEND_FROM_EMAIL unset — provider may use default from-address");
    recommendations.push("Set RESEND_FROM_EMAIL for branded transactional mail");
  }

  const passed =
    missing.length === 0 &&
    invalid.length === 0 &&
    checks.every((c) => c.ok || c.severity === "warning" || c.severity === "info");

  return {
    generatedAt: new Date().toISOString(),
    environment,
    passed,
    missing: Object.freeze(missing),
    invalid: Object.freeze(invalid),
    deprecated: Object.freeze(deprecated),
    warnings: Object.freeze(warnings),
    recommendations: Object.freeze(recommendations),
    checks: Object.freeze(checks),
  };
}
