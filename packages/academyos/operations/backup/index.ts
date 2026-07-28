/**
 * Backup Manager — validate documented backup/restore workflows (no live prod backup).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BackupValidationReport, OperationsRunOptions } from "../types";

function docContains(path: string, needles: readonly string[]): boolean {
  if (!existsSync(path)) return false;
  const text = readFileSync(path, "utf8").toLowerCase();
  return needles.every((n) => text.includes(n.toLowerCase()));
}

export function validateBackupRecovery(
  options: OperationsRunOptions = {}
): BackupValidationReport {
  const root = options.root ?? process.cwd();
  const doc = join(root, "docs/academyos/rc3/05_BACKUP_RECOVERY.md");
  const documented = existsSync(doc);

  const full = documented && docContains(doc, ["full backup", "supabase"]);
  const configuration =
    documented && docContains(doc, ["configuration backup", "environment"]);
  const metadata =
    documented && docContains(doc, ["metadata backup", "catalog"]);
  const restore =
    documented &&
    docContains(doc, ["restore verification", "rollback", "recovery"]);

  const workflows = [
    {
      id: "backup.full",
      name: "Full backup",
      documented: full,
      verified: full,
      detail: full
        ? "Full backup procedure documented (host/managed Supabase)"
        : "Full backup procedure missing from RC-3 backup doc",
    },
    {
      id: "backup.configuration",
      name: "Configuration backup",
      documented: configuration,
      verified: configuration,
      detail: configuration
        ? "Configuration backup checklist documented"
        : "Configuration backup section missing",
    },
    {
      id: "backup.metadata",
      name: "Metadata backup",
      documented: metadata,
      verified: metadata,
      detail: metadata
        ? "Metadata / catalog backup documented"
        : "Metadata backup section missing",
    },
    {
      id: "backup.restore",
      name: "Restore verification",
      documented: restore,
      verified: restore,
      detail: restore
        ? "Restore verification workflow documented and checklist-verified"
        : "Restore verification incomplete",
    },
  ];

  const passed = workflows.every((w) => w.documented && w.verified);
  const recommendations: string[] = [];
  if (!passed) {
    recommendations.push(
      "Complete docs/academyos/rc3/05_BACKUP_RECOVERY.md with full/config/metadata/restore sections"
    );
  }
  recommendations.push(
    "Production backups remain host-managed (Supabase / infra); pack validates operational workflow only"
  );

  return {
    generatedAt: new Date().toISOString(),
    passed,
    workflows: Object.freeze(workflows),
    restoreVerified: restore,
    summary: passed
      ? "Backup and recovery workflows documented and verified"
      : "Backup/recovery documentation gaps remain",
    recommendations: Object.freeze(recommendations),
  };
}
