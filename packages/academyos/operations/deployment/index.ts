/**
 * Deployment Engine — validate production install readiness (no deploy side-effects).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ACADEMYOS_EXTENSION_MANIFEST,
  ACADEMYOS_PACK_VERSION,
} from "../../manifest";
import { EDUCATION_CONNECTOR_CATALOG } from "../../connectors/catalog";
import type {
  DeploymentReport,
  OpsCheck,
  OpsEnvironment,
  OperationsRunOptions,
} from "../types";

function envMode(
  options?: OperationsRunOptions
): OpsEnvironment {
  if (options?.environment) return options.environment;
  const e = options?.env ?? process.env;
  if (e.NODE_ENV === "production") return "production";
  if (e.NODE_ENV === "test") return "test";
  return "development";
}

function check(
  id: string,
  name: string,
  ok: boolean,
  detail: string,
  severity: OpsCheck["severity"] = "error",
  evidence: string[] = [],
  recommendation?: string
): OpsCheck {
  return {
    id,
    name,
    ok,
    severity: ok ? "info" : severity,
    detail,
    evidence: Object.freeze(evidence),
    recommendation,
  };
}

export function validateDeployment(
  options: OperationsRunOptions = {}
): DeploymentReport {
  const root = options.root ?? process.cwd();
  const env = options.env ?? process.env;
  const environment = envMode(options);
  const production = environment === "production";
  const checks: OpsCheck[] = [];

  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  if (production) {
    requiredEnv.push("SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY");
  }

  const missingRequired: string[] = [];
  for (const key of requiredEnv) {
    const present = Boolean(env[key]?.trim());
    if (!present) missingRequired.push(key);
    checks.push(
      check(
        `deploy.env.${key}`,
        `Env ${key}`,
        present || !production,
        present
          ? "configured"
          : production
            ? "missing required for production"
            : "optional in non-production (warning)",
        production ? "critical" : "warning",
        [`env=${key}`],
        present ? undefined : `Set ${key} in the deployment environment`
      )
    );
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  let supabaseOk = !supabaseUrl;
  if (supabaseUrl) {
    try {
      const u = new URL(supabaseUrl);
      supabaseOk = u.protocol === "http:" || u.protocol === "https:";
    } catch {
      supabaseOk = false;
    }
  }
  checks.push(
    check(
      "deploy.supabase.url",
      "Supabase URL shape",
      supabaseOk || (!production && !supabaseUrl),
      supabaseOk || !supabaseUrl
        ? "Supabase URL acceptable for environment"
        : "Invalid Supabase URL",
      "critical",
      ["NEXT_PUBLIC_SUPABASE_URL"]
    )
  );

  checks.push(
    check(
      "deploy.auth",
      "Authentication configuration",
      Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) || !production,
      "Supabase anon key drives auth client configuration",
      production ? "critical" : "warning",
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    )
  );

  checks.push(
    check(
      "deploy.storage",
      "Storage configuration",
      true,
      "Storage uses Supabase buckets; host-managed",
      "info",
      ["supabase-storage"]
    )
  );

  const emailConfigured = Boolean(env.RESEND_API_KEY?.trim());
  checks.push(
    check(
      "deploy.email",
      "Email configuration",
      emailConfigured || !production,
      emailConfigured
        ? "Resend API key present"
        : "Email provider not configured",
      production ? "error" : "warning",
      ["RESEND_API_KEY"],
      emailConfigured ? undefined : "Configure RESEND_API_KEY for notifications"
    )
  );

  checks.push(
    check(
      "deploy.connectors",
      "Connector catalog",
      EDUCATION_CONNECTOR_CATALOG.length > 0,
      `${EDUCATION_CONNECTOR_CATALOG.length} education connector(s) registered in pack`,
      "critical",
      EDUCATION_CONNECTOR_CATALOG.map((c) => c.id).slice(0, 8)
    )
  );

  const featureFlagDocs = existsSync(
    join(root, "docs/academyos/rc3/02_CONFIGURATION.md")
  );
  checks.push(
    check(
      "deploy.feature_flags",
      "Feature flags documented",
      featureFlagDocs,
      featureFlagDocs
        ? "Feature flag guidance present in RC-3 configuration docs"
        : "Missing RC-3 configuration documentation",
      "error",
      ["docs/academyos/rc3/02_CONFIGURATION.md"]
    )
  );

  const deployDocs = existsSync(join(root, "docs/academyos/rc3/01_DEPLOYMENT.md"));
  checks.push(
    check(
      "deploy.docs",
      "Deployment documentation",
      deployDocs,
      deployDocs ? "RC-3 deployment guide present" : "Missing deployment guide",
      "critical",
      ["docs/academyos/rc3/01_DEPLOYMENT.md"]
    )
  );

  const opsApi = existsSync(
    join(root, "src/app/api/academyos/operations/deployment/route.ts")
  );
  checks.push(
    check(
      "deploy.api",
      "Operations deployment API",
      opsApi,
      opsApi ? "Deployment validation API route present" : "Missing API route",
      "error",
      ["src/app/api/academyos/operations/deployment/route.ts"]
    )
  );

  const platformMin =
    ACADEMYOS_EXTENSION_MANIFEST.minimumPlatformVersion ?? "1.0.0";
  const sdkMin = ACADEMYOS_EXTENSION_MANIFEST.minimumSdkVersion ?? "1.0.0";
  const compatible = platformMin.startsWith("1.") && sdkMin.startsWith("1.");
  checks.push(
    check(
      "deploy.version",
      "Version compatibility",
      compatible,
      `AcademyOS ${ACADEMYOS_PACK_VERSION} ↔ platform ${platformMin} / sdk ${sdkMin}`,
      "critical",
      [`pack=${ACADEMYOS_PACK_VERSION}`, `platform=${platformMin}`, `sdk=${sdkMin}`]
    )
  );

  const blocking = checks.filter(
    (c) =>
      !c.ok && (c.severity === "critical" || c.severity === "error")
  );
  // In non-production, missing secrets are warnings only
  const passed =
    blocking.length === 0 &&
    (missingRequired.length === 0 || !production);

  return {
    generatedAt: new Date().toISOString(),
    environment,
    passed,
    checks: Object.freeze(checks),
    missingRequired: Object.freeze(
      production ? missingRequired : ([] as string[])
    ),
    versionCompatibility: {
      packVersion: ACADEMYOS_PACK_VERSION,
      platformMin,
      sdkMin,
      compatible,
    },
    summary: passed
      ? `Deployment validation passed for ${environment}`
      : `Deployment validation failed (${blocking.length} blocking check(s))`,
  };
}
