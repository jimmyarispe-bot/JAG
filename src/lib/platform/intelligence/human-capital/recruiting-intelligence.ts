/**
 * Human Capital Intelligence — Recruiting Intelligence (Sprint 032).
 */

import type {
  CandidatePipeline as CandidatePipelineContract,
  CandidateScoring as CandidateScoringContract,
  EmployerBrandingInsights as EmployerBrandingInsightsContract,
  HiringRecommendations as HiringRecommendationsContract,
  InterviewIntelligence as InterviewIntelligenceContract,
  OfferOptimizationEngine as OfferOptimizationContract,
  RecruitingAnalytics as RecruitingAnalyticsContract,
  ReferenceIntelligence as ReferenceIntelligenceContract,
  ResumeIntelligence as ResumeIntelligenceContract,
  TalentSourcing as TalentSourcingContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  CandidatePipelineStage,
  CandidateRecord,
  CapacityPlanRow,
  EmployerBrandingInsight,
  HumanCapitalBaseline,
  HumanCapitalRequest,
  OfferOptimization,
  HiringRecommendation,
  RecruitingAnalyticsResult,
  ReferenceInsight,
  SalaryBenchmark,
  TalentSourcingInsight,
} from "@/lib/platform/intelligence/human-capital/types";

export class CandidatePipeline implements CandidatePipelineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  build(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    now: Date;
  }): CandidateRecord[] {
    if (input.request.candidates?.length) {
      return input.request.candidates.map((c) => ({ ...c }));
    }

    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const roles = [
      "Instructional Lead",
      "Operations Manager",
      "Enrollment Specialist",
      "Finance Analyst",
      "People Partner",
    ];
    const count = Math.min(8, Math.max(3, input.baseline.openRoles + 2));

    return Array.from({ length: count }, (_, i) => {
      const score = clamp(55 + ((i * 9) % 40) + input.baseline.skillsCoverage * 0.1);
      return {
        id: createId("cand"),
        name: `Candidate ${i + 1}`,
        role: roles[i % roles.length]!,
        stage: (["sourced", "screened", "interviewing", "finalist", "offered"] as const)[
          i % 5
        ]!,
        score,
        fitScore: clamp(score - 4 + (i % 7)),
        experienceYears: 3 + (i % 10),
        skills: ["leadership", "communication", "domain expertise"].slice(
          0,
          1 + (i % 3)
        ),
        source: i % 2 === 0 ? "referral" : "marketplace",
        interviewScore: i % 3 === 0 ? null : clamp(60 + i * 4),
        resumeSummary: `Experienced ${roles[i % roles.length]} with ${3 + (i % 10)} years.`,
        recommendation: score >= 75 ? "Advance" : score >= 60 ? "Continue screening" : "Hold",
        priority: priorityFromScore(score),
      };
    });
  }
}

export class CandidateScoring implements CandidateScoringContract {
  score(
    candidates: CandidateRecord[],
    baseline: HumanCapitalBaseline
  ): CandidateRecord[] {
    return candidates.map((c) => {
      const score = clamp(
        c.score * 0.55 +
          c.fitScore * 0.25 +
          (c.interviewScore ?? baseline.performanceScore * 0.7) * 0.2
      );
      return {
        ...c,
        score,
        priority: priorityFromScore(score),
        recommendation:
          score >= 80
            ? "Strong hire"
            : score >= 70
              ? "Advance"
              : score >= 55
                ? "Continue screening"
                : "Decline",
      };
    });
  }
}

export class ResumeIntelligence implements ResumeIntelligenceContract {
  summarize(candidates: CandidateRecord[]): CandidateRecord[] {
    return candidates.map((c) => ({
      ...c,
      resumeSummary:
        c.resumeSummary ||
        `${c.name}: ${c.experienceYears}y experience; skills: ${c.skills.join(", ") || "generalist"}.`,
    }));
  }
}

export class InterviewIntelligence implements InterviewIntelligenceContract {
  enrich(
    candidates: CandidateRecord[],
    baseline: HumanCapitalBaseline
  ): CandidateRecord[] {
    return candidates.map((c, i) => {
      if (c.interviewScore != null) return c;
      if (c.stage === "sourced" || c.stage === "screened") return c;
      return {
        ...c,
        interviewScore: clamp(
          baseline.performanceScore * 0.6 + c.fitScore * 0.4 - (i % 5) * 2
        ),
      };
    });
  }
}

