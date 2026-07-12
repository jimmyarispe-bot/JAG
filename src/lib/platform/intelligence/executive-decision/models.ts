/**
 * Executive Decision Intelligence — DecisionModels helpers (Sprint 026).
 */

import type {
  DecisionBaseline,
  DecisionScenarioDefinition,
  DecisionScenarioKind,
  ScenarioShock,
  StrategyInitiative,
} from "@/lib/platform/intelligence/executive-decision/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";

/** Default baseline when no graph / overrides are supplied. */
export function defaultBaseline(): DecisionBaseline {
  return {
    enrollment: 100,
    revenue: 50000,
    payroll: 28000,
    outstanding: 8000,
    staff: 40,
    organizationHealthScore: 75,
    financialHealthScore: 75,
    founderHealthScore: 75,
    overallRisk: 0.35,
    overallOpportunity: 0.4,
  };
}

/** Derive a baseline from graph analysis + optional build input + overrides. */
export function deriveBaseline(
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  overrides?: Partial<DecisionBaseline>
): DecisionBaseline {
  const base = defaultBaseline();
  const executive = graphInput?.executive;
  const health = graphInput?.organizationHealth;
  const founder = graphInput?.founder;

  const derived: DecisionBaseline = {
    enrollment: executive?.enrollment ?? base.enrollment,
    revenue: executive?.revenue ?? base.revenue,
    payroll: Math.round((executive?.staff ?? base.staff) * 700),
    outstanding: executive?.outstanding ?? base.outstanding,
    staff: executive?.staff ?? base.staff,
    organizationHealthScore: health?.overallScore ?? base.organizationHealthScore,
    financialHealthScore: health?.financialScore ?? base.financialHealthScore,
    founderHealthScore: founder?.healthScore ?? base.founderHealthScore,
    overallRisk: analysis?.dashboard.overallRisk ?? base.overallRisk,
    overallOpportunity:
      analysis?.dashboard.overallOpportunity ?? base.overallOpportunity,
  };

  return { ...derived, ...overrides };
}

/** Apply relative/absolute shocks to a baseline (pure, deterministic). */
export function applyShocksToBaseline(
  baseline: DecisionBaseline,
  shocks: ScenarioShock[]
): DecisionBaseline {
  const next = { ...baseline };

  for (const shock of shocks) {
    const key = shock.key.toLowerCase();
    const magnitude =
      shock.unit === "percent" ? shock.magnitude / 100 : shock.magnitude;

    const applyRelative = (current: number) =>
      shock.unit === "absolute" ? magnitude : current * (1 + magnitude);

    if (key.includes("enrollment") || shock.targetNodeKey?.includes("enrollment")) {
      next.enrollment = Math.max(0, applyRelative(next.enrollment));
    } else if (
      key.includes("payroll") ||
      key.includes("salary") ||
      shock.targetNodeKey?.includes("payroll")
    ) {
      next.payroll = Math.max(0, applyRelative(next.payroll));
    } else if (key.includes("revenue") || shock.targetNodeKey?.includes("revenue")) {
      next.revenue = Math.max(0, applyRelative(next.revenue));
    } else if (key.includes("staff") || key.includes("hiring") || key.includes("hire")) {
      next.staff = Math.max(0, applyRelative(next.staff));
      if (shock.unit !== "absolute" || key.includes("hiring") || key.includes("hire")) {
        next.payroll = Math.max(0, next.payroll * (1 + magnitude * 0.85));
      }
    } else if (key.includes("outstanding") || key.includes("ar") || key.includes("receivable")) {
      next.outstanding = Math.max(0, applyRelative(next.outstanding));
    } else if (key.includes("campus") || key.includes("expansion")) {
      next.staff = Math.max(0, next.staff * (1 + Math.abs(magnitude) * 0.25));
      next.payroll = Math.max(0, next.payroll * (1 + Math.abs(magnitude) * 0.3));
      next.revenue = Math.max(0, next.revenue * (1 + magnitude * 0.15));
      next.enrollment = Math.max(0, next.enrollment * (1 + magnitude * 0.2));
    } else if (key.includes("health")) {
      next.organizationHealthScore = Math.min(
        100,
        Math.max(0, applyRelative(next.organizationHealthScore))
      );
    }
  }

  // Secondary effects: enrollment ↔ revenue coupling
  const enrollmentDelta =
    baseline.enrollment === 0
      ? 0
      : (next.enrollment - baseline.enrollment) / baseline.enrollment;
  if (Math.abs(enrollmentDelta) > 0.001) {
    next.revenue = Math.max(0, next.revenue * (1 + enrollmentDelta * 0.85));
    next.organizationHealthScore = Math.min(
      100,
      Math.max(0, next.organizationHealthScore + enrollmentDelta * 20)
    );
  }

  const payrollDelta =
    baseline.payroll === 0 ? 0 : (next.payroll - baseline.payroll) / baseline.payroll;
  if (Math.abs(payrollDelta) > 0.001) {
    next.financialHealthScore = Math.min(
      100,
      Math.max(0, next.financialHealthScore - payrollDelta * 25)
    );
  }

  next.overallRisk = Math.min(
    1,
    Math.max(
      0,
      next.overallRisk +
        Math.max(0, -enrollmentDelta) * 0.4 +
        Math.max(0, payrollDelta) * 0.25 +
        Math.max(0, (next.outstanding - baseline.outstanding) / Math.max(1, baseline.outstanding)) *
          0.15
    )
  );

  next.overallOpportunity = Math.min(
    1,
    Math.max(
      0,
      next.overallOpportunity +
        Math.max(0, enrollmentDelta) * 0.35 -
        Math.max(0, payrollDelta) * 0.1
    )
  );

  return next;
}

