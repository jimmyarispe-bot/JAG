/**
 * Upgrade Engine — validate migration ordering, compatibility, rollback readiness.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACADEMYOS_EXTENSION_MANIFEST,
  ACADEMYOS_PACK_VERSION,
} from "../../manifest";
import type { OpsCheck, OperationsRunOptions, UpgradeReport } from "../types";

function migrationOrderingOk(root: string): {
  ok: boolean;
  detail: string;
  evidence: string[];
} {
  const dir = join(root, "supabase/migrations");
  if (!existsSync(dir)) {
    return { ok: false, detail: "migrations directory missing", evidence: [] };
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const prefixes = files.map((f) => f.split("_")[0] ?? "");
  let ordered = true;
  for (let i = 1; i < prefixes.length; i++) {
    if (prefixes[i]! < prefixes[i - 1]!) {
      ordered = false;
      break;
    }
  }
  return {
    ok: ordered && files.length > 0,
    detail: ordered
      ? `${files.length} migrations in lexicographic order`
      : "Migration prefixes are not monotonically ordered",
    evidence: files.slice(-8),
  };
}

export function validateUpgrade(
  options: OperationsRunOptions = {}
): UpgradeReport {
  const root = options.root ?? process.cwd();
  const migrations = migrationOrderingOk(root);
  const upgradeDoc = join(root, "docs/academyos/rc3/06_UPGRADES.md");
  const releaseNotes =
    existsSync(upgradeDoc) ||
    existsSync(join(root, "docs/academyos/rc2/06_RC2_RESULTS.md"));
  const rollbackDoc =
    existsSync(upgradeDoc) &&
    readFileSync(upgradeDoc, "utf8").toLowerCase().includes("rollback");
  const checklistDoc =
    existsSync(upgradeDoc) &&
    readFileSync(upgradeDoc, "utf8").toLowerCase().includes("checklist");

  const platformMin =
    ACADEMYOS_EXTENSION_MANIFEST.minimumPlatformVersion ?? "1.0.0";
  const sdkMin = ACADEMYOS_EXTENSION_MANIFEST.minimumSdkVersion ?? "1.0.0";
  const compatibilityOk =
    platformMin.startsWith("1.") && sdkMin.startsWith("1.");

  const checklist: OpsCheck[] = [
    {
      id: "upgrade.migrations",
      name: "Migration ordering",
      ok: migrations.ok,
      severity: migrations.ok ? "info" : "critical",
      detail: migrations.detail,
      evidence: Object.freeze(migrations.evidence),
    },
    {
      id: "upgrade.compatibility",
      name: "Platform / SDK compatibility",
      ok: compatibilityOk,
      severity: compatibilityOk ? "info" : "critical",
      detail: `pack ${ACADEMYOS_PACK_VERSION} requires platform ${platformMin}, sdk ${sdkMin}`,
      evidence: Object.freeze([platformMin, sdkMin]),
    },
    {
      id: "upgrade.rollback",
      name: "Rollback readiness",
      ok: rollbackDoc,
      severity: rollbackDoc ? "info" : "error",
      detail: rollbackDoc
        ? "Rollback procedure documented"
        : "Rollback section missing from upgrade guide",
      evidence: Object.freeze(["docs/academyos/rc3/06_UPGRADES.md"]),
      recommendation: "Document rollback steps before production upgrade",
    },
    {
      id: "upgrade.release_notes",
      name: "Release notes",
      ok: releaseNotes,
      severity: releaseNotes ? "info" : "error",
      detail: releaseNotes
        ? "Release notes / upgrade guide present"
        : "Missing release notes",
      evidence: Object.freeze(["docs/academyos/rc3/06_UPGRADES.md"]),
    },
    {
      id: "upgrade.checklist",
      name: "Upgrade checklist",
      ok: checklistDoc,
      severity: checklistDoc ? "info" : "error",
      detail: checklistDoc
        ? "Upgrade checklist present"
        : "Checklist missing from upgrade guide",
      evidence: Object.freeze(["docs/academyos/rc3/06_UPGRADES.md"]),
    },
  ];

  const passed = checklist.every((c) => c.ok);

  return {
    generatedAt: new Date().toISOString(),
    passed,
    fromStage: "RC-2",
    toStage: "RC-3",
    migrationOrderingOk: migrations.ok,
    compatibilityOk,
    rollbackReady: rollbackDoc,
    releaseNotesPresent: releaseNotes,
    checklist: Object.freeze(checklist),
    summary: passed
      ? "Upgrade validation succeeded (RC-2 → RC-3)"
      : "Upgrade validation failed — see checklist",
  };
}
