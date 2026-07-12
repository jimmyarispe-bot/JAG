/**
 * Business Model Intelligence — scenario planning (Sprint 037).
 */

import type { BusinessModelScenarioPlanner as BusinessModelScenarioPlannerContract } from "@/lib/platform/intelligence/business-model/contracts";
import {
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromScore,
} from "@/lib/platform/intelligence/business-model/models";
import type {
  BusinessModelBaseline,
  BusinessModelScenarioKind,
  BusinessModelScenarioRecord,
  BusinessModelScenarioSuite,
  OrganizationDesignSuite,
} from "@/lib/platform/intelligence/business-model/types";

const SCENARIO_SPECS: Array<{
  kind: BusinessModelScenarioKind;
  label: string;
  description: string;
  revenueMul: number;
  marginMul: number;
  missionMul: number;
  growthMul: number;
  riskMul: number;
}> = [
  {
    kind: "current",
    label: "Current Model",
    description: "Continue the existing value create/deliver/capture system",
    revenueMul: 1,
    marginMul: 1,
    missionMul: 1,
    growthMul: 1,
    riskMul: 1,
  },
  {
    kind: "alternative",
    label: "Alternative Model",
    description: "Adopt the highest-fit alternative organization design",
    revenueMul: 1.08,
    marginMul: 1.05,
    missionMul: 1.02,
    growthMul: 1.12,
    riskMul: 1.1,
  },
  {
    kind: "best_practice",
    label: "Best Practice Model",
    description: "Align to sector best-practice capture and delivery patterns",
    revenueMul: 1.12,
    marginMul: 1.1,
    missionMul: 1.05,
    growthMul: 1.15,
    riskMul: 0.9,
  },
  {
    kind: "competitor",
    label: "Competitor Model",
    description: "Mirror leading competitor economics and channel mix",
    revenueMul: 1.1,
    marginMul: 0.95,
    missionMul: 0.9,
    growthMul: 1.18,
    riskMul: 1.15,
  },
  {
    kind: "future",
    label: "Future Model",
    description: "Evolve toward platform-enabled hybrid delivery",
    revenueMul: 1.2,
    marginMul: 1.08,
    missionMul: 1.08,
    growthMul: 1.25,
    riskMul: 1.2,
  },
  {
    kind: "mission_first",
    label: "Mission-first Model",
    description: "Maximize mission impact with sustainable capture floors",
    revenueMul: 0.95,
    marginMul: 0.92,
    missionMul: 1.25,
    growthMul: 0.95,
    riskMul: 0.85,
  },
  {
    kind: "high_growth",
    label: "High-growth Model",
    description: "Prioritize expansion, channels, and capital deployment",
    revenueMul: 1.3,
    marginMul: 0.88,
    missionMul: 0.95,
    growthMul: 1.4,
    riskMul: 1.35,
  },
  {
    kind: "high_margin",
    label: "High-margin Model",
    description: "Concentrate on high-contribution offerings and cost discipline",
    revenueMul: 1.05,
    marginMul: 1.28,
    missionMul: 0.98,
    growthMul: 1.05,
    riskMul: 0.95,
  },
];

export class BusinessModelScenarioPlanner
  implements BusinessModelScenarioPlannerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  plan(input: {
    baseline: BusinessModelBaseline;
    design: OrganizationDesignSuite;
    now: Date;
  }): BusinessModelScenarioSuite {
    void input.now;
    const scenarios = SCENARIO_SPECS.map((spec) =>
      this.toScenario(spec, input.baseline, input.design)
    ).sort((a, b) => b.score - a.score);

    const preferred =
      scenarios.find((s) => s.kind === "best_practice") ?? scenarios[0]!;

    return {
      scenarios,
      preferredId: preferred.id,
      narrative: `Preferred scenario ${preferred.label} (score ${Math.round(preferred.score)}).`,
    };
  }

  private toScenario(
    spec: (typeof SCENARIO_SPECS)[number],
    baseline: BusinessModelBaseline,
    design: OrganizationDesignSuite
  ): BusinessModelScenarioRecord {
    const designBoost =
      spec.kind === "alternative" ? design.recommended.fitScore * 0.15 : 0;
    const revenueOutlook = clamp(
      baseline.valueCaptureScore * spec.revenueMul + designBoost * 0.2
    );
    const marginOutlook = clamp(baseline.grossMargin * 100 * spec.marginMul);
    const missionOutlook = clamp(baseline.missionAlignment * spec.missionMul);
    const growthOutlook = clamp(
      (baseline.growthRate * 100 + 40) * spec.growthMul
    );
    const riskOutlook = clamp(
      (baseline.operationalComplexity * 60 +
        baseline.capitalIntensity * 40) *
        spec.riskMul
    );

    const score = clamp(
      revenueOutlook * 0.22 +
        marginOutlook * 0.18 +
        missionOutlook * 0.2 +
        growthOutlook * 0.2 +
        (100 - riskOutlook) * 0.2 +
        designBoost
    );

    return {
      id: this.createId(`scenario-${spec.kind}`),
      kind: spec.kind,
      label: spec.label,
      description: spec.description,
      score,
      priority: priorityFromScore(score),
      revenueOutlook,
      marginOutlook,
      missionOutlook,
      growthOutlook,
      riskOutlook,
      lenses: buildLenses({
        valueCreated: `${spec.label} creates value through ${spec.description}.`,
        valueDelivered: `Growth outlook ${Math.round(growthOutlook)}.`,
        valueCaptured: `Revenue outlook ${Math.round(revenueOutlook)}; margin ${Math.round(marginOutlook)}.`,
        canImprove: `Scenario score ${Math.round(score)} vs current baseline.`,
        canScale: `Growth multiplier ${spec.growthMul.toFixed(2)}.`,
        canSustain: `Mission outlook ${Math.round(missionOutlook)}; risk ${Math.round(riskOutlook)}.`,
      }),
      narrative: `${spec.label}: score ${Math.round(score)}.`,
    };
  }
}
