import type { ReleaseReadinessDashboard } from "../validation/types";
import type {
  GateStatus,
  HardeningSuiteResult,
  Rc2HardeningSummary,
  Rc2ReleaseReadinessDashboard,
} from "./types";

function gateFor(
  results: readonly HardeningSuiteResult[],
  ids: readonly string[]
): GateStatus {
  const subset = results.filter((r) => ids.includes(r.id));
  if (subset.length === 0) return "Not run";
  if (subset.every((r) => r.passed)) return "Pass";
  if (subset.some((r) => r.blockers.length > 0)) return "Fail";
  return "Pass with issues";
}

export function buildRc2HardeningSummary(
  results: readonly HardeningSuiteResult[]
): Rc2HardeningSummary {
  const suitesPassed = results.filter((r) => r.passed).length;
  const suitesFailed = results.length - suitesPassed;
  const outstandingBlockers = results.flatMap((r) =>
    r.assertions
      .filter(
        (a) =>
          !a.ok && (a.severity === "blocker" || a.severity === "critical")
      )
      .map((a) => ({
        suiteId: r.id,
        detail: `${a.name}: ${a.detail ?? "failed"}`,
        severity: a.severity,
      }))
  );

  const rcRecommendation =
    outstandingBlockers.some((b) => b.severity === "blocker")
      ? ("Blocked — remediation required" as const)
      : suitesFailed > 0 ||
          outstandingBlockers.some((b) => b.severity === "critical")
        ? ("Ready with known issues" as const)
        : ("Ready for RC-3" as const);

  return {
    securityStatus: gateFor(results, ["security", "multi_tenant_isolation"]),
    performanceStatus: gateFor(results, ["performance"]),
    accessibilityStatus: gateFor(results, ["accessibility"]),
    operationalReadiness: gateFor(results, [
      "resilience",
      "audit_observability",
      "backup_recovery",
    ]),
    deploymentReadiness: gateFor(results, ["deployment"]),
    outstandingBlockers: Object.freeze(outstandingBlockers),
    rcRecommendation,
    suitesPassed,
    suitesFailed,
    totalSuites: results.length,
    results: Object.freeze([...results]),
  };
}

export function mergeRc2Dashboard(input: {
  rc1: ReleaseReadinessDashboard;
  hardening: Rc2HardeningSummary;
}): Rc2ReleaseReadinessDashboard {
  const recommendation =
    input.hardening.rcRecommendation === "Blocked — remediation required" ||
    input.rc1.recommendation === "Blocked — remediation required"
      ? ("Blocked — remediation required" as const)
      : input.hardening.rcRecommendation === "Ready with known issues" ||
          input.rc1.recommendation === "Ready with known issues"
        ? ("Ready with known issues" as const)
        : input.hardening.rcRecommendation === "Ready for RC-3"
          ? ("Ready for RC-3" as const)
          : input.rc1.recommendation;

  const openBlockers = [
    ...input.rc1.openBlockers,
    ...input.hardening.outstandingBlockers.map((b) => ({
      scenarioId: b.suiteId,
      detail: b.detail,
      severity: b.severity,
    })),
  ];

  const performanceBaselines = [
    ...input.rc1.performanceBaselines,
    ...input.hardening.results.flatMap((r) => r.performance),
  ];

  return {
    ...input.rc1,
    recommendation,
    openBlockers: Object.freeze(openBlockers),
    criticalDefects: Object.freeze([
      ...input.rc1.criticalDefects,
      ...input.hardening.outstandingBlockers
        .filter((b) => b.severity === "critical")
        .map((b) => `[${b.suiteId}] ${b.detail}`),
    ]),
    performanceBaselines: Object.freeze(performanceBaselines),
    generatedAt: new Date().toISOString(),
    rc2: input.hardening,
  };
}
