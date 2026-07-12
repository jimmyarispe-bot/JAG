/**
 * Human Capital Intelligence — Retention Intelligence (Sprint 032).
 */

import type {
  BurnoutDetection as BurnoutDetectionContract,
  CultureHealth as CultureHealthContract,
  EmployeeSentiment as EmployeeSentimentContract,
  EngagementAnalysis as EngagementAnalysisContract,
  ExitAnalysis as ExitAnalysisContract,
  RetentionPrediction as RetentionPredictionContract,
  StayInterviewInsights as StayInterviewInsightsContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  clamp01,
  priorityFromRisk,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  BurnoutRiskLevel,
  BurnoutSignal,
  CultureHealthResult,
  EmployeeProfileRecord,
  EmployeeSentimentResult,
  EngagementAnalysisResult,
  ExitAnalysisFinding,
  FeedbackRecord,
  HumanCapitalBaseline,
  RetentionPredictionRecord,
  StayInterviewInsight,
} from "@/lib/platform/intelligence/human-capital/types";

function burnoutLevel(score: number): BurnoutRiskLevel {
  if (score >= 0.75) return "severe";
  if (score >= 0.55) return "high";
  if (score >= 0.35) return "moderate";
  if (score >= 0.15) return "low";
  return "none";
}

export class BurnoutDetection implements BurnoutDetectionContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  detect(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): BurnoutSignal[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees
      .map((e) => {
        const score = clamp01(
          input.baseline.burnoutRisk * 0.5 +
            (100 - e.engagementScore) / 200 +
            (e.riskFlags.includes("workload") ? 0.2 : 0) +
            (e.status === "at_risk" ? 0.15 : 0)
        );
        return {
          id: createId("burn"),
          employeeId: e.id,
          level: burnoutLevel(score),
          score,
          drivers:
            score >= 0.35
              ? ["workload", "recovery deficit", "role ambiguity"].slice(
                  0,
                  1 + Math.floor(score * 3)
                )
              : [],
          interventions:
            score >= 0.35
              ? ["Workload rebalance", "Manager check-in", "PTO enforcement"]
              : ["Maintain healthy cadence"],
          narrative: `${e.name} burnout risk ${burnoutLevel(score)}.`,
        };
      })
      .filter((b) => b.score >= 0.2)
      .slice(0, 12);
  }
}

export class RetentionPrediction implements RetentionPredictionContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  predict(input: {
    employees: EmployeeProfileRecord[];
    burnout: BurnoutSignal[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): RetentionPredictionRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const burnoutByEmp = new Map(
      input.burnout.map((b) => [b.employeeId, b.score])
    );

    return input.employees
      .map((e) => {
        const flightRisk = clamp01(
          input.baseline.retentionRisk * 0.45 +
            (burnoutByEmp.get(e.id) ?? 0) * 0.35 +
            (100 - e.engagementScore) / 250 +
            (e.status === "at_risk" ? 0.2 : 0)
        );
        return {
          id: createId("ret"),
          employeeId: e.id,
          flightRisk,
          band: priorityFromRisk(flightRisk),
          drivers:
            flightRisk >= 0.4
              ? ["engagement", "career path", "manager quality"]
              : ["stable"],
          stayActions:
            flightRisk >= 0.4
              ? ["Stay interview", "Role redesign", "Recognition"]
              : ["Continue engagement rituals"],
          narrative: `${e.name} flight risk ${Math.round(flightRisk * 100)}%.`,
        };
      })
      .sort((a, b) => b.flightRisk - a.flightRisk)
      .slice(0, 14);
  }
}

export class EngagementAnalysis implements EngagementAnalysisContract {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    feedback: FeedbackRecord[];
  }): EngagementAnalysisResult {
    const avg =
      input.employees.length > 0
        ? input.employees.reduce((s, e) => s + e.engagementScore, 0) /
          input.employees.length
        : input.baseline.engagementScore;
    const overallScore = clamp(avg * 0.7 + input.baseline.engagementScore * 0.3);
    const constructive = input.feedback.filter(
      (f) => f.sentiment === "constructive"
    ).length;

    return {
      overallScore,
      status: statusFromScore(overallScore),
      dimensions: [
        { key: "purpose", label: "Purpose", score: clamp(overallScore + 4) },
        { key: "manager", label: "Manager Support", score: clamp(overallScore - 3) },
        { key: "growth", label: "Growth", score: clamp(overallScore - 6) },
        { key: "wellbeing", label: "Wellbeing", score: clamp(overallScore - 8) },
        { key: "recognition", label: "Recognition", score: clamp(overallScore + 2) },
      ],
      hotspots:
        constructive > 0
          ? ["Workload clarity", "Career progression"]
          : ["Onboarding experience"],
      strengths:
        overallScore >= 70
          ? ["Mission connection", "Peer collaboration"]
          : ["Team pockets of excellence"],
      narrative: `Engagement is ${statusFromScore(overallScore)} at ${Math.round(overallScore)}.`,
    };
  }
}