export class HiringRecommendations implements HiringRecommendationsContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    candidates: CandidateRecord[];
    capacity: CapacityPlanRow[];
    now: Date;
  }): HiringRecommendation[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    const byRole = new Map<string, CandidateRecord[]>();
    for (const c of input.candidates) {
      const list = byRole.get(c.role) ?? [];
      list.push(c);
      byRole.set(c.role, list);
    }

    const capacityGaps = input.capacity
      .filter((row) => row.gapFte > 0)
      .sort((a, b) => b.gapFte - a.gapFte);

    const roles =
      capacityGaps.length > 0
        ? capacityGaps.map((g) => g.team)
        : [...byRole.keys()].slice(0, 4);

    return roles.slice(0, 5).map((role, i) => {
      const candidates = byRole.get(role) ?? input.candidates.slice(0, 2);
      const urgency = clamp(
        40 + input.baseline.openRoles * 6 + (capacityGaps[i]?.gapFte ?? 1) * 15,
        0,
        100
      );
      return {
        id: createId("hire"),
        role,
        priority: priorityFromScore(100 - urgency),
        urgency,
        rationale: `Fill ${role} to close capacity gap and protect delivery.`,
        candidateIds: candidates.slice(0, 3).map((c) => c.id),
        openSlots: Math.max(1, Math.round(capacityGaps[i]?.gapFte ?? 1)),
        estimatedTimeToFillDays: Math.round(
          input.baseline.timeToFillDays * (1 + i * 0.08)
        ),
      };
    });
  }
}

export class OfferOptimizationEngine implements OfferOptimizationContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  optimize(input: {
    candidates: CandidateRecord[];
    benchmarks: SalaryBenchmark[];
    now: Date;
  }): OfferOptimization[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.candidates
      .filter((c) => c.stage === "finalist" || c.stage === "offered" || c.score >= 78)
      .slice(0, 4)
      .map((c) => {
        const bench =
          input.benchmarks.find((b) => b.role === c.role) ?? input.benchmarks[0];
        const baseSalary = Math.round(
          (bench?.marketMedian ?? 72000) * (0.95 + c.score / 500)
        );
        const acceptanceProbability = clamp(
          0.45 + c.fitScore / 200 + (bench ? (100 - Math.abs(bench.gap)) / 400 : 0.1),
          0,
          0.98
        );
        return {
          id: createId("offer"),
          candidateId: c.id,
          role: c.role,
          baseSalary,
          marketPercentile: clamp((bench?.percentile ?? 50) + (c.score - 70) / 2),
          equityOrBonus: Math.round(baseSalary * 0.08),
          acceptanceProbability,
          recommendations: [
            "Lead with total rewards narrative",
            "Align start date with capacity plan",
            acceptanceProbability < 0.65
              ? "Consider signing bonus to improve acceptance odds"
              : "Standard offer package is competitive",
          ],
          narrative: `Optimized offer for ${c.name} targeting ~${Math.round(acceptanceProbability * 100)}% acceptance.`,
        };
      });
  }
}

/** Aliases matching Sprint naming. */
export { OfferOptimizationEngine as OfferOptimization };
export { HiringRecommendations as HiringRecommendationEngine };

export class ReferenceIntelligence implements ReferenceIntelligenceContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    candidates: CandidateRecord[];
    now: Date;
  }): ReferenceInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.candidates
      .filter((c) => c.stage === "finalist" || c.stage === "offered" || c.score >= 72)
      .slice(0, 6)
      .map((c) => {
        const overallScore = clamp(c.score * 0.6 + c.fitScore * 0.4);
        return {
          id: createId("ref"),
          candidateId: c.id,
          strengthSignals:
            overallScore >= 75
              ? ["Consistent delivery", "Strong peer endorsement"]
              : ["Relevant domain experience"],
          riskSignals:
            overallScore < 70
              ? ["Thin reference set", "Role transition risk"]
              : [],
          overallScore,
          recommendation:
            overallScore >= 80
              ? "Proceed with confidence"
              : overallScore >= 65
                ? "Proceed with targeted probes"
                : "Hold pending stronger references",
          narrative: `Reference read for ${c.name}: ${Math.round(overallScore)}.`,
        };
      });
  }
}

