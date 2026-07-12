/**
 * Predictive Intelligence — PredictionModels helpers (Sprint 028).
 */

import type { DecisionBaseline } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type {
  ForecastBaseline,
  ForecastDomain,
  ForecastHorizonDays,
  ForecastScenarioDefinition,
  ForecastScenarioKind,
  HistoricalSignal,
} from "@/lib/platform/intelligence/predictive-intelligence/types";
import {
  FORECAST_DOMAINS,
  FORECAST_HORIZONS,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

/** Default baseline when no upstream signals are supplied. */
export function defaultForecastBaseline(): ForecastBaseline {
  return {
    enrollment: 100,
    revenue: 50000,
    cashFlow: 12000,
    expense: 38000,
    payroll: 28000,
    staffing: 40,
    capacity: 120,
    admissions: 18,
    missionScore: 75,
    riskScore: 0.35,
    executiveKpi: 78,
    organizationHealthScore: 75,
    financialHealthScore: 75,
    founderHealthScore: 75,
  };
}

/** Map ForecastDomain → ForecastBaseline field. */
export function baselineValueForDomain(
  baseline: ForecastBaseline,
  domain: ForecastDomain
): number {
  switch (domain) {
    case "enrollment":
      return baseline.enrollment;
    case "revenue":
      return baseline.revenue;
    case "cash_flow":
      return baseline.cashFlow;
    case "expense":
      return baseline.expense;
    case "payroll":
      return baseline.payroll;
    case "staffing":
      return baseline.staffing;
    case "capacity":
      return baseline.capacity;
    case "admissions":
      return baseline.admissions;
    case "mission":
      return baseline.missionScore;
    case "risk":
      return baseline.riskScore;
    case "executive_kpi":
      return baseline.executiveKpi;
    default: {
      const _exhaustive: never = domain;
      return _exhaustive;
    }
  }
}

/** Derive a forecast baseline from graph / decision / overrides. */
export function deriveForecastBaseline(
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  decisionBaseline: DecisionBaseline | null | undefined,
  overrides?: Partial<ForecastBaseline>
): ForecastBaseline {
  const base = defaultForecastBaseline();
  const executive = graphInput?.executive;
  const health = graphInput?.organizationHealth;
  const founder = graphInput?.founder;

  const enrollment =
    decisionBaseline?.enrollment ?? executive?.enrollment ?? base.enrollment;
  const revenue =
    decisionBaseline?.revenue ?? executive?.revenue ?? base.revenue;
  const payroll =
    decisionBaseline?.payroll ??
    Math.round((executive?.staff ?? base.staffing) * 700);
  const staffing =
    decisionBaseline?.staff ?? executive?.staff ?? base.staffing;
  const admissions = executive?.admissions ?? base.admissions;
  const expense = Math.round(payroll * 1.25 + revenue * 0.15);
  const cashFlow = revenue - expense;
  const capacity = Math.max(enrollment * 1.15, staffing * 3);
  const organizationHealthScore =
    decisionBaseline?.organizationHealthScore ??
    health?.overallScore ??
    base.organizationHealthScore;
  const financialHealthScore =
    decisionBaseline?.financialHealthScore ??
    health?.financialScore ??
    base.financialHealthScore;
  const founderHealthScore =
    decisionBaseline?.founderHealthScore ??
    founder?.healthScore ??
    base.founderHealthScore;
  const riskScore =
    decisionBaseline?.overallRisk ??
    analysis?.dashboard.overallRisk ??
    base.riskScore;
  const missionScore = Math.min(
    100,
    Math.max(
      0,
      (organizationHealthScore + founderHealthScore) / 2 +
        (decisionBaseline?.overallOpportunity ??
          analysis?.dashboard.overallOpportunity ??
          0.4) *
          10
    )
  );
  const executiveKpi = Math.min(
    100,
    Math.max(
      0,
      organizationHealthScore * 0.4 +
        financialHealthScore * 0.3 +
        founderHealthScore * 0.2 +
        (1 - riskScore) * 10
    )
  );

  const derived: ForecastBaseline = {
    enrollment,
    revenue,
    cashFlow,
    expense,
    payroll,
    staffing,
    capacity,
    admissions,
    missionScore,
    riskScore,
    executiveKpi,
    organizationHealthScore,
    financialHealthScore,
    founderHealthScore,
  };

  return { ...derived, ...overrides };
}

/** Build synthetic historical series from a baseline + mild drift. */
export function synthesizeHistoricalSignals(
  baseline: ForecastBaseline,
  domains: ForecastDomain[],
  now: Date,
  points = 6
): HistoricalSignal[] {
  const signals: HistoricalSignal[] = [];
  const driftByDomain: Partial<Record<ForecastDomain, number>> = {
    enrollment: 0.008,
    revenue: 0.01,
    cash_flow: 0.005,
    expense: 0.012,
    payroll: 0.009,
    staffing: 0.004,
    capacity: 0.003,
    admissions: 0.015,
    mission: -0.002,
    risk: 0.01,
    executive_kpi: -0.003,
  };

  for (const domain of domains) {
    const current = baselineValueForDomain(baseline, domain);
    const monthlyDrift = driftByDomain[domain] ?? 0.005;
    for (let i = points - 1; i >= 0; i -= 1) {
      const observed = new Date(now);
      observed.setUTCDate(observed.getUTCDate() - i * 30);
      const ageFactor = points - 1 - i;
      const noise = ((i % 3) - 1) * 0.004;
      const value = Math.max(
        0,
        current * (1 - monthlyDrift * ageFactor + noise)
      );
      signals.push({
        domain,
        observedAt: observed.toISOString(),
        value,
        source: "synthetic",
      });
    }
  }

  return signals;
}

/** Series values for a domain from historical signals (oldest → newest). */
export function seriesForDomain(
  signals: HistoricalSignal[],
  domain: ForecastDomain
): number[] {
  return signals
    .filter((s) => s.domain === domain)
    .sort((a, b) => (a.observedAt < b.observedAt ? -1 : 1))
    .map((s) => s.value);
}

/** Default thresholds for crossing detection. */
export function defaultThresholds(): Partial<Record<ForecastDomain, number>> {
  return {
    enrollment: 85,
    revenue: 42000,
    cash_flow: 2000,
    expense: 48000,
    payroll: 36000,
    staffing: 32,
    capacity: 90,
    admissions: 10,
    mission: 60,
    risk: 0.65,
    executive_kpi: 65,
  };
}

/** Create a named forecast scenario preset. */
export function createForecastScenario(
  kind: ForecastScenarioKind,
  options: {
    id?: string;
    title?: string;
    magnitude?: number;
    description?: string;
    linkedDecisionScenarioIds?: string[];
  } = {}
): ForecastScenarioDefinition {
  const magnitude = options.magnitude ?? 0.08;
  const id = options.id ?? `scenario-${kind}`;

  switch (kind) {
    case "baseline":
      return {
        id,
        title: options.title ?? "Baseline forecast",
        kind,
        description:
          options.description ??
          "Continue current trajectory without strategic shocks.",
        domainMultipliers: Object.fromEntries(
          FORECAST_DOMAINS.map((d) => [d, 1])
        ) as Record<ForecastDomain, number>,
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds,
      };
    case "optimistic":
      return {
        id,
        title: options.title ?? "Optimistic growth",
        kind,
        description:
          options.description ??
          "Favorable enrollment, revenue, and admissions momentum.",
        domainMultipliers: {
          enrollment: 1 + magnitude,
          revenue: 1 + magnitude * 1.1,
          cash_flow: 1 + magnitude * 1.2,
          expense: 1 + magnitude * 0.4,
          payroll: 1 + magnitude * 0.35,
          staffing: 1 + magnitude * 0.3,
          capacity: 1 + magnitude * 0.25,
          admissions: 1 + magnitude * 1.3,
          mission: 1 + magnitude * 0.2,
          risk: Math.max(0.2, 1 - magnitude),
          executive_kpi: 1 + magnitude * 0.25,
        },
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds,
      };
    case "pessimistic":
      return {
        id,
        title: options.title ?? "Pessimistic contraction",
        kind,
        description:
          options.description ??
          "Enrollment and cash pressure with rising risk.",
        domainMultipliers: {
          enrollment: 1 - magnitude,
          revenue: 1 - magnitude * 1.05,
          cash_flow: 1 - magnitude * 1.4,
          expense: 1 + magnitude * 0.2,
          payroll: 1 + magnitude * 0.1,
          staffing: 1 - magnitude * 0.15,
          capacity: 1 - magnitude * 0.1,
          admissions: 1 - magnitude * 1.2,
          mission: 1 - magnitude * 0.15,
          risk: 1 + magnitude * 1.5,
          executive_kpi: 1 - magnitude * 0.3,
        },
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds,
      };
    case "stress":
      return {
        id,
        title: options.title ?? "Stress test",
        kind,
        description:
          options.description ??
          "Severe enrollment drop with payroll and expense stickiness.",
        domainMultipliers: {
          enrollment: 1 - magnitude * 1.5,
          revenue: 1 - magnitude * 1.6,
          cash_flow: 1 - magnitude * 2,
          expense: 1 + magnitude * 0.35,
          payroll: 1 + magnitude * 0.2,
          staffing: 1 - magnitude * 0.25,
          capacity: 1 - magnitude * 0.2,
          admissions: 1 - magnitude * 1.8,
          mission: 1 - magnitude * 0.25,
          risk: 1 + magnitude * 2,
          executive_kpi: 1 - magnitude * 0.45,
        },
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds,
      };
    case "decision_linked":
      return {
        id,
        title: options.title ?? "Decision-linked forecast",
        kind,
        description:
          options.description ??
          "Forecast biased by Executive Decision simulations.",
        domainMultipliers: Object.fromEntries(
          FORECAST_DOMAINS.map((d) => [d, 1])
        ) as Record<ForecastDomain, number>,
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds ?? [],
      };
    case "custom":
    default:
      return {
        id,
        title: options.title ?? "Custom forecast",
        kind: "custom",
        description: options.description ?? "Custom forecast scenario.",
        domainMultipliers: {},
        linkedDecisionScenarioIds: options.linkedDecisionScenarioIds,
      };
  }
}

/** Default multi-scenario set used when the caller omits scenarios. */
export function defaultForecastScenarios(): ForecastScenarioDefinition[] {
  return [
    createForecastScenario("baseline"),
    createForecastScenario("optimistic", { magnitude: 0.08 }),
    createForecastScenario("pessimistic", { magnitude: 0.1 }),
  ];
}

/** Normalize requested horizons to supported set. */
export function resolveHorizons(
  horizons?: ForecastHorizonDays[]
): ForecastHorizonDays[] {
  if (!horizons || horizons.length === 0) {
    return [...FORECAST_HORIZONS];
  }
  const allowed = new Set<number>(FORECAST_HORIZONS);
  const filtered = horizons.filter((h): h is ForecastHorizonDays =>
    allowed.has(h)
  );
  return filtered.length > 0 ? filtered : [...FORECAST_HORIZONS];
}

/** Normalize requested domains. */
export function resolveDomains(domains?: ForecastDomain[]): ForecastDomain[] {
  if (!domains || domains.length === 0) {
    return [...FORECAST_DOMAINS];
  }
  const allowed = new Set<string>(FORECAST_DOMAINS);
  const filtered = domains.filter((d): d is ForecastDomain => allowed.has(d));
  return filtered.length > 0 ? filtered : [...FORECAST_DOMAINS];
}

/** Bundled model helpers matching Sprint naming (PredictionModels). */
export const predictionModels = {
  defaultForecastBaseline,
  deriveForecastBaseline,
  baselineValueForDomain,
  synthesizeHistoricalSignals,
  seriesForDomain,
  defaultThresholds,
  createForecastScenario,
  defaultForecastScenarios,
  resolveHorizons,
  resolveDomains,
};
