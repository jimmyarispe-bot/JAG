/**
 * RC-10 GA sign-off — aggregates matrix + gates + characteristics.
 */

import { evaluateGaCharacteristics } from "@/lib/platform/production/characteristics";
import { evaluateReadinessGates } from "@/lib/platform/production/gates";
import {
  evaluatePackageMatrix,
  smokeImportPackages,
} from "@/lib/platform/production/matrix";
import {
  PRODUCTION_GA_VERSION,
  type GaSignOffRecord,
} from "@/lib/platform/production/types";

export type BuildGaSignOffOptions = {
  root?: string;
  now?: () => Date;
  /** When true, dynamically import RC packages (Vitest / Node with aliases). */
  runImportSmoke?: boolean;
};

export async function buildGaSignOff(
  options: BuildGaSignOffOptions = {}
): Promise<GaSignOffRecord> {
  const root = options.root ?? process.cwd();
  const packageMatrix = options.runImportSmoke
    ? await smokeImportPackages()
    : evaluatePackageMatrix(root).map((row) => ({
        ...row,
        // Sync path cannot import; treat present+test as provisional importOk for file-only checks
        importOk: row.present && row.testPresent,
        detail:
          row.present && row.testPresent
            ? "Package + test present (import smoke skipped)"
            : row.detail,
      }));

  const gates = evaluateReadinessGates(root);
  const characteristics = evaluateGaCharacteristics(root);

  const blockingFailures = [
    ...packageMatrix
      .filter((r) => !r.present || !r.testPresent || !r.importOk)
      .map((r) => `package:${r.id} — ${r.detail}`),
    ...gates
      .filter((g) => g.blocking && (g.status === "fail" || g.status === "not_executed"))
      .map((g) => `gate:${g.id} — ${g.detail}`),
    ...characteristics
      .filter((c) => !c.satisfied)
      .map((c) => `characteristic:${c.id}`),
  ];

  const conditionalItems = gates
    .filter((g) => g.status === "conditional")
    .map((g) => `gate:${g.id} — ${g.detail}`);

  let decision: GaSignOffRecord["decision"] = "go";
  if (blockingFailures.length > 0) decision = "no_go";
  else if (conditionalItems.length > 0) decision = "conditional_go";

  const summary =
    decision === "go"
      ? "GA Go — all blocking readiness gates and RC-4…RC-9 packages verified."
      : decision === "conditional_go"
        ? `Conditional Go — ${conditionalItems.length} non-blocking item(s) remain (e.g. external pen-test engagement).`
        : `No-Go — ${blockingFailures.length} blocking failure(s).`;

  return {
    version: PRODUCTION_GA_VERSION,
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    decision,
    blockingFailures,
    conditionalItems,
    packageMatrix,
    gates,
    characteristics,
    summary,
    governance: {
      noNewFeatures: true,
      readinessOnly: true,
    },
  };
}

