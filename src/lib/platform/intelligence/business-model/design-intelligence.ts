/**
 * Business Model Intelligence — organization design suite (Sprint 037).
 */

import type { OrganizationDesignEngine as OrganizationDesignEngineContract } from "@/lib/platform/intelligence/business-model/contracts";
import {
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromScore,
} from "@/lib/platform/intelligence/business-model/models";
import type {
  BusinessModelBaseline,
  OrganizationDesignKind,
  OrganizationDesignRecord,
  OrganizationDesignSuite,
} from "@/lib/platform/intelligence/business-model/types";

const DESIGN_SPECS: Array<{
  kind: OrganizationDesignKind;
  label: string;
  baseFit: number;
  capital: number;
  complexity: number;
  scale: number;
  mission: number;
  pros: string[];
  cons: string[];
}> = [
  {
    kind: "business_unit",
    label: "Business Units",
    baseFit: 70,
    capital: 0.4,
    complexity: 0.45,
    scale: 0.65,
    mission: 0.7,
    pros: ["Clear P&L ownership", "Focused accountability"],
    cons: ["Silo risk", "Duplication of shared functions"],
  },
  {
    kind: "operating_model",
    label: "Operating Model",
    baseFit: 72,
    capital: 0.35,
    complexity: 0.5,
    scale: 0.68,
    mission: 0.75,
    pros: ["Process clarity", "Decision rights"],
    cons: ["Change management burden"],
  },
  {
    kind: "franchise",
    label: "Franchise Model",
    baseFit: 55,
    capital: 0.3,
    complexity: 0.55,
    scale: 0.85,
    mission: 0.55,
    pros: ["Rapid geographic scale", "Local ownership"],
    cons: ["Brand consistency risk", "Quality control"],
  },
  {
    kind: "licensing",
    label: "Licensing Model",
    baseFit: 52,
    capital: 0.2,
    complexity: 0.35,
    scale: 0.8,
    mission: 0.5,
    pros: ["Asset-light expansion", "IP leverage"],
    cons: ["Limited control", "Partner dependency"],
  },
  {
    kind: "platform",
    label: "Platform Model",
    baseFit: 60,
    capital: 0.55,
    complexity: 0.65,
    scale: 0.9,
    mission: 0.6,
    pros: ["Network effects", "High scalability"],
    cons: ["High build cost", "Chicken-egg adoption"],
  },
  {
    kind: "marketplace",
    label: "Marketplace Model",
    baseFit: 48,
    capital: 0.5,
    complexity: 0.7,
    scale: 0.88,
    mission: 0.45,
    pros: ["Two-sided growth", "Variable cost structure"],
    cons: ["Liquidity chicken-egg", "Trust & safety load"],
  },
  {
    kind: "subscription",
    label: "Subscription Model",
    baseFit: 68,
    capital: 0.35,
    complexity: 0.4,
    scale: 0.78,
    mission: 0.65,
    pros: ["Predictable revenue", "Retention focus"],
    cons: ["Churn sensitivity", "Continuous value delivery"],
  },
  {
    kind: "hybrid",
    label: "Hybrid Model",
    baseFit: 74,
    capital: 0.45,
    complexity: 0.58,
    scale: 0.72,
    mission: 0.78,
    pros: ["Diversified capture", "Mission + margin balance"],
    cons: ["Focus dilution", "Operating complexity"],
  },
  {
    kind: "multi_entity",
    label: "Multi-Entity Structure",
    baseFit: 58,
    capital: 0.5,
    complexity: 0.72,
    scale: 0.7,
    mission: 0.68,
    pros: ["Risk isolation", "Regulatory flexibility"],
    cons: ["Governance overhead", "Intercompany friction"],
  },
  {
    kind: "holding_company",
    label: "Holding Company",
    baseFit: 45,
    capital: 0.6,
    complexity: 0.75,
    scale: 0.75,
    mission: 0.55,
    pros: ["Portfolio strategy", "Capital allocation"],
    cons: ["Distance from operations", "Corporate overhead"],
  },
  {
    kind: "shared_services",
    label: "Shared Services",
    baseFit: 66,
    capital: 0.38,
    complexity: 0.52,
    scale: 0.7,
    mission: 0.72,
    pros: ["Cost efficiency", "Standardization"],
    cons: ["Service-level tension", "Change lag"],
  },
];

export class OrganizationDesignEngine
  implements OrganizationDesignEngineContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: BusinessModelBaseline;
    now: Date;
  }): OrganizationDesignSuite {
    void input.now;
    const records = DESIGN_SPECS.map((spec) =>
      this.toRecord(spec, input.baseline)
    ).sort((a, b) => b.fitScore - a.fitScore);

    const currentKind = inferCurrentKind(input.baseline.archetype);
    const current =
      records.find((r) => r.kind === currentKind) ?? records[0]!;
    const recommended = records[0]!;
    const alternatives = records.filter((r) => r.id !== current.id).slice(0, 6);

    return {
      current,
      alternatives,
      recommended,
      narrative: `Current design ${current.label}; recommended ${recommended.label} (fit ${Math.round(recommended.fitScore)}).`,
    };
  }

  private toRecord(
    spec: (typeof DESIGN_SPECS)[number],
    baseline: BusinessModelBaseline
  ): OrganizationDesignRecord {
    const archetypeBoost =
      baseline.archetype.toLowerCase().includes(spec.kind.replace("_", "")) ||
      baseline.archetype.toLowerCase().includes(spec.label.split(" ")[0]!.toLowerCase())
        ? 8
        : 0;
    const fitScore = clamp(
      spec.baseFit +
        archetypeBoost +
        baseline.scalabilityScore * 0.08 -
        Math.abs(spec.complexity - baseline.operationalComplexity) * 20 +
        baseline.missionAlignment * 0.05 -
        Math.abs(spec.capital - baseline.capitalIntensity) * 15
    );

    return {
      id: this.createId(`design-${spec.kind}`),
      kind: spec.kind,
      label: spec.label,
      fitScore,
      priority: priorityFromScore(100 - fitScore),
      pros: spec.pros,
      cons: spec.cons,
      capitalIntensity: spec.capital,
      operationalComplexity: spec.complexity,
      scalability: spec.scale,
      missionFit: spec.mission,
      lenses: buildLenses({
        valueCreated: `${spec.label} creates value via ${spec.pros[0]}.`,
        valueDelivered: `Delivery complexity ${Math.round(spec.complexity * 100)}.`,
        valueCaptured: `Capital intensity ${Math.round(spec.capital * 100)}.`,
        canImprove: `Fit score ${Math.round(fitScore)} indicates improvement headroom.`,
        canScale: `Scalability ${Math.round(spec.scale * 100)}.`,
        canSustain: `Mission fit ${Math.round(spec.mission * 100)}.`,
      }),
      narrative: `${spec.label} fit ${Math.round(fitScore)}.`,
    };
  }
}

function inferCurrentKind(archetype: string): OrganizationDesignKind {
  const a = archetype.toLowerCase();
  if (a.includes("franchise")) return "franchise";
  if (a.includes("license")) return "licensing";
  if (a.includes("platform")) return "platform";
  if (a.includes("market")) return "marketplace";
  if (a.includes("subscription") || a.includes("saas")) return "subscription";
  if (a.includes("holding")) return "holding_company";
  if (a.includes("multi")) return "multi_entity";
  if (a.includes("shared")) return "shared_services";
  if (a.includes("hybrid") || a.includes("mission")) return "hybrid";
  return "operating_model";
}