/** Preset scenario builders for common executive what-ifs. */
export function createPresetScenario(
  kind: DecisionScenarioKind,
  options: {
    id?: string;
    magnitude?: number;
    title?: string;
    question?: string;
    initiatives?: StrategyInitiative[];
  } = {}
): DecisionScenarioDefinition {
  const magnitude = options.magnitude ?? defaultMagnitude(kind);
  const id = options.id ?? `scenario-${kind}`;

  switch (kind) {
    case "enrollment_drop":
      return {
        id,
        kind,
        title: options.title ?? `Enrollment drop ${Math.abs(magnitude * 100).toFixed(0)}%`,
        question:
          options.question ??
          `What happens if enrollment drops ${Math.abs(magnitude * 100).toFixed(0)}%?`,
        shocks: [
          {
            key: "enrollment",
            label: "Enrollment change",
            magnitude: -Math.abs(magnitude),
            unit: "relative",
            targetDomain: "admissions",
            targetNodeKey: "admissions.enrollment",
          },
        ],
      };
    case "payroll_increase":
      return {
        id,
        kind,
        title: options.title ?? `Payroll increase ${(magnitude * 100).toFixed(0)}%`,
        question:
          options.question ??
          `What happens if payroll increases ${(magnitude * 100).toFixed(0)}%?`,
        shocks: [
          {
            key: "payroll",
            label: "Payroll change",
            magnitude: Math.abs(magnitude),
            unit: "relative",
            targetDomain: "hr",
            targetNodeKey: "hr.payroll",
          },
        ],
      };
    case "campus_expansion":
      return {
        id,
        kind,
        title: options.title ?? "Open another campus",
        question: options.question ?? "Should another campus be opened?",
        shocks: [
          {
            key: "campus_expansion",
            label: "Campus expansion investment",
            magnitude: Math.abs(magnitude || 0.2),
            unit: "relative",
            targetDomain: "operations",
          },
        ],
        initiatives: options.initiatives ?? [
          {
            id: `${id}-campus`,
            title: "New campus launch",
            kind: "campus",
            description: "Open an additional campus to expand enrollment capacity.",
            investment: 250000,
            expectedReturn: 320000,
            timeHorizonMonths: 24,
            missionWeight: 0.75,
            riskWeight: 0.65,
            dependencies: ["leadership bandwidth", "capital reserves", "staffing pipeline"],
            metadata: {},
          },
        ],
      };
    case "hiring_timing":
      return {
        id,
        kind,
        title: options.title ?? "Hiring timing",
        question: options.question ?? "Should hiring occur now or later?",
        timing: "immediate",
        compareTiming: ["immediate", "deferred"],
        shocks: [
          {
            key: "hiring",
            label: "Hiring headcount",
            magnitude: Math.abs(magnitude || 0.08),
            unit: "relative",
            targetDomain: "hr",
            targetNodeKey: "hr.staff",
          },
        ],
      };
    case "strategic_initiative":
      return {
        id,
        kind,
        title: options.title ?? "Strategic initiative ROI",
        question:
          options.question ?? "Which strategic initiative creates the highest ROI?",
        shocks: [],
        initiatives: options.initiatives ?? defaultInitiatives(id),
      };
    default:
      return {
        id,
        kind: "custom",
        title: options.title ?? "Custom scenario",
        question: options.question ?? "What is the impact of this custom scenario?",
        shocks: [],
        initiatives: options.initiatives,
      };
  }
}

function defaultMagnitude(kind: DecisionScenarioKind): number {
  switch (kind) {
    case "enrollment_drop":
      return 0.1;
    case "payroll_increase":
      return 0.08;
    case "campus_expansion":
      return 0.2;
    case "hiring_timing":
      return 0.08;
    default:
      return 0.1;
  }
}

function defaultInitiatives(prefix: string): StrategyInitiative[] {
  return [
    {
      id: `${prefix}-admissions`,
      title: "Admissions outreach expansion",
      kind: "growth",
      description: "Expand pipeline outreach to lift enrollment.",
      investment: 40000,
      expectedReturn: 95000,
      timeHorizonMonths: 12,
      missionWeight: 0.7,
      riskWeight: 0.35,
      dependencies: ["marketing capacity"],
      metadata: {},
    },
    {
      id: `${prefix}-collections`,
      title: "Collections acceleration",
      kind: "efficiency",
      description: "Reduce outstanding receivables through process redesign.",
      investment: 15000,
      expectedReturn: 48000,
      timeHorizonMonths: 6,
      missionWeight: 0.4,
      riskWeight: 0.25,
      dependencies: ["finance ops"],
      metadata: {},
    },
    {
      id: `${prefix}-talent`,
      title: "Teacher retention program",
      kind: "talent",
      description: "Invest in retention to stabilize academic quality.",
      investment: 30000,
      expectedReturn: 55000,
      timeHorizonMonths: 18,
      missionWeight: 0.85,
      riskWeight: 0.4,
      dependencies: ["HR bandwidth"],
      metadata: {},
    },
  ];
}

/** DecisionModels façade — pure helpers grouped for DI consumers. */
export const decisionModels = {
  defaultBaseline,
  deriveBaseline,
  applyShocksToBaseline,
  createPresetScenario,
};
