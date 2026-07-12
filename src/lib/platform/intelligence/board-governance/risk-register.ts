/**
 * Board & Governance Intelligence — RiskRegister (Sprint 029).
 */

import type { RiskRegister as RiskRegisterContract } from "@/lib/platform/intelligence/board-governance/contracts";
import {
  priorityFromRisk,
  clamp01,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  GovernanceBaseline,
  GovernanceRequest,
  RiskHeatMapCell,
  RiskRegisterEntry,
} from "@/lib/platform/intelligence/board-governance/types";

export interface RiskRegisterDependencies {
  createId?: (prefix: string) => string;
}

/**
 * RiskRegister — board-facing risk inventory + heat map.
 */
export class RiskRegisterEngine implements RiskRegisterContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: RiskRegisterDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): RiskRegisterEntry[] {
    if (input.request.risks && input.request.risks.length > 0) {
      return input.request.risks.slice(0, input.request.maxRisks ?? 12);
    }

    const founderRisks = input.request.graphInput?.founder?.risks ?? [];
    const predictionRisks =
      input.request.predictionResult?.projection.emergingRisks ?? [];
    const decisionRisks =
      input.request.decisionResult?.projection?.keyRisks ?? [];

    const entries: RiskRegisterEntry[] = [];

    for (const risk of founderRisks.slice(0, 4)) {
      const likelihood = clamp01(risk.probability ?? 0.5);
      const impact = clamp01(risk.impact ?? 0.5);
      const score = clamp01(likelihood * impact);
      entries.push({
        id: this.createId(`risk-${risk.id}`),
        title: risk.title,
        category: "founder",
        likelihood,
        impact,
        score,
        heat: priorityFromRisk(score),
        status: score >= 0.55 ? "mitigating" : "monitoring",
        owner: "Founder / Executive Team",
        mitigation: `Address ${risk.title.toLowerCase()} with owned remediation plan.`,
        residualRisk: clamp01(score * 0.7),
        relatedDomains: ["executive", "operations"],
        narrative: `${risk.title} scored ${(score * 100).toFixed(0)} on the board risk register.`,
      });
    }

    for (const risk of predictionRisks.slice(0, 4)) {
      const score = clamp01((risk.score ?? 50) / 100);
      const likelihood = clamp01(risk.probability ?? score + 0.1);
      const impact = clamp01(risk.impact ?? score + 0.15);
      entries.push({
        id: this.createId(`risk-pred-${risk.id}`),
        title: risk.title,
        category: "predictive",
        likelihood,
        impact,
        score: clamp01(likelihood * impact),
        heat: priorityFromRisk(clamp01(likelihood * impact)),
        status: "open",
        owner: "Executive Leadership",
        mitigation: risk.narrative || "Monitor predictive threshold and prepare contingency.",
        residualRisk: clamp01(score * 0.75),
        relatedDomains: [risk.domain],
        narrative: risk.narrative || risk.title,
      });
    }

    for (const risk of decisionRisks.slice(0, 3)) {
      const score = clamp01(risk.score ?? input.baseline.riskScore);
      entries.push({
        id: this.createId(`risk-dec-${risk.id}`),
        title: risk.title,
        category: "decision",
        likelihood: clamp01(risk.probability),
        impact: clamp01(risk.impact),
        score,
        heat: priorityFromRisk(score),
        status: "monitoring",
        owner: "Board / Decision Owners",
        mitigation:
          risk.mitigation ??
          "Validate decision scenario assumptions and stage gates.",
        residualRisk: clamp01(score * 0.8),
        relatedDomains: ["decision", risk.category],
        narrative: risk.mitigation ?? `Decision intelligence flagged: ${risk.title}`,
      });
    }

    if (entries.length === 0) {
      const score = clamp01(input.baseline.riskScore);
      entries.push(
        {
          id: this.createId("risk-cash"),
          title: "Cash / collections pressure",
          category: "financial",
          likelihood: clamp01(score + 0.1),
          impact: 0.75,
          score: clamp01((score + 0.1) * 0.75),
          heat: priorityFromRisk(clamp01((score + 0.1) * 0.75)),
          status: "mitigating",
          owner: "CFO / Finance Committee",
          mitigation: "Tighten collections cadence and cash forecast reviews.",
          residualRisk: clamp01(score * 0.6),
          relatedDomains: ["financial", "cash_flow"],
          narrative: "Baseline financial risk retained for board monitoring.",
        },
        {
          id: this.createId("risk-enrollment"),
          title: "Enrollment volatility",
          category: "enrollment",
          likelihood: 0.45,
          impact: 0.7,
          score: 0.315,
          heat: "medium",
          status: "monitoring",
          owner: "Admissions / Academic Committee",
          mitigation: "Protect pipeline conversion and retention interventions.",
          residualRisk: 0.22,
          relatedDomains: ["enrollment", "admissions"],
          narrative: "Enrollment remains a standing board oversight risk.",
        }
      );
    }

    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, input.request.maxRisks ?? 12);
  }

  heatMap(risks: RiskRegisterEntry[]): RiskHeatMapCell[] {
    const bands = ["low", "medium", "high"] as const;
    const bandOf = (v: number): (typeof bands)[number] =>
      v >= 0.66 ? "high" : v >= 0.33 ? "medium" : "low";

    const cells: RiskHeatMapCell[] = [];
    for (const likelihoodBand of bands) {
      for (const impactBand of bands) {
        const matched = risks.filter(
          (r) =>
            bandOf(r.likelihood) === likelihoodBand &&
            bandOf(r.impact) === impactBand
        );
        cells.push({
          likelihoodBand,
          impactBand,
          count: matched.length,
          riskIds: matched.map((r) => r.id),
        });
      }
    }
    return cells;
  }
}

/** Alias matching Sprint 029 naming. */
export { RiskRegisterEngine as RiskRegister };
