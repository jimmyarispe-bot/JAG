/**
 * Deterministic advisory scenario impact model — Sprint 202.
 */

import { buildScenarioAssumptions } from "./ScenarioAssumptions";
import type {
  ScenarioDimensionImpact,
  ScenarioDriver,
  ScenarioEvidence,
  ScenarioRecommendedDecision,
  ScenarioResult,
  ScenarioStateSnapshot,
  ScenarioTradeOff,
} from "./ScenarioResult";
import type {
  ScenarioBaseline,
  ScenarioImpactDimension,
  ScenarioInputs,
  ScenarioKind,
  ScenarioStance,
} from "./ScenarioTypes";
import { SCENARIO_KIND_LABELS } from "./ScenarioTypes";
import { getScenarioTemplate } from "./ScenarioTemplates";

const ADVISORY =
  "Advisory scenario projection — not certainty. Separate observed facts, forecasts, and assumptions.";

const DIMENSION_LABELS: Record<ScenarioImpactDimension, string> = {
  organization_health: "Organization Health",
  operational_readiness: "Operational Readiness",
  staffing_capacity: "Staffing Capacity",
  funding_readiness: "Funding Readiness",
  student_success: "Student Success",
  enrollment: "Enrollment",
  compliance_risk: "Compliance Risk",
  decision_pressure: "Decision Pressure",
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function stanceFromScore(score: number): ScenarioStance {
  if (score >= 0.75) return "favorable";
  if (score >= 0.55) return "watch";
  if (score >= 0.35) return "at_risk";
  return "critical";
}

function bandOf(c: number): "low" | "moderate" | "high" {
  if (c >= 0.7) return "high";
  if (c >= 0.45) return "moderate";
  return "low";
}

function baselineScore(baseline: ScenarioBaseline): number {
  if (typeof baseline.healthScore === "number") return clamp01(baseline.healthScore);
  if (baseline.signals.length === 0) return 0.5;
  const scores = baseline.signals.map((s) =>
    typeof s.score === "number" ? clamp01(s.score) : clamp01(0.45 + s.confidence * 0.2)
  );
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function avgContributorConfidence(baseline: ScenarioBaseline): number {
  if (baseline.signals.length === 0) return 0.35;
  return (
    baseline.signals.reduce((a, s) => a + s.confidence, 0) / baseline.signals.length
  );
}

/** Kind-specific pressure vector on dimensions (positive = improves score). */
function kindEffects(
  kind: ScenarioKind,
  inputs: ScenarioInputs
): Partial<Record<ScenarioImpactDimension, number>> {
  const enroll = (inputs.enrollmentPercent ?? 0) / 100;
  const head = (inputs.headcount ?? inputs.staffCount ?? 0) / 20;
  const fund = (inputs.fundingDollars ?? 0) / 1_000_000;
  const cap = inputs.capacity ?? 0;
  const timeline = Math.max(14, inputs.timelineDays ?? 90);
  const slow = clamp01(timeline / 180);

  switch (kind) {
    case "enrollment_growth":
      return {
        enrollment: enroll * 0.8,
        student_success: enroll * 0.2,
        staffing_capacity: -Math.abs(enroll) * 0.5 - Math.abs(cap) * 0.2,
        operational_readiness: -Math.abs(enroll) * 0.35,
        funding_readiness: fund * 0.3 - Math.abs(enroll) * 0.15,
        organization_health: enroll * 0.15 - Math.abs(enroll) * 0.1 * slow,
      };
    case "enrollment_decline":
      return {
        enrollment: enroll * 0.8,
        funding_readiness: fund * 0.4 + enroll * 0.5,
        staffing_capacity: -enroll * 0.2,
        student_success: enroll * 0.35,
        organization_health: enroll * 0.4,
        operational_readiness: enroll * 0.1,
      };
    case "teacher_hiring":
      return {
        staffing_capacity: head * 0.9,
        operational_readiness: head * 0.55,
        student_success: head * 0.35,
        funding_readiness: fund * 0.5 - Math.abs(head) * 0.15,
        organization_health: head * 0.3,
        decision_pressure: -0.05,
      };
    case "teacher_loss":
      return {
        staffing_capacity: head * 0.9,
        operational_readiness: head * 0.7,
        student_success: head * 0.45,
        organization_health: head * 0.35,
        decision_pressure: 0.12,
      };
    case "funding_increase":
      return {
        funding_readiness: Math.max(0, fund) * 0.9,
        operational_readiness: Math.max(0, fund) * 0.35,
        staffing_capacity: Math.max(0, fund) * 0.2 + head * 0.2,
        organization_health: Math.max(0, fund) * 0.25,
        compliance_risk: Math.max(0, fund) * 0.1,
      };
    case "funding_reduction":
      return {
        funding_readiness: fund * 0.9,
        operational_readiness: fund * 0.45 + head * 0.2,
        staffing_capacity: fund * 0.25 + head * 0.4,
        organization_health: fund * 0.35,
        decision_pressure: 0.1,
      };
    case "budget_reallocation":
      return {
        funding_readiness: 0.02,
        operational_readiness: cap * 0.4,
        staffing_capacity: head * 0.3,
        student_success: cap * 0.25,
        organization_health: 0.03,
        decision_pressure: 0.04,
      };
    case "open_new_campus":
      return {
        enrollment: enroll * 0.7,
        staffing_capacity: head * 0.5 - 0.1,
        funding_readiness: fund * 0.4 - 0.08,
        operational_readiness: -0.12 + head * 0.2,
        organization_health: 0.05,
        decision_pressure: 0.15,
        compliance_risk: -0.05,
      };
    case "close_program":
      return {
        enrollment: enroll * 0.7,
        staffing_capacity: -head * 0.3 + 0.08,
        funding_readiness: fund * 0.5 + 0.05,
        student_success: enroll * 0.4,
        organization_health: enroll * 0.2,
        operational_readiness: 0.06,
        decision_pressure: 0.1,
      };
    case "compliance_change":
      return {
        compliance_risk: -0.12 + (inputs.staffCount ?? 0) * 0.02,
        operational_readiness: cap * 0.5 + head * 0.2,
        staffing_capacity: head * 0.4,
        funding_readiness: fund * 0.2 - 0.04,
        organization_health: -0.04,
        decision_pressure: 0.08,
      };
    case "custom":
    default:
      return {
        enrollment: enroll * 0.5,
        staffing_capacity: head * 0.5,
        funding_readiness: fund * 0.5,
        operational_readiness: cap * 0.4 + head * 0.15,
        organization_health: enroll * 0.15 + head * 0.15 + fund * 0.15,
        student_success: enroll * 0.2 + head * 0.15,
      };
  }
}

export type ScenarioModelComputeInput = {
  readonly kind: ScenarioKind;
  readonly inputs: ScenarioInputs;
  readonly baseline: ScenarioBaseline;
};

export function computeScenarioModel(input: ScenarioModelComputeInput): Omit<
  ScenarioResult,
  "id" | "generatedAt" | "confidence" | "confidenceBand" | "confidenceExplanation"
> & {
  readonly signalQuality: number;
  readonly inputStrength: number;
} {
  const { kind, inputs, baseline } = input;
  const template = getScenarioTemplate(kind);
  const title =
    kind === "custom" && inputs.customLabel
      ? inputs.customLabel
      : template.title;
  const timelineDays = Math.max(1, inputs.timelineDays ?? 90);
  const currentScore = baselineScore(baseline);
  const effects = kindEffects(kind, inputs);

  const dimensions: ScenarioDimensionImpact[] = (
    Object.keys(DIMENSION_LABELS) as ScenarioImpactDimension[]
  ).map((dimension) => {
    const delta = effects[dimension] ?? 0;
    // compliance_risk: higher is worse — invert for score space
    const signed =
      dimension === "compliance_risk" || dimension === "decision_pressure"
        ? -delta
        : delta;
    const current = currentScore;
    const scenario = clamp01(current + signed);
    return {
      dimension,
      label: DIMENSION_LABELS[dimension],
      currentScore: Number(current.toFixed(3)),
      scenarioScore: Number(scenario.toFixed(3)),
      delta: Number((scenario - current).toFixed(3)),
      summary: `${DIMENSION_LABELS[dimension]} ${
        scenario - current >= 0.02
          ? "improves"
          : scenario - current <= -0.02
            ? "worsens"
            : "stays near current"
      } under this scenario.`,
    };
  });

  const material = dimensions.filter((d) => Math.abs(d.delta) >= 0.02);
  const scoreDelta =
    material.length > 0
      ? material.reduce((a, d) => a + d.delta, 0) / material.length
      : dimensions.reduce((a, d) => a + d.delta, 0) / dimensions.length;
  const scenarioScore = clamp01(currentScore + scoreDelta);

  const currentState: ScenarioStateSnapshot = {
    label: "Current",
    stance: stanceFromScore(currentScore),
    summary:
      baseline.healthStance != null
        ? `Bound baseline stance: ${String(baseline.healthStance)}. Score ${(currentScore * 100).toFixed(0)}%.`
        : baseline.signals.length > 0
          ? `Derived from ${baseline.signals.length} bound contributor signal(s).`
          : "Thin baseline — no bound contributor signals; midpoint used for comparison only.",
    score: Number(currentScore.toFixed(3)),
  };

  const scenarioState: ScenarioStateSnapshot = {
    label: title,
    stance: stanceFromScore(scenarioScore),
    summary: `Projected stance ${stanceFromScore(scenarioScore).replace("_", " ")} after ~${timelineDays} days under stated inputs.`,
    score: Number(scenarioScore.toFixed(3)),
  };

  const drivers = buildDrivers(kind, inputs, material);
  const evidence = buildEvidence(baseline, inputs);
  const assumptions = buildScenarioAssumptions({
    kindLabel: title,
    timelineDays,
    hasBaselineSignals: baseline.signals.length > 0,
  });
  const { risks, opportunities, tradeOffs } = buildRisksOpportunities(
    kind,
    material,
    scoreDelta
  );
  const recommendedDecisions = buildRecommendations(kind, scoreDelta, risks);

  const inputParts = describeInputs(inputs);
  const narrative = [
    `Advisory scenario: ${title}.`,
    `Inputs: ${inputParts.join("; ") || "template defaults"}.`,
    `Projected composite difference: ${scoreDelta >= 0 ? "+" : ""}${(scoreDelta * 100).toFixed(1)} points vs current.`,
    risks[0] ? `Primary risk: ${risks[0]}` : "",
    opportunities[0] ? `Primary opportunity: ${opportunities[0]}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inputStrength = clamp01(
    (Math.abs(inputs.enrollmentPercent ?? 0) / 25 +
      Math.abs(inputs.headcount ?? inputs.staffCount ?? 0) / 15 +
      Math.abs(inputs.fundingDollars ?? 0) / 500_000 +
      Math.abs(inputs.capacity ?? 0) / 0.2) /
      2
  );

  return {
    kind,
    title,
    advisoryNotice: ADVISORY,
    organizationId: inputs.organizationId,
    organizationName: inputs.organizationName,
    inputs,
    currentState,
    scenarioState,
    projectedDifference: {
      scoreDelta: Number(scoreDelta.toFixed(3)),
      summary: `Composite projected difference ${scoreDelta >= 0 ? "+" : ""}${(scoreDelta * 100).toFixed(1)} points across material dimensions.`,
      dimensions,
    },
    primaryDrivers: drivers,
    evidence,
    assumptions,
    risks,
    opportunities,
    tradeOffs,
    recommendedDecisions,
    narrative,
    insufficientBaseline: baseline.signals.length === 0 && baseline.healthScore == null,
    signalQuality: clamp01(
      (baseline.signals.length / 3) * 0.5 + avgContributorConfidence(baseline) * 0.5
    ),
    inputStrength,
  };
}

function describeInputs(inputs: ScenarioInputs): string[] {
  const parts: string[] = [];
  if (inputs.enrollmentPercent != null)
    parts.push(`enrollment ${inputs.enrollmentPercent}%`);
  if (inputs.headcount != null) parts.push(`headcount ${inputs.headcount}`);
  if (inputs.staffCount != null && inputs.staffCount !== inputs.headcount)
    parts.push(`staff ${inputs.staffCount}`);
  if (inputs.fundingDollars != null)
    parts.push(`funding $${inputs.fundingDollars.toLocaleString()}`);
  if (inputs.capacity != null) parts.push(`capacity ${inputs.capacity}`);
  if (inputs.timelineDays != null) parts.push(`timeline ${inputs.timelineDays}d`);
  if (inputs.domainName) parts.push(`domain ${inputs.domainName}`);
  if (inputs.notes) parts.push(`notes: ${inputs.notes}`);
  return parts;
}

function buildDrivers(
  kind: ScenarioKind,
  inputs: ScenarioInputs,
  material: readonly ScenarioDimensionImpact[]
): ScenarioDriver[] {
  const drivers: ScenarioDriver[] = material.slice(0, 4).map((d, i) => ({
    id: `d-${d.dimension}`,
    label: d.label,
    direction: d.delta > 0.01 ? "positive" : d.delta < -0.01 ? "negative" : "neutral",
    contribution: clamp01(Math.abs(d.delta) * 3),
    explanation: d.summary,
  }));
  if (inputs.enrollmentPercent != null) {
    drivers.unshift({
      id: "d-enroll-input",
      label: "Enrollment input",
      direction: inputs.enrollmentPercent >= 0 ? "positive" : "negative",
      contribution: clamp01(Math.abs(inputs.enrollmentPercent) / 20),
      explanation: `${SCENARIO_KIND_LABELS[kind]} applies enrollment Δ ${inputs.enrollmentPercent}%.`,
    });
  }
  return drivers.slice(0, 5);
}

function buildEvidence(
  baseline: ScenarioBaseline,
  inputs: ScenarioInputs
): ScenarioEvidence[] {
  const evidence: ScenarioEvidence[] = [
    {
      id: "ev-inputs",
      source: "Scenario Planner inputs",
      summary: describeInputs(inputs).join("; ") || "Template default inputs",
      kind: "input",
    },
  ];
  for (const s of baseline.signals.slice(0, 4)) {
    evidence.push({
      id: `ev-${s.id}`,
      source: s.label,
      contributorId: s.contributorId,
      summary: s.summary,
      kind: "observed",
    });
  }
  if (baseline.openDecisionCount > 0) {
    evidence.push({
      id: "ev-decisions",
      source: "Decision Center",
      summary: `${baseline.openDecisionCount} open decision(s) in baseline context.`,
      kind: "observed",
    });
  }
  evidence.push({
    id: "ev-derived",
    source: "Scenario Model",
    summary: "Dimension deltas derived deterministically from inputs × baseline.",
    kind: "derived",
  });
  return evidence;
}

function buildRisksOpportunities(
  kind: ScenarioKind,
  material: readonly ScenarioDimensionImpact[],
  scoreDelta: number
): {
  risks: string[];
  opportunities: string[];
  tradeOffs: ScenarioTradeOff[];
} {
  const risks: string[] = [];
  const opportunities: string[] = [];
  for (const d of material) {
    if (d.delta <= -0.03) risks.push(d.summary);
    if (d.delta >= 0.03) opportunities.push(d.summary);
  }
  if (kind === "open_new_campus") {
    risks.push("Campus launch load may concentrate decision pressure and compliance work.");
    opportunities.push("Enrollment and long-term capacity expansion if staffing keeps pace.");
  }
  if (kind === "teacher_hiring") {
    risks.push("Funding and onboarding lag may delay realized capacity gains.");
    opportunities.push("Instructional capacity and readiness improve if hires land on timeline.");
  }
  if (risks.length === 0) risks.push("Residual execution risk remains even when composite delta is small.");
  if (opportunities.length === 0 && scoreDelta > 0) {
    opportunities.push("Modest composite improvement if assumptions hold.");
  }

  const worst = material.slice().sort((a, b) => a.delta - b.delta)[0];
  const best = material.slice().sort((a, b) => b.delta - a.delta)[0];
  const tradeOffs: ScenarioTradeOff[] = [
    {
      id: "t-main",
      gain: best ? best.summary : "Limited upside under stated inputs",
      cost: worst ? worst.summary : "Limited downside under stated inputs",
    },
  ];

  return {
    risks: risks.slice(0, 5),
    opportunities: opportunities.slice(0, 5),
    tradeOffs,
  };
}

function buildRecommendations(
  kind: ScenarioKind,
  scoreDelta: number,
  risks: readonly string[]
): ScenarioRecommendedDecision[] {
  const decisions: ScenarioRecommendedDecision[] = [
    {
      id: "r-review",
      title: "Review scenario trade-offs in Decision Center before committing",
      rationale: "Keeps observed facts, forecasts, and scenario projections separated.",
      urgency: scoreDelta < -0.05 || risks.length >= 3 ? "now" : "soon",
    },
    {
      id: "r-bind",
      title: "Refresh bound contributor intelligence, then re-run the scenario",
      rationale: "Confidence rises when baseline evidence is current.",
      urgency: "monitor",
    },
  ];
  if (kind === "teacher_hiring" || kind === "teacher_loss") {
    decisions.unshift({
      id: "r-staff",
      title: "Decide staffing action with explicit timeline and funding cover",
      rationale: "Staffing scenarios are sensitive to hire/loss timing.",
      urgency: "now",
    });
  }
  if (kind === "funding_increase" || kind === "funding_reduction") {
    decisions.unshift({
      id: "r-fund",
      title: "Pair funding decision with operational readiness owners",
      rationale: "Funding deltas alone do not realize outcomes without execution.",
      urgency: "soon",
    });
  }
  return decisions.slice(0, 4);
}
