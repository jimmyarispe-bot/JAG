/**
 * Proof of Concept Intelligence — PoC tracking and conversion.
 */

import type { ProofOfConceptIntelligence as ProofOfConceptIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  ExperimentManagementSuite,
  InnovationBaseline,
  PocRecord,
  ProofOfConceptSuite,
} from "@/lib/platform/intelligence/innovation/types";

const POC_TEMPLATES = [
  { name: "AI tutoring PoC", stage: "validation" },
  { name: "Low-code workflow PoC", stage: "build" },
  { name: "Credential wallet PoC", stage: "discovery" },
  { name: "Predictive enrollment PoC", stage: "validation" },
];

export class ProofOfConceptIntelligence implements ProofOfConceptIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    experimentManagement: ExperimentManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ProofOfConceptSuite {
    const { baseline, experimentManagement, createId } = input;
    void input.now;
    const count = Math.max(3, Math.min(POC_TEMPLATES.length, baseline.pocCount + 1));
    const pocs: PocRecord[] = POC_TEMPLATES.slice(0, count).map((template, index) => {
      const conversionLikelihood = clamp(
        baseline.pocConversion +
          experimentManagement.successRate * 0.2 +
          (template.stage === "validation" ? 8 : 0) -
          index * 3
      );
      const investmentEstimate = Math.round(conversionLikelihood * 1_800 + index * 2_500);
      return {
        id: createId("inn-poc"),
        name: template.name,
        conversionLikelihood,
        stage: template.stage,
        investmentEstimate,
        narrative: `${template.name} conversion ${Math.round(conversionLikelihood)} (${template.stage}).`,
        lenses: buildLens({
          innovationOpportunityExists: template.name,
          evidenceSupports: `PoC conversion baseline ${Math.round(baseline.pocConversion)}.`,
          problemSolved: "De-risks technology and product bets before scale.",
          expectedImpact: `Conversion likelihood ${Math.round(conversionLikelihood)}.`,
          investmentRequired: `~$${investmentEstimate.toLocaleString()} to complete PoC.`,
          experimentsValidate: experimentManagement.experiments[0]?.name ?? "Linked experiments",
          risksExist: "Scope creep and inconclusive outcomes.",
          capabilitiesRequired: "Engineering, product, experiment ops",
        }),
      };
    });
    const conversionScore = clamp(
      pocs.reduce((sum, item) => sum + item.conversionLikelihood, 0) / pocs.length
    );
    const activeCount = pocs.filter((item) => item.stage !== "discovery").length;
    const graduationPressure = clamp(
      conversionScore * 0.6 + experimentManagement.throughputScore * 0.4
    );

    return {
      pocs,
      conversionScore,
      activeCount,
      graduationPressure,
      narrative: `PoC conversion ${Math.round(conversionScore)} across ${pocs.length} proofs; ${activeCount} active.`,
    };
  }
}
