/**
 * Deterministic advisory forecast model — Sprint 201.
 * Extrapolates from contributor signals; does not invent unbound metrics.
 */

import type {
  PredictionAssumption,
  PredictionDriver,
  PredictionEvidence,
  PreventiveAction,
} from "./PredictionEvidence";
import { horizonLabel, horizonToDays, type PredictionHorizon } from "./PredictionHorizon";
import type { PredictionStateSnapshot } from "./PredictionResult";
import type {
  PredictionContext,
  PredictionKind,
  PredictionRiskLevel,
  PredictionSignal,
  PredictionStance,
  PredictionTrend,
} from "./PredictionTypes";
import { PREDICTION_KIND_LABELS } from "./PredictionTypes";

export type ForecastComputeInput = {
  readonly kind: PredictionKind;
  readonly horizon: PredictionHorizon;
  readonly context: PredictionContext;
};

export type ForecastComputeOutput = {
  readonly currentState: PredictionStateSnapshot;
  readonly predictedState: PredictionStateSnapshot;
  readonly trend: PredictionTrend;
  readonly riskLevel: PredictionRiskLevel;
  readonly primaryDrivers: readonly PredictionDriver[];
  readonly supportingContributors: readonly string[];
  readonly evidence: readonly PredictionEvidence[];
  readonly assumptions: readonly PredictionAssumption[];
  readonly recommendedPreventiveActions: readonly PreventiveAction[];
  readonly narrative: string;
  readonly insufficientData: boolean;
  readonly signalQuality: number;
  readonly pressureScore: number;
};

type KindSpec = {
  readonly contributorIds: readonly string[];
  readonly preferScore: boolean;
  readonly higherIsBetter: boolean;
  readonly pressureFromDecisions: boolean;
  readonly decliningVerb: string;
  readonly improvingVerb: string;
};