export class TalentSourcing implements TalentSourcingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    candidates: CandidateRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): TalentSourcingInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const channels = [...new Set(input.candidates.map((c) => c.source))];
    const list =
      channels.length > 0 ? channels : ["referral", "marketplace", "campus"];

    return list.map((channel, i) => {
      const cohort = input.candidates.filter((c) => c.source === channel);
      const qualityScore = clamp(
        cohort.length
          ? cohort.reduce((s, c) => s + c.score, 0) / cohort.length
          : input.baseline.skillsCoverage * 0.8 - i * 4
      );
      const yieldScore = clamp(
        cohort.length * 12 + input.baseline.hiringVelocity * 8 - i * 5
      );
      const volume = Math.max(1, cohort.length || 2 + i);
      const costEfficiency = clamp(100 - i * 12 - (channel === "marketplace" ? 8 : 0));
      return {
        id: createId("src"),
        channel,
        yieldScore,
        qualityScore,
        volume,
        costEfficiency,
        priority: priorityFromScore((yieldScore + qualityScore) / 2),
        narrative: `${channel} sourcing yield ${Math.round(yieldScore)} with quality ${Math.round(qualityScore)}.`,
      };
    });
  }
}

export class EmployerBrandingInsights
  implements EmployerBrandingInsightsContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: HumanCapitalBaseline;
    candidates: CandidateRecord[];
    now: Date;
  }): EmployerBrandingInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const offerSignal = clamp(input.baseline.offerAcceptanceRate * 100);
    const themes = [
      {
        theme: "Mission & impact",
        score: clamp(input.baseline.engagementScore + 4),
        strengths: ["Clear purpose narrative"],
        gaps: offerSignal < 60 ? ["Candidate value prop clarity"] : [],
      },
      {
        theme: "Growth & learning",
        score: clamp(input.baseline.learningParticipation),
        strengths: ["Development pathways"],
        gaps:
          input.baseline.learningParticipation < 65
            ? ["Visible career ladders"]
            : [],
      },
      {
        theme: "Total rewards",
        score: clamp(input.baseline.compensationCompetitiveness),
        strengths: ["Competitive core roles"],
        gaps:
          input.baseline.compensationCompetitiveness < 70
            ? ["Market positioning on mid-band roles"]
            : [],
      },
    ];

    return themes.map((t) => ({
      id: createId("brand"),
      theme: t.theme,
      score: t.score,
      strengths: t.strengths,
      gaps: t.gaps,
      actions:
        t.gaps.length > 0
          ? ["Refresh career site messaging", "Equip hiring managers with proof points"]
          : ["Maintain employer brand rituals", "Amplify employee stories"],
      narrative: `Employer brand ${t.theme.toLowerCase()} scored ${Math.round(t.score)}.`,
    }));
  }
}

export class RecruitingAnalytics implements RecruitingAnalyticsContract {
  analyze(input: {
    candidates: CandidateRecord[];
    baseline: HumanCapitalBaseline;
    recommendations: HiringRecommendation[];
  }): RecruitingAnalyticsResult {
    const stages: CandidatePipelineStage[] = [
      "sourced",
      "screened",
      "interviewing",
      "finalist",
      "offered",
      "hired",
    ];
    const stageFunnel = stages.map((stage) => ({
      stage,
      count: input.candidates.filter((c) => c.stage === stage).length,
    }));
    const advanced = input.candidates.filter(
      (c) =>
        c.stage === "finalist" ||
        c.stage === "offered" ||
        c.stage === "hired"
    ).length;
    const pipelineConversionRate = clamp(
      input.candidates.length
        ? (advanced / input.candidates.length) * 100
        : input.baseline.hiringVelocity * 12
    );
    const sourceQualityScore = clamp(
      input.candidates.length
        ? input.candidates.reduce((s, c) => s + c.score, 0) /
            input.candidates.length
        : input.baseline.skillsCoverage
    );
    return {
      pipelineConversionRate,
      averageTimeToFillDays: input.baseline.timeToFillDays,
      offerAcceptanceRate: clamp(input.baseline.offerAcceptanceRate * 100),
      sourceQualityScore,
      stageFunnel,
      status: statusFromScore(pipelineConversionRate),
      narrative: `Recruiting conversion ${Math.round(pipelineConversionRate)}% across ${input.candidates.length} candidates and ${input.recommendations.length} hire priorities.`,
    };
  }
}