export class StayInterviewInsights implements StayInterviewInsightsContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  derive(input: {
    employees: EmployeeProfileRecord[];
    retention: RetentionPredictionRecord[];
    now: Date;
  }): StayInterviewInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.retention
      .filter((r) => r.flightRisk >= 0.4)
      .slice(0, 6)
      .map((r) => {
        const emp = input.employees.find((e) => e.id === r.employeeId);
        return {
          id: createId("stay"),
          employeeId: r.employeeId,
          motivators: ["mission impact", "team trust", "flexible schedule"],
          friction: r.drivers.filter((d) => d !== "stable"),
          asks: ["Clearer growth path", "Workload balance"],
          priority: r.band,
          narrative: `Stay interview priorities for ${emp?.name ?? r.employeeId}.`,
        };
      });
  }
}

export class ExitAnalysis implements ExitAnalysisContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: HumanCapitalBaseline;
    retention: RetentionPredictionRecord[];
    now: Date;
  }): ExitAnalysisFinding[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    const themes = [
      {
        theme: "Career stagnation",
        frequency: Math.round(3 + input.baseline.attritionRate * 20),
        severity: priorityFromScore(input.baseline.learningParticipation),
      },
      {
        theme: "Compensation competitiveness",
        frequency: Math.round(2 + (100 - input.baseline.compensationCompetitiveness) / 20),
        severity: priorityFromScore(input.baseline.compensationCompetitiveness),
      },
      {
        theme: "Manager effectiveness",
        frequency: Math.round(2 + input.baseline.burnoutRisk * 8),
        severity: priorityFromRisk(input.baseline.burnoutRisk),
      },
    ];

    return themes.map((t) => ({
      id: createId("exit"),
      theme: t.theme,
      frequency: t.frequency,
      severity: t.severity,
      recommendations: [
        `Address ${t.theme.toLowerCase()} in quarterly people plan`,
        "Track theme in stay interviews",
      ],
      narrative: `${t.theme} appears in ~${t.frequency} recent exits/risk cases.`,
    }));
  }
}

export class EmployeeSentiment implements EmployeeSentimentContract {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    feedback: FeedbackRecord[];
    engagement: EngagementAnalysisResult;
    baseline: HumanCapitalBaseline;
  }): EmployeeSentimentResult {
    const positive = input.feedback.filter((f) => f.sentiment === "positive").length;
    const constructive = input.feedback.filter(
      (f) => f.sentiment === "constructive"
    ).length;
    const neutral = input.feedback.filter((f) => f.sentiment === "neutral").length;
    const total = Math.max(1, input.feedback.length);
    const overallScore = clamp(
      input.engagement.overallScore * 0.55 +
        input.baseline.engagementScore * 0.25 +
        (positive / total) * 40 -
        (constructive / total) * 15
    );
    const themes: EmployeeSentimentResult["themes"] = [
      {
        theme: "belonging",
        sentiment: overallScore >= 70 ? "positive" : "neutral",
        weight: 0.3,
      },
      {
        theme: "workload",
        sentiment: constructive > positive ? "negative" : "neutral",
        weight: 0.25,
      },
      {
        theme: "growth",
        sentiment: input.baseline.learningParticipation >= 65 ? "positive" : "neutral",
        weight: 0.25,
      },
      {
        theme: "recognition",
        sentiment: positive >= constructive ? "positive" : "negative",
        weight: 0.2,
      },
    ];
    return {
      overallScore,
      status: statusFromScore(overallScore),
      themes,
      polarity: {
        positive: Number((positive / total).toFixed(2)),
        neutral: Number((neutral / total).toFixed(2)),
        negative: Number((constructive / total).toFixed(2)),
      },
      narrative: `Employee sentiment ${statusFromScore(overallScore)} at ${Math.round(overallScore)}.`,
    };
  }
}

export class CultureHealth implements CultureHealthContract {
  assess(input: {
    baseline: HumanCapitalBaseline;
    engagement: EngagementAnalysisResult;
    sentiment: EmployeeSentimentResult;
    exitFindings: ExitAnalysisFinding[];
  }): CultureHealthResult {
    const exitPressure = clamp(
      input.exitFindings.reduce((s, f) => s + f.frequency, 0) * 2
    );
    const overallScore = clamp(
      input.engagement.overallScore * 0.35 +
        input.sentiment.overallScore * 0.35 +
        input.baseline.engagementScore * 0.2 +
        (100 - exitPressure) * 0.1
    );
    return {
      overallScore,
      status: statusFromScore(overallScore),
      dimensions: [
        { key: "trust", label: "Trust", score: clamp(overallScore + 2) },
        { key: "inclusion", label: "Inclusion", score: clamp(overallScore - 3) },
        { key: "accountability", label: "Accountability", score: clamp(overallScore + 1) },
        { key: "innovation", label: "Innovation", score: clamp(overallScore - 5) },
        {
          key: "wellbeing",
          label: "Wellbeing",
          score: clamp(100 - input.baseline.burnoutRisk * 100),
        },
      ],
      risks:
        overallScore < 65
          ? input.exitFindings.slice(0, 2).map((f) => f.theme)
          : input.baseline.burnoutRisk >= 0.45
            ? ["Burnout undercurrent"]
            : [],
      strengths:
        overallScore >= 70
          ? ["Mission alignment", "Peer support"]
          : ["Pockets of strong team culture"],
      narrative: `Culture health is ${statusFromScore(overallScore)} at ${Math.round(overallScore)}.`,
    };
  }
}
