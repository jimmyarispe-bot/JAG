/**
 * RiskAssessment — deterministic scoring (no ML / no AI).
 *
 * inherent = likelihood × impact (1–25)
 * residual = inherent reduced by control effectiveness and open mitigations
 */

import {
  getControl,
  listMitigationsForOrganization,
} from "@/lib/risk/store";
import type {
  ControlEffectiveness,
  JagControl,
  JagMitigation,
  JagRisk,
  RiskImpact,
  RiskLikelihood,
  RiskSeverity,
} from "@/lib/risk/types";

const EFFECTIVENESS_REDUCTION: Readonly<
  Record<ControlEffectiveness, number>
> = {
  Effective: 0.35,
  "Partially Effective": 0.18,
  Ineffective: 0.05,
  "Not Assessed": 0.08,
};

export type RiskAssessmentService = {
  inherentScore(likelihood: RiskLikelihood, impact: RiskImpact): number;
  severityFromScore(score: number): RiskSeverity;
  residualScore(input: {
    likelihood: RiskLikelihood;
    impact: RiskImpact;
    controls: readonly JagControl[];
    mitigations: readonly JagMitigation[];
  }): number;
  scoreRisk(risk: JagRisk): {
    readonly inherentScore: number;
    readonly residualScore: number;
    readonly severity: RiskSeverity;
  };
};

function clampScore(n: number): number {
  return Math.max(1, Math.min(25, Math.round(n)));
}

export function createRiskAssessment(): RiskAssessmentService {
  return {
    inherentScore(likelihood, impact) {
      return likelihood * impact;
    },

    severityFromScore(score) {
      if (score >= 20) return "Critical";
      if (score >= 12) return "High";
      if (score >= 6) return "Medium";
      return "Low";
    },

    residualScore(input) {
      const inherent = this.inherentScore(input.likelihood, input.impact);
      let reduction = 0;
      for (const control of input.controls) {
        reduction += EFFECTIVENESS_REDUCTION[control.effectiveness];
      }
      // Cap control reduction at 70%
      reduction = Math.min(0.7, reduction);

      const openMitigations = input.mitigations.filter(
        (m) => m.status === "Planned" || m.status === "In Progress" || m.status === "Blocked"
      ).length;
      const completedMitigations = input.mitigations.filter(
        (m) => m.status === "Completed"
      ).length;

      // Outstanding mitigations increase residual slightly; completed reduce it
      const mitigationPenalty = Math.min(0.15, openMitigations * 0.04);
      const mitigationCredit = Math.min(0.25, completedMitigations * 0.08);

      const factor = Math.max(
        0.15,
        1 - reduction - mitigationCredit + mitigationPenalty
      );
      return clampScore(inherent * factor);
    },

    scoreRisk(risk) {
      const controls = risk.controlIds
        .map((id) => getControl(risk.organizationId, id))
        .filter((c): c is JagControl => c != null);
      const mitigations = listMitigationsForOrganization(
        risk.organizationId,
        risk.id
      );
      const inherentScore = this.inherentScore(risk.likelihood, risk.impact);
      const residualScore = this.residualScore({
        likelihood: risk.likelihood,
        impact: risk.impact,
        controls,
        mitigations,
      });
      return {
        inherentScore,
        residualScore,
        severity: this.severityFromScore(residualScore),
      };
    },
  };
}
