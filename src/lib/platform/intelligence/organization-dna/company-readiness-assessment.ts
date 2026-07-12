/**
 * CompanyReadinessAssessment + ReadinessScoring (Sprint 030).
 */

import type {
  CompanyReadinessAssessmentEngine as CompanyReadinessAssessmentEngineContract,
  ReadinessScoringEngine as ReadinessScoringEngineContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import {
  clamp,
  readinessFromScore,
} from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  CompanyReadinessAssessment,
  DnaConfidenceScore,
  OrganizationCapabilities,
  OrganizationConstraints,
  OrganizationDnaBaseline,
  OrganizationStage,
  ReadinessDimension,
  ReadinessScoring,
} from "@/lib/platform/intelligence/organization-dna/types";

export class CompanyReadinessAssessmentImpl
  implements CompanyReadinessAssessmentEngineContract
{
  assess(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    capabilities: OrganizationCapabilities;
    constraints: OrganizationConstraints;
    createId: (prefix: string) => string;
    now: Date;
  }): CompanyReadinessAssessment {
    void input.now;
    const b = input.baseline;
    const dimensions: ReadinessDimension[] = [
      {
        id: input.createId("ready"),
        key: "identity",
        label: "Identity clarity",
        score: b.missionClarity,
        status: readinessFromScore(b.missionClarity),
        weight: 0.15,
        findings: [
          input.seed.missionHint
            ? "Mission hint provided"
            : "Mission inferred from seed",
        ],
        gaps:
          b.missionClarity < 70
            ? ["Sharpen mission and values with leadership"]
            : [],
      },
      {
        id: input.createId("ready"),
        key: "market",
        label: "Market clarity",
        score: b.marketClarity,
        status: readinessFromScore(b.marketClarity),
        weight: 0.2,
        findings: [
          input.seed.targetCustomer
            ? "Target customer stated"
            : "Target customer inferred",
        ],
        gaps:
          b.marketClarity < 70
            ? ["Validate beachhead with discovery interviews"]
            : [],
      },
      {
        id: input.createId("ready"),
        key: "model",
        label: "Business model",
        score: b.modelClarity,
        status: readinessFromScore(b.modelClarity),
        weight: 0.2,
        findings: ["Revenue and value proposition drafted"],
        gaps:
          b.modelClarity < 70
            ? ["Pressure-test pricing and unit economics"]
            : [],
      },
      {
        id: input.createId("ready"),
        key: "execution",
        label: "Execution readiness",
        score: b.executionReadiness,
        status: readinessFromScore(b.executionReadiness),
        weight: 0.25,
        findings: [
          `Team size ${b.teamSize}`,
          `Org health ${b.organizationHealthScore}`,
        ],
        gaps:
          b.executionReadiness < 70
            ? ["Install weekly operating cadence"]
            : [],
      },
      {
        id: input.createId("ready"),
        key: "capital",
        label: "Capital adequacy",
        score: b.capitalAdequacy,
        status: readinessFromScore(b.capitalAdequacy),
        weight: 0.2,
        findings: [
          b.revenue > 0
            ? `Revenue signal ${b.revenue}`
            : "Pre-revenue or sparse revenue",
        ],
        gaps:
          b.capitalAdequacy < 60
            ? ["Extend runway or tighten burn"]
            : [],
      },
    ];

    const overallScore = clamp(
      Math.round(
        dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
      ),
      0,
      100
    );

    const blockers = [
      ...dimensions.flatMap((d) => d.gaps),
      ...input.constraints.constraints
        .filter((c) => c.severity === "critical")
        .map((c) => c.description),
    ].slice(0, 6);

    const accelerators = input.capabilities.capabilities
      .filter((c) => c.maturity >= 70)
      .map((c) => c.name)
      .slice(0, 5);

    return {
      overallScore,
      status: readinessFromScore(overallScore),
      dimensions,
      blockers,
      accelerators,
      narrative: `Company readiness for ${input.stage}: ${readinessFromScore(overallScore)} (${overallScore}).`,
    };
  }
}

export class ReadinessScoringImpl implements ReadinessScoringEngineContract {
  score(input: {
    readiness: CompanyReadinessAssessment;
    baseline: OrganizationDnaBaseline;
    confidence: DnaConfidenceScore;
  }): ReadinessScoring {
    const weightedScores = input.readiness.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      score: d.score,
      weight: d.weight,
      contribution: Math.round(d.score * d.weight * 100) / 100,
    }));

    return {
      overallScore: input.readiness.overallScore,
      status: input.readiness.status,
      weightedScores,
      confidence: input.confidence,
    };
  }
}

export {
  CompanyReadinessAssessmentImpl as CompanyReadinessAssessment,
  CompanyReadinessAssessmentImpl as CompanyReadinessAssessmentEngine,
};
export {
  ReadinessScoringImpl as ReadinessScoring,
  ReadinessScoringImpl as ReadinessScoringEngine,
};
