import type {
  DomainCoverage,
  PerformanceSample,
  ReleaseReadinessDashboard,
  ReleaseRecommendation,
  ValidationDomain,
  ValidationScenarioResult,
} from "./types";
import { VALIDATION_DOMAINS } from "./types";

export function buildReleaseReadinessDashboard(input: {
  results: readonly ValidationScenarioResult[];
  organizationId?: string | null;
}): ReleaseReadinessDashboard {
  const results = input.results;
  const scenariosPassed = results.filter((r) => r.passed).length;
  const scenariosFailed = results.length - scenariosPassed;
  const passRate =
    results.length === 0
      ? 0
      : Math.round((scenariosPassed / results.length) * 1000) / 10;

  const coverageByDomain: DomainCoverage[] = VALIDATION_DOMAINS.map((domain) => {
    const related = results.filter((r) => r.domains.includes(domain));
    const passed = related.filter((r) => r.passed).length;
    return {
      domain,
      scenarios: related.length,
      passed,
      failed: related.length - passed,
      coveragePercent:
        related.length === 0
          ? 0
          : Math.round((passed / related.length) * 1000) / 10,
    };
  }).filter((d) => d.scenarios > 0);

  const openBlockers = results.flatMap((r) =>
    r.assertions
      .filter(
        (a) =>
          !a.ok && (a.severity === "blocker" || a.severity === "critical")
      )
      .map((a) => ({
        scenarioId: r.id,
        detail: `${a.name}: ${a.detail ?? "failed"}`,
        severity: a.severity,
      }))
  );

  const criticalDefects = results.flatMap((r) =>
    r.assertions
      .filter((a) => !a.ok && a.severity === "critical")
      .map((a) => `[${r.id}] ${a.name}: ${a.detail ?? "failed"}`)
  );

  const performanceBaselines: PerformanceSample[] = results.flatMap(
    (r) => r.performance
  );

  const recommendation: ReleaseRecommendation =
    openBlockers.some((b) => b.severity === "blocker")
      ? "Blocked — remediation required"
      : scenariosFailed > 0 || criticalDefects.length > 0
        ? "Ready with known issues"
        : "Ready for RC-2";

  return {
    organizationId: input.organizationId ?? null,
    generatedAt: new Date().toISOString(),
    scenariosPassed,
    scenariosFailed,
    totalScenarios: results.length,
    passRate,
    coverageByDomain: Object.freeze(coverageByDomain),
    openBlockers: Object.freeze(openBlockers),
    criticalDefects: Object.freeze(criticalDefects),
    performanceBaselines: Object.freeze(performanceBaselines),
    recommendation,
    results: Object.freeze([...results]),
  };
}

export function domainCoverageMap(
  dashboard: ReleaseReadinessDashboard
): Readonly<Record<ValidationDomain, number>> {
  const out = {} as Record<ValidationDomain, number>;
  for (const d of dashboard.coverageByDomain) {
    out[d.domain] = d.coveragePercent;
  }
  return Object.freeze(out);
}