const KIND_SPECS: Record<PredictionKind, KindSpec> = {
  organization_health: {
    contributorIds: [
      "education.cognition.school_health",
      "education.cognition.operational_readiness",
    ],
    preferScore: true,
    higherIsBetter: true,
    pressureFromDecisions: true,
    decliningVerb: "decline",
    improvingVerb: "improve",
  },
  student_success: {
    contributorIds: [
      "education.cognition.student_success",
      "education.cognition.school_health",
    ],
    preferScore: true,
    higherIsBetter: true,
    pressureFromDecisions: false,
    decliningVerb: "weaken",
    improvingVerb: "strengthen",
  },
  operational_readiness: {
    contributorIds: [
      "education.cognition.operational_readiness",
      "education.cognition.school_health",
    ],
    preferScore: false,
    higherIsBetter: true,
    pressureFromDecisions: true,
    decliningVerb: "decline",
    improvingVerb: "improve",
  },
  funding_readiness: {
    contributorIds: [
      "education.cognition.funding_readiness",
      "education.cognition.operational_readiness",
    ],
    preferScore: false,
    higherIsBetter: true,
    pressureFromDecisions: true,
    decliningVerb: "erode",
    improvingVerb: "improve",
  },
  decision_queue_growth: {
    contributorIds: [],
    preferScore: false,
    higherIsBetter: false,
    pressureFromDecisions: true,
    decliningVerb: "grow",
    improvingVerb: "shrink",
  },
  staffing_capacity: {
    contributorIds: [
      "education.cognition.staffing",
      "education.cognition.capacity",
      "education.cognition.operational_readiness",
    ],
    preferScore: false,
    higherIsBetter: true,
    pressureFromDecisions: true,
    decliningVerb: "tighten",
    improvingVerb: "ease",
  },
  enrollment_trend: {
    contributorIds: [
      "education.cognition.enrollment",
      "education.cognition.student_success",
    ],
    preferScore: true,
    higherIsBetter: true,
    pressureFromDecisions: false,
    decliningVerb: "soften",
    improvingVerb: "rise",
  },
  compliance_risk: {
    contributorIds: [
      "education.cognition.compliance",
      "education.cognition.school_health",
    ],
    preferScore: false,
    higherIsBetter: false,
    pressureFromDecisions: true,
    decliningVerb: "rise",
    improvingVerb: "fall",
  },
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function readinessToScore(readiness?: string): number | undefined {
  if (!readiness) return undefined;
  const r = readiness.toLowerCase();
  if (r.includes("ready") && !r.includes("not")) return 0.85;
  if (r.includes("partial") || r.includes("watch")) return 0.55;
  if (r.includes("blocked") || r.includes("critical") || r.includes("not")) return 0.25;
  if (r.includes("at_risk") || r.includes("risk")) return 0.35;
  return 0.5;
}

function stanceFromScore(score: number, higherIsBetter: boolean): PredictionStance {
  const s = higherIsBetter ? score : 1 - score;
  if (s >= 0.75) return "favorable";
  if (s >= 0.55) return "watch";
  if (s >= 0.35) return "at_risk";
  return "critical";
}

function riskFromScore(score: number, higherIsBetter: boolean): PredictionRiskLevel {
  const s = higherIsBetter ? score : 1 - score;
  if (s >= 0.7) return "low";
  if (s >= 0.5) return "moderate";
  if (s >= 0.3) return "elevated";
  return "critical";
}

function trendFromDelta(delta: number, higherIsBetter: boolean): PredictionTrend {
  const signed = higherIsBetter ? delta : -delta;
  if (Math.abs(signed) < 0.03) return "stable";
  return signed > 0 ? "improving" : "declining";
}

function matchSignals(context: PredictionContext, ids: readonly string[]): PredictionSignal[] {
  if (ids.length === 0) return [];
  const byId = new Map(context.signals.map((s) => [s.contributorId, s]));
  const matched: PredictionSignal[] = [];
  for (const id of ids) {
    const hit = byId.get(id);
    if (hit) matched.push(hit);
  }
  // Soft match by prefix / substring for education.* variants
  if (matched.length === 0) {
    for (const s of context.signals) {
      if (ids.some((id) => s.contributorId.includes(id.split(".").pop() ?? id))) {
        matched.push(s);
      }
    }
  }
  return matched;
}

function signalScore(signal: PredictionSignal, preferScore: boolean): number {
  if (preferScore && typeof signal.score === "number") return clamp01(signal.score);
  const fromReady = readinessToScore(signal.readiness);
  if (fromReady !== undefined) return fromReady;
  if (typeof signal.score === "number") return clamp01(signal.score);
  // Confidence alone is not health — treat mid when unknown
  return clamp01(0.4 + signal.confidence * 0.2 - (signal.blockingIssues.length > 0 ? 0.25 : 0));
}

function decisionPressure(context: PredictionContext): number {
  const open = context.openDecisionCount;
  const overdue = context.overdueDecisionCount;
  const p1 = context.p1DecisionCount;
  return clamp01(open * 0.04 + overdue * 0.08 + p1 * 0.1);
}

function horizonDecay(days: number): number {
  // Longer horizons amplify pressure (more uncertainty / drift)
  return clamp01(days / 365);
}

export function computeForecast(input: ForecastComputeInput): ForecastComputeOutput {
  const { kind, horizon, context } = input;
  const spec = KIND_SPECS[kind];
  const days = horizonToDays(horizon);
  const hLabel = horizonLabel(horizon);
  const matched = matchSignals(context, spec.contributorIds);
  const pressure = decisionPressure(context);
  const decay = horizonDecay(days);

  if (kind === "decision_queue_growth") {
    return computeQueueGrowth(context, horizon, hLabel, days, pressure, decay);
  }

  if (matched.length === 0 && context.signals.length === 0) {
    return insufficient(kind, hLabel, context);
  }

  const primary = matched[0] ?? context.signals[0];
  const scores = (matched.length > 0 ? matched : context.signals.slice(0, 3)).map((s) =>
    signalScore(s, spec.preferScore),
  );
  const currentScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const warningLoad =
    (matched.length > 0 ? matched : context.signals).reduce(
      (n, s) => n + s.warnings.length + s.blockingIssues.length * 2,
      0,
    ) * 0.03;

  let predictedScore: number;
  if (spec.higherIsBetter) {
    const drag = (spec.pressureFromDecisions ? pressure : warningLoad * 0.5) * (0.35 + decay * 0.65);
    predictedScore = clamp01(currentScore - drag - warningLoad * decay);
  } else {
    // Risk metrics: higher score = more risk
    const lift = (spec.pressureFromDecisions ? pressure : warningLoad) * (0.35 + decay * 0.65);
    predictedScore = clamp01(currentScore + lift + warningLoad * decay);
  }

  const delta = predictedScore - currentScore;
  const trend = trendFromDelta(delta, spec.higherIsBetter);
  const currentStance = stanceFromScore(currentScore, spec.higherIsBetter);
  const predictedStance = stanceFromScore(predictedScore, spec.higherIsBetter);
  const riskLevel = riskFromScore(predictedScore, spec.higherIsBetter);

  const contributors = (matched.length > 0 ? matched : context.signals.slice(0, 3)).map(
    (s) => s.contributorId,
  );

  const evidence: PredictionEvidence[] = (matched.length > 0 ? matched : context.signals.slice(0, 3)).map(
    (s, i) => ({
      id: `ev-${s.id}`,
      source: s.label,
      contributorId: s.contributorId,
      summary: s.summary,
      weight: i === 0 ? "primary" : "supporting",
      observedAt: s.analyzedAt,
    }),
  );

  if (spec.pressureFromDecisions && context.openDecisionCount > 0) {
    evidence.push({
      id: "ev-decisions",
      source: "Decision Center",
      summary: `${context.openDecisionCount} open decision(s); ${context.overdueDecisionCount} overdue; ${context.p1DecisionCount} P1.`,
      weight: "supporting",
      observedAt: context.capturedAt,
    });
  }

  const drivers = buildDrivers(kind, spec, matched, context, pressure, delta);
  const assumptions = defaultAssumptions(hLabel);
  const actions = preventiveActions(kind, predictedStance, trend);
  const title = PREDICTION_KIND_LABELS[kind];

  const verb =
    trend === "declining"
      ? spec.decliningVerb
      : trend === "improving"
        ? spec.improvingVerb
        : "remain near current levels";

  const narrative =
    trend === "stable"
      ? `Advisory forecast: over ${hLabel}, ${title.toLowerCase()} is projected to ${verb}, assuming current contributor conditions continue.`
      : `Advisory forecast: over ${hLabel}, ${title.toLowerCase()} is projected to ${verb} if current drivers persist and open decisions are not resolved.`;

  return {
    currentState: {
      label: title,
      stance: currentStance,
      summary: primary?.summary ?? "Current contributor snapshot.",
      score: Number(currentScore.toFixed(3)),
    },
    predictedState: {
      label: title,
      stance: predictedStance,
      summary: `Projected ${hLabel.toLowerCase()} stance: ${predictedStance.replace("_", " ")}.`,
      score: Number(predictedScore.toFixed(3)),
    },
    trend,
    riskLevel,
    primaryDrivers: drivers,
    supportingContributors: contributors,
    evidence,
    assumptions,
    recommendedPreventiveActions: actions,
    narrative,
    insufficientData: false,
    signalQuality: clamp01(
      scores.length / Math.max(1, spec.contributorIds.length || 1) * 0.6 +
        (matched[0]?.confidence ?? 0.4) * 0.4,
    ),
    pressureScore: pressure,
  };
}

function computeQueueGrowth(
  context: PredictionContext,
  _horizon: PredictionHorizon,
  hLabel: string,
  days: number,
  pressure: number,
  decay: number,
): ForecastComputeOutput {
  const open = context.openDecisionCount;
  const completionRate =
    context.completedDecisionCount + open > 0
      ? context.completedDecisionCount / (context.completedDecisionCount + open)
      : 0.3;
  const growthFactor = clamp01((1 - completionRate) * 0.5 + pressure * 0.5) * (0.4 + decay);
  const projectedOpen = Math.round(open * (1 + growthFactor * (days / 30)));
  const currentScore = clamp01(open / 20);
  const predictedScore = clamp01(projectedOpen / 20);
  const trend: PredictionTrend =
    projectedOpen > open + 1 ? "declining" : projectedOpen < open ? "improving" : "stable";
  // For queue growth, higher is worse → invert for stance helpers via higherIsBetter: false
  const currentStance = stanceFromScore(currentScore, false);
  const predictedStance = stanceFromScore(predictedScore, false);

  const evidence: PredictionEvidence[] = [
    {
      id: "ev-queue",
      source: "Decision Center",
      summary: `Open: ${open}; overdue: ${context.overdueDecisionCount}; completed (tracked): ${context.completedDecisionCount}.`,
      weight: "primary",
      observedAt: context.capturedAt,
    },
  ];

  return {
    currentState: {
      label: "Decision Queue Growth",
      stance: currentStance,
      summary: `${open} open decision(s) in the executive queue.`,
      score: Number(currentScore.toFixed(3)),
    },
    predictedState: {
      label: "Decision Queue Growth",
      stance: predictedStance,
      summary: `Projected ~${projectedOpen} open decision(s) in ${hLabel.toLowerCase()} if intake continues and resolution rate stays similar.`,
      score: Number(predictedScore.toFixed(3)),
    },
    trend,
    riskLevel: riskFromScore(predictedScore, false),
    primaryDrivers: [
      {
        id: "d-open",
        label: "Open decision volume",
        direction: open > 5 ? "negative" : "neutral",
        contribution: clamp01(open / 15),
        explanation: `${open} items currently open.`,
      },
      {
        id: "d-overdue",
        label: "Overdue pressure",
        direction: context.overdueDecisionCount > 0 ? "negative" : "neutral",
        contribution: clamp01(context.overdueDecisionCount / 8),
        explanation: `${context.overdueDecisionCount} overdue item(s).`,
      },
      {
        id: "d-completion",
        label: "Resolution rate",
        direction: completionRate >= 0.5 ? "positive" : "negative",
        contribution: completionRate,
        explanation: `Implied completion share ≈ ${(completionRate * 100).toFixed(0)}%.`,
      },
    ],
    supportingContributors: ["jag.decision_center"],
    evidence,
    assumptions: defaultAssumptions(hLabel),
    recommendedPreventiveActions: [
      {
        id: "a-triage",
        title: "Triage and close or assign stale P1/P2 decisions",
        rationale: "Reduces projected queue growth over the forecast horizon.",
        urgency: context.overdueDecisionCount > 0 ? "now" : "soon",
        relatedDecisionKinds: ["prioritize", "assign"],
      },
      {
        id: "a-batch",
        title: "Batch low-risk approvals in the next executive session",
        rationale: "Raises effective resolution rate without waiting for perfect information.",
        urgency: "soon",
      },
    ],
    narrative: `Advisory forecast: over ${hLabel}, the decision queue is projected to move from ${open} to ~${projectedOpen} open items if current intake and resolution patterns continue.`,
    insufficientData: false,
    signalQuality: 0.75,
    pressureScore: pressure,
  };
}

function insufficient(
  kind: PredictionKind,
  hLabel: string,
  context: PredictionContext,
): ForecastComputeOutput {
  return {
    currentState: {
      label: PREDICTION_KIND_LABELS[kind],
      stance: "insufficient",
      summary: "No bound contributor signals for this organization yet.",
    },
    predictedState: {
      label: PREDICTION_KIND_LABELS[kind],
      stance: "insufficient",
      summary: `Cannot produce a ${hLabel.toLowerCase()} advisory forecast without contributor outputs.`,
    },
    trend: "unknown",
    riskLevel: "unknown",
    primaryDrivers: [],
    supportingContributors: [],
    evidence: [
      {
        id: "ev-none",
        source: "Prediction Engine",
        summary: `Organization ${context.organizationName} has no usable signals in the prediction context.`,
        weight: "contextual",
        observedAt: context.capturedAt,
      },
    ],
    assumptions: [
      {
        id: "a-bind",
        statement: "Forecasts require at least one bound Education / operations contributor output.",
        impactIfWrong: "N/A — forecast withheld until signals exist.",
      },
    ],
    recommendedPreventiveActions: [
      {
        id: "a-bind",
        title: "Bind Education contributor outputs for this organization",
        rationale: "Enables advisory forecasts with evidence and confidence.",
        urgency: "now",
      },
    ],
    narrative: `Advisory notice: insufficient data to forecast ${PREDICTION_KIND_LABELS[kind].toLowerCase()} over ${hLabel}.`,
    insufficientData: true,
    signalQuality: 0,
    pressureScore: decisionPressure(context),
  };
}

function buildDrivers(
  kind: PredictionKind,
  spec: KindSpec,
  matched: PredictionSignal[],
  context: PredictionContext,
  pressure: number,
  delta: number,
): PredictionDriver[] {
  const drivers: PredictionDriver[] = [];
  matched.slice(0, 3).forEach((s, i) => {
    const neg = s.blockingIssues.length > 0 || s.warnings.length > 2;
    drivers.push({
      id: `d-sig-${i}`,
      label: s.label,
      direction: neg ? "negative" : "neutral",
      contribution: clamp01(s.confidence * (neg ? 0.8 : 0.5)),
      explanation: s.summary,
    });
  });
  if (spec.pressureFromDecisions) {
    drivers.push({
      id: "d-dec-pressure",
      label: "Open decision pressure",
      direction: pressure > 0.2 ? "negative" : "neutral",
      contribution: pressure,
      explanation: `${context.openDecisionCount} open / ${context.overdueDecisionCount} overdue decisions influence this ${PREDICTION_KIND_LABELS[kind]} forecast.`,
    });
  }
  if (drivers.length === 0) {
    drivers.push({
      id: "d-delta",
      label: "Projected drift",
      direction: delta < -0.03 ? "negative" : delta > 0.03 ? "positive" : "neutral",
      contribution: clamp01(Math.abs(delta) * 2),
      explanation: "Derived from available organizational signals and horizon decay.",
    });
  }
  return drivers.slice(0, 5);
}

function defaultAssumptions(hLabel: string): PredictionAssumption[] {
  return [
    {
      id: "a-continuity",
      statement: `Contributor conditions and decision intake remain similar across the ${hLabel} horizon.`,
      impactIfWrong: "A material operational change would invalidate the projected stance.",
    },
    {
      id: "a-advisory",
      statement: "This forecast is advisory and must not be treated as a guaranteed outcome.",
      impactIfWrong: "Treating it as fact may cause over- or under-reaction.",
    },
    {
      id: "a-no-shock",
      statement: "No external shock (policy, funding cliff, or enrollment shock) is modeled explicitly.",
      impactIfWrong: "Unmodeled shocks can dominate the forecast path.",
    },
  ];
}

function preventiveActions(
  kind: PredictionKind,
  stance: PredictionStance,
  trend: PredictionTrend,
): PreventiveAction[] {
  const urgent = stance === "critical" || stance === "at_risk" || trend === "declining";
  const base: PreventiveAction[] = [
    {
      id: `a-${kind}-review`,
      title: `Review ${PREDICTION_KIND_LABELS[kind]} drivers in Decision Center`,
      rationale: "Addresses the primary contributors behind this advisory forecast.",
      urgency: urgent ? "now" : "soon",
    },
    {
      id: `a-${kind}-monitor`,
      title: "Re-run forecasts after the next contributor refresh",
      rationale: "Confidence and projected stance update when evidence changes.",
      urgency: "monitor",
    },
  ];
  if (kind === "operational_readiness" || kind === "organization_health") {
    base.unshift({
      id: "a-close-blocking",
      title: "Resolve blocking operational decisions within 30 days",
      rationale: "Open blocking decisions are a primary drag on readiness forecasts.",
      urgency: urgent ? "now" : "soon",
      relatedDecisionKinds: ["operational", "staffing"],
    });
  }
  if (kind === "compliance_risk") {
    base.unshift({
      id: "a-compliance",
      title: "Close compliance gaps called out by contributor warnings",
      rationale: "Reduces projected compliance risk over the horizon.",
      urgency: "now",
    });
  }
  return base.slice(0, 4);
}
