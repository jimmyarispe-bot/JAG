/**
 * Diagnostics — actionable operational findings.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { EDUCATION_CONNECTOR_CATALOG } from "../../connectors/catalog";
import { ACADEMYOS_PACK_VERSION } from "../../manifest";
import { validateBackupRecovery } from "../backup";
import { validateConfiguration } from "../configuration";
import { validateDeployment } from "../deployment";
import { buildHealthReport } from "../health";
import { validateUpgrade } from "../upgrades";
import type {
  BackupValidationReport,
  ConfigurationReport,
  DeploymentReport,
  DiagnosticsReport,
  HealthReport,
  HealthStatus,
  OpsCheck,
  OperationsRunOptions,
  UpgradeReport,
} from "../types";

export type DiagnosticsEvidence = {
  readonly deployment?: DeploymentReport;
  readonly configuration?: ConfigurationReport;
  readonly health?: HealthReport;
  readonly upgrades?: UpgradeReport;
  readonly backup?: BackupValidationReport;
};

export function runDiagnostics(
  options: OperationsRunOptions = {},
  evidence?: DiagnosticsEvidence
): DiagnosticsReport {
  const root = options.root ?? process.cwd();
  const deployment = evidence?.deployment ?? validateDeployment(options);
  const configuration =
    evidence?.configuration ?? validateConfiguration(options);
  const health = evidence?.health ?? buildHealthReport(options);
  const upgrades = evidence?.upgrades ?? validateUpgrade(options);
  const backup = evidence?.backup ?? validateBackupRecovery(options);

  const findings: OpsCheck[] = [];

  for (const c of deployment.checks.filter((x) => !x.ok)) {
    findings.push({ ...c, id: `diag.deploy.${c.id}` });
  }
  for (const c of configuration.checks.filter((x) => !x.ok)) {
    findings.push({ ...c, id: `diag.cfg.${c.id}` });
  }
  for (const cat of health.categories) {
    for (const c of cat.checks.filter((x) => !x.ok)) {
      findings.push({ ...c, id: `diag.health.${c.id}` });
    }
  }
  for (const c of upgrades.checklist.filter((x) => !x.ok)) {
    findings.push({ ...c, id: `diag.upgrade.${c.id}` });
  }
  if (!backup.passed) {
    findings.push({
      id: "diag.backup",
      name: "Backup / recovery",
      ok: false,
      severity: "error",
      detail: backup.summary,
      evidence: Object.freeze(backup.workflows.map((w) => w.id)),
      recommendation: backup.recommendations[0],
    });
  }

  findings.push({
    id: "diag.permissions.docs",
    name: "Permission evidence",
    ok: existsSync(join(root, "docs/academyos/rc2/01_SECURITY.md")),
    severity: "warning",
    detail: "RC-2 security evidence remains the permission baseline",
    evidence: Object.freeze(["docs/academyos/rc2/01_SECURITY.md"]),
  });

  findings.push({
    id: "diag.connectors",
    name: "Connector diagnostics",
    ok: EDUCATION_CONNECTOR_CATALOG.length >= 7,
    severity: "error",
    detail: `${EDUCATION_CONNECTOR_CATALOG.length} connectors; statuses are pack stubs`,
    evidence: Object.freeze(
      EDUCATION_CONNECTOR_CATALOG.map((c) => `${c.id}:${c.status}`)
    ),
  });

  findings.push({
    id: "diag.notifications",
    name: "Notification channel",
    ok:
      Boolean((options.env ?? process.env).RESEND_API_KEY?.trim()) ||
      configuration.environment !== "production",
    severity: "warning",
    detail: "Email channel configuration",
    evidence: Object.freeze(["RESEND_API_KEY"]),
  });

  findings.push({
    id: "diag.queues",
    name: "Queue documentation",
    ok: existsSync(join(root, "docs/academyos/rc3/08_RUNBOOK.md")),
    severity: "warning",
    detail: "Queue / job handling described in runbook",
    evidence: Object.freeze(["docs/academyos/rc3/08_RUNBOOK.md"]),
  });

  findings.push({
    id: "diag.migrations",
    name: "Migrations present",
    ok: upgrades.migrationOrderingOk,
    severity: upgrades.migrationOrderingOk ? "info" : "critical",
    detail:
      upgrades.checklist.find((c) => c.id === "upgrade.migrations")?.detail ??
      "migrations",
    evidence: Object.freeze(["supabase/migrations"]),
  });

  findings.push({
    id: "diag.version",
    name: "Version compatibility",
    ok: upgrades.compatibilityOk,
    severity: upgrades.compatibilityOk ? "info" : "critical",
    detail: `AcademyOS ${ACADEMYOS_PACK_VERSION}`,
    evidence: Object.freeze([ACADEMYOS_PACK_VERSION]),
  });

  const actionable = findings
    .filter((f) => !f.ok)
    .map((f) => f.recommendation ?? `${f.name}: ${f.detail}`);

  const status: HealthStatus = findings.some(
    (f) => !f.ok && f.severity === "critical"
  )
    ? "Critical"
    : findings.some(
          (f) => !f.ok && (f.severity === "error" || f.severity === "warning")
        )
      ? "Warning"
      : "Healthy";

  const passed =
    deployment.passed &&
    configuration.passed &&
    upgrades.passed &&
    backup.passed &&
    health.status !== "Critical";

  return {
    generatedAt: new Date().toISOString(),
    passed,
    status,
    findings: Object.freeze(findings),
    actionable: Object.freeze(actionable),
    summary: passed
      ? `Diagnostics clear — ${findings.length} checks reviewed`
      : `Diagnostics found ${actionable.length} actionable issue(s)`,
  };
}
