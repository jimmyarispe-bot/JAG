/**
 * Multi-scenario comparison model — Sprint 202.
 */

import type { ScenarioResult } from "./ScenarioResult";

export type ScenarioComparisonRow = {
  readonly scenarioId: string;
  readonly title: string;
  readonly kind: string;
  readonly scoreDelta: number;
  readonly scenarioScore: number;
  readonly confidence: number;
  readonly riskCount: number;
  readonly opportunityCount: number;
  readonly stance: string;
  readonly summary: string;
};

export type ScenarioComparison = {
  readonly id: string;
  readonly generatedAt: string;
  readonly organizationId: string;
  readonly baselineLabel: string;
  readonly rows: readonly ScenarioComparisonRow[];
  readonly mostFavorableId: string | null;
  readonly highestRiskId: string | null;
  readonly highestConfidenceId: string | null;
  readonly narrative: string;
  readonly advisoryNotice: string;
};

export function compareScenarios(input: {
  readonly organizationId: string;
  readonly results: readonly ScenarioResult[];
  readonly includeCurrentBaseline?: boolean;
}): ScenarioComparison {
  const rows: ScenarioComparisonRow[] = [];

  if (input.includeCurrentBaseline !== false && input.results[0]) {
    const first = input.results[0];
    rows.push({
      scenarioId: "current",
      title: "Current",
      kind: "baseline",
      scoreDelta: 0,
      scenarioScore: first.currentState.score,
      confidence: 1,
      riskCount: 0,
      opportunityCount: 0,
      stance: first.currentState.stance,
      summary: first.currentState.summary,
    });
  }

  for (const r of input.results) {
    rows.push({
      scenarioId: r.id,
      title: r.title,
      kind: r.kind,
      scoreDelta: r.projectedDifference.scoreDelta,
      scenarioScore: r.scenarioState.score,
      confidence: r.confidence,
      riskCount: r.risks.length,
      opportunityCount: r.opportunities.length,
      stance: r.scenarioState.stance,
      summary: r.projectedDifference.summary,
    });
  }

  const scenarioRows = rows.filter((r) => r.scenarioId !== "current");
  const mostFavorable =
    scenarioRows.slice().sort((a, b) => b.scoreDelta - a.scoreDelta)[0] ?? null;
  const highestRisk =
    scenarioRows.slice().sort((a, b) => b.riskCount - a.riskCount || a.scoreDelta - b.scoreDelta)[0] ??
    null;
  const highestConfidence =
    scenarioRows.slice().sort((a, b) => b.confidence - a.confidence)[0] ?? null;

  return {
    id: `scmp-${input.organizationId}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    organizationId: input.organizationId,
    baselineLabel: "Current (observed / bound baseline)",
    rows,
    mostFavorableId: mostFavorable?.scenarioId ?? null,
    highestRiskId: highestRisk?.scenarioId ?? null,
    highestConfidenceId: highestConfidence?.scenarioId ?? null,
    narrative: [
      "Side-by-side advisory comparison — not certainty.",
      mostFavorable
        ? `Most favorable projected option: ${mostFavorable.title} (Δ ${formatDelta(mostFavorable.scoreDelta)}).`
        : "No scenario options to rank.",
      highestRisk
        ? `Highest risk option: ${highestRisk.title} (${highestRisk.riskCount} risk signal(s)).`
        : "",
      highestConfidence
        ? `Highest confidence option: ${highestConfidence.title} (${(highestConfidence.confidence * 100).toFixed(0)}%).`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    advisoryNotice:
      "Advisory scenario projections are hypothetical — not certainty. Separate observed facts, forecasts, and assumptions before deciding.",
  };
}

function formatDelta(n: number): string {
  const pct = (n * 100).toFixed(1);
  return n >= 0 ? `+${pct} pts` : `${pct} pts`;
}
