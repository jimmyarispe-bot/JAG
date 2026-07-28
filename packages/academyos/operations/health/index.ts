/**
 * Health System — categorical operational health.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { EDUCATION_CONNECTOR_CATALOG } from "../../connectors/catalog";
import { ACADEMYOS_PACK_ID } from "../../manifest";
import { validateConfiguration } from "../configuration";
import type {
  HealthCategory,
  HealthCategoryResult,
  HealthReport,
  HealthStatus,
  OpsCheck,
  OperationsRunOptions,
} from "../types";

function worst(statuses: readonly HealthStatus[]): HealthStatus {
  if (statuses.includes("Critical")) return "Critical";
  if (statuses.includes("Warning")) return "Warning";
  return "Healthy";
}

function statusFromChecks(checks: readonly OpsCheck[]): HealthStatus {
  if (checks.some((c) => !c.ok && c.severity === "critical")) return "Critical";
  if (checks.some((c) => !c.ok && (c.severity === "error" || c.severity === "warning")))
    return "Warning";
  return "Healthy";
}

function category(
  name: HealthCategory,
  checks: OpsCheck[],
  detail: string
): HealthCategoryResult {
  const status = statusFromChecks(checks);
  return {
    category: name,
    status,
    checks: Object.freeze(checks),
    detail,
  };
}

export function buildHealthReport(
  options: OperationsRunOptions = {}
): HealthReport {
  const root = options.root ?? process.cwd();
  const env = options.env ?? process.env;
  const cfg = validateConfiguration(options);

  const application = category(
    "Application",
    [
      {
        id: "health.app.pack",
        name: "AcademyOS pack present",
        ok: true,
        severity: "info",
        detail: `Pack ${ACADEMYOS_PACK_ID} loadable`,
        evidence: Object.freeze([ACADEMYOS_PACK_ID]),
      },
      {
        id: "health.app.ops_docs",
        name: "RC-3 ops docs",
        ok: existsSync(join(root, "docs/academyos/rc3/03_HEALTH.md")),
        severity: "error",
        detail: "Health documentation",
        evidence: Object.freeze(["docs/academyos/rc3/03_HEALTH.md"]),
      },
    ],
    "Application process and pack surface"
  );

  const database = category(
    "Database",
    [
      {
        id: "health.db.url",
        name: "Supabase configured",
        ok: Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim()) || cfg.environment !== "production",
        severity: "critical",
        detail: "Database connectivity relies on Supabase URL",
        evidence: Object.freeze(["NEXT_PUBLIC_SUPABASE_URL"]),
        recommendation: "Configure Supabase for the target environment",
      },
      {
        id: "health.db.migrations",
        name: "Migrations directory",
        ok: existsSync(join(root, "supabase/migrations")),
        severity: "error",
        detail: "Migration corpus present for upgrade validation",
        evidence: Object.freeze(["supabase/migrations"]),
      },
    ],
    "Managed Supabase / Postgres"
  );

  const authentication = category(
    "Authentication",
    [
      {
        id: "health.auth.anon",
        name: "Auth client key",
        ok:
          Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) ||
          cfg.environment !== "production",
        severity: "critical",
        detail: "Supabase anon key for session client",
        evidence: Object.freeze(["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
      },
      {
        id: "health.auth.callback",
        name: "Auth callback route",
        ok: existsSync(join(root, "src/app/auth/callback/route.ts")),
        severity: "error",
        detail: "OAuth / magic-link callback present",
        evidence: Object.freeze(["src/app/auth/callback/route.ts"]),
      },
    ],
    "Supabase Auth + app callback"
  );

  const connectors = category(
    "Connectors",
    [
      {
        id: "health.connectors.catalog",
        name: "Education connectors",
        ok: EDUCATION_CONNECTOR_CATALOG.length >= 7,
        severity: "error",
        detail: `${EDUCATION_CONNECTOR_CATALOG.length} connectors in catalog`,
        evidence: Object.freeze(
          EDUCATION_CONNECTOR_CATALOG.map((c) => c.id)
        ),
      },
    ],
    "Education connector catalog (SDK stubs)"
  );

  const ei = category(
    "Executive Intelligence",
    [
      {
        id: "health.ei.provider",
        name: "Education insight provider",
        ok: existsSync(
          join(root, "packages/academyos/intelligence/insight-provider.ts")
        ),
        severity: "warning",
        detail: "Pack registers education insights without modifying EI core",
        evidence: Object.freeze([
          "packages/academyos/intelligence/insight-provider.ts",
        ]),
      },
    ],
    "Pack-local insight provider (EI core untouched)"
  );

  const studio = category(
    "Studio Integration",
    [
      {
        id: "health.studio.pkg",
        name: "JAG Studio package",
        ok: existsSync(join(root, "packages/studio/index.ts")),
        severity: "critical",
        detail: "Studio is release-readiness authority",
        evidence: Object.freeze(["packages/studio"]),
      },
      {
        id: "health.studio.gates",
        name: "Release gates module",
        ok: existsSync(join(root, "packages/studio/releases/gates.ts")),
        severity: "error",
        detail: "Governance gates available for RC evaluation",
        evidence: Object.freeze(["packages/studio/releases/gates.ts"]),
      },
    ],
    "Studio governance / certification"
  );

  const storage = category(
    "Storage",
    [
      {
        id: "health.storage.supabase",
        name: "Object storage host",
        ok: true,
        severity: "info",
        detail: "Storage is host-managed via Supabase; no pack-local store",
        evidence: Object.freeze(["supabase-storage"]),
      },
    ],
    "Document / media storage"
  );

  const notifications = category(
    "Notifications",
    [
      {
        id: "health.notify.email",
        name: "Email provider",
        ok:
          Boolean(env.RESEND_API_KEY?.trim()) ||
          cfg.environment !== "production",
        severity: "warning",
        detail: "Resend powers transactional notifications",
        evidence: Object.freeze(["RESEND_API_KEY"]),
      },
      {
        id: "health.notify.module",
        name: "Communications module",
        ok: existsSync(join(root, "packages/academyos/communications")),
        severity: "error",
        detail: "Communications pack module present",
        evidence: Object.freeze(["packages/academyos/communications"]),
      },
    ],
    "Email / messaging channels"
  );

  const jobs = category(
    "Background Jobs",
    [
      {
        id: "health.jobs.docs",
        name: "Job runbook",
        ok: existsSync(join(root, "docs/academyos/rc3/08_RUNBOOK.md")),
        severity: "warning",
        detail: "Background job operations documented in runbook",
        evidence: Object.freeze(["docs/academyos/rc3/08_RUNBOOK.md"]),
      },
    ],
    "Queues and scheduled work (host-managed)"
  );

  const categories = Object.freeze([
    application,
    database,
    authentication,
    connectors,
    ei,
    studio,
    storage,
    notifications,
    jobs,
  ]);

  const status = worst(categories.map((c) => c.status));

  return {
    generatedAt: new Date().toISOString(),
    status,
    categories,
    summary: `Overall health: ${status} (${categories.filter((c) => c.status === "Healthy").length}/${categories.length} categories healthy)`,
  };
}
