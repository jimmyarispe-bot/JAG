/**
 * Portfolio scenario planning — advisory; integrates predictive soft-reads.
 */

import type {
  CapacitySnapshot,
  ExecutivePredictiveResultLight,
  PortfolioAnalytics,
  PortfolioScenario,
  PortfolioRequest,
  PriorityScorecard,
  ScenarioKind,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

const BASE: Array<{ kind: ScenarioKind; label: string; budget: number; capacity: number }> = [
  { kind: "current", label: "Current plan", budget: 1, capacity: 1 },
  { kind: "budget_reduction", label: "Budget reduction (−15%)", budget: 0.85, capacity: 0.95 },
  { kind: "budget_expansion", label: "Budget expansion (+15%)", budget: 1.15, capacity: 1.05 },
  { kind: "hiring_freeze", label: "Hiring freeze", budget: 1, capacity: 0.75 },
  { kind: "accelerated_growth", label: "Accelerated growth", budget: 1.2, capacity: 1.15 },
];

export function buildScenarios(input: {
  createId: (prefix: string) => string;
  request: PortfolioRequest;
  prioritization: PriorityScorecard[];
  capacity: CapacitySnapshot;
  analytics: PortfolioAnalytics;
  predictive?: ExecutivePredictiveResultLight;
}): PortfolioScenario[] {
  const scenarios: PortfolioScenario[] = BASE.map((b) => {
    const healthAdj =
      (b.budget - 1) * 20 + (b.capacity - 1) * 25 - (input.capacity.overcommitted ? 8 : 0);
    const projectedHealth = Math.max(
      0,
      Math.min(100, Math.round(input.analytics.strategicCoverage * 0.4 + 50 + healthAdj))
    );
    const projectedRoi = Math.max(
      0,
      Math.min(100, Math.round(input.analytics.expectedRoi * b.budget))
    );
    const top = input.prioritization.slice(0, 3);
    const adjustments = top.map((p, idx) => ({
      initiativeId: p.initiativeId,
      action:
        b.kind === "budget_reduction" && idx === top.length - 1
          ? "defer"
          : b.kind === "accelerated_growth" && idx === 0
            ? "accelerate"
            : b.kind === "hiring_freeze"
              ? "resource_shift"
              : "hold",
      rationale: `${b.label}: adjust ${p.title} based on capacity ${Math.round(b.capacity * 100)}% / budget ${Math.round(b.budget * 100)}%`,
    }));

    const predictiveNote =
      input.predictive?.scenarios?.[0]?.narrative ??
      input.predictive?.forecasts?.[0]?.direction ??
      "No predictive overlay";

    return {
      kind: b.kind,
      label: b.label,
      narrative: `${b.label}. Predictive soft-read: ${predictiveNote}. Advisory only — human authorization required (Sprint 066 governance).`,
      budgetMultiplier: b.budget,
      capacityMultiplier: b.capacity,
      projectedHealth,
      projectedRoi,
      initiativeAdjustments: adjustments,
    };
  });

  if (input.request.customScenario) {
    const c = input.request.customScenario;
    scenarios.push({
      kind: "custom",
      label: c.label,
      narrative: `Executive-defined scenario "${c.label}". Advisory; respects Autonomous governance.`,
      budgetMultiplier: c.budgetMultiplier,
      capacityMultiplier: c.capacityMultiplier,
      projectedHealth: Math.max(
        0,
        Math.min(
          100,
          Math.round(
            55 + (c.budgetMultiplier - 1) * 20 + (c.capacityMultiplier - 1) * 25
          )
        )
      ),
      projectedRoi: Math.max(
        0,
        Math.min(100, Math.round(input.analytics.expectedRoi * c.budgetMultiplier))
      ),
      initiativeAdjustments: input.prioritization.slice(0, 2).map((p) => ({
        initiativeId: p.initiativeId,
        action: "hold",
        rationale: `Custom scenario applied to ${p.title}`,
      })),
    });
  }

  return scenarios;
}
