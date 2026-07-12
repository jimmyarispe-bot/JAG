/**
 * Revenue Intelligence — Strategy suite (Sprint 033).
 */

import type {
  RecurringRevenueAnalysis as RecurringRevenueAnalysisContract,
  RevenueDiversification as RevenueDiversificationContract,
  RevenueForecasting as RevenueForecastingContract,
  RevenueGrowthPlanner as RevenueGrowthPlannerContract,
  RevenueMixAnalysis as RevenueMixAnalysisContract,
  RevenueOptimization as RevenueOptimizationContract,
  RevenueRiskAnalysis as RevenueRiskAnalysisContract,
  RevenueScenarioPlanning as RevenueScenarioPlanningContract,
  RevenueStrategyEngine as RevenueStrategyEngineContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/revenue/models";
import type {
  DiversificationAnalysisResult,
  RecurringRevenueAnalysisResult,
  RevenueBaseline,
  RevenueForecastPoint,
  RevenueGrowthPlan,
  RevenueMixRecord,
  RevenueOptimizationRecord,
  RevenueRiskRecord,
  RevenueScenarioPlan,
} from "@/lib/platform/intelligence/revenue/types";

export class RevenueMixAnalysis implements RevenueMixAnalysisContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueMixRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const recurringShare =
      input.baseline.recurringRevenue /
      Math.max(1, input.baseline.annualRevenue);
    const streams = [
      {
        stream: "Recurring tuition / subscriptions",
        sharePct: Math.round(recurringShare * 100),
        growthRate: input.baseline.growthRate + 0.02,
        marginPct: input.baseline.grossMargin + 0.05,
      },
      {
        stream: "Program / one-time fees",
        sharePct: Math.round((1 - recurringShare) * 55),
        growthRate: input.baseline.growthRate - 0.01,
        marginPct: input.baseline.grossMargin - 0.04,
      },
      {
        stream: "Ancillary services",
        sharePct: Math.max(
          5,
          100 -
            Math.round(recurringShare * 100) -
            Math.round((1 - recurringShare) * 55)
        ),
        growthRate: input.baseline.growthRate + 0.05,
        marginPct: input.baseline.contributionMargin,
      },
    ];

    return streams.map((s) => ({
      id: createId("rev-mix"),
      stream: s.stream,
      sharePct: s.sharePct,
      growthRate: Number(s.growthRate.toFixed(3)),
      marginPct: Number(clamp01(s.marginPct).toFixed(3)),
      priority: priorityFromScore(s.sharePct * 0.6 + s.marginPct * 100 * 0.4),
      lenses: buildLenses({
        sustainableRevenue: `${s.stream} at ${s.sharePct}% of mix supports durable top-line composition.`,
        profitability: `Margin ${Math.round(s.marginPct * 100)}% contributes to portfolio profitability.`,
        missionImpact: `${s.stream} funds core mission delivery capacity.`,
        revenueRisk: `Concentration in ${s.stream} is ${priorityFromScore(100 - s.sharePct)}.`,
        longTermHealth: `Balanced mix growth at ${(s.growthRate * 100).toFixed(1)}% protects long-term health.`,
      }),
      narrative: `${s.stream}: ${s.sharePct}% share, ${(s.growthRate * 100).toFixed(1)}% growth.`,
    }));
  }
}

export class RevenueDiversification
  implements RevenueDiversificationContract
{
  analyze(input: {
    mix: RevenueMixRecord[];
    baseline: RevenueBaseline;
  }): DiversificationAnalysisResult {
    const maxShare = Math.max(...input.mix.map((m) => m.sharePct), 1);
    const concentrationRisk = clamp01(maxShare / 100);
    const index = clamp01(
      input.baseline.diversificationIndex * 0.6 +
        (1 - concentrationRisk) * 0.4
    );
    const status = statusFromScore(index * 100);
    return {
      index: Number(index.toFixed(3)),
      status,
      streams: input.mix,
      concentrationRisk: Number(concentrationRisk.toFixed(3)),
      recommendations: [
        concentrationRisk > 0.55
          ? "Grow secondary streams to reduce concentration risk"
          : "Maintain diversified stream investment cadence",
        "Protect recurring share while expanding adjacent services",
      ],
      lenses: buildLenses({
        sustainableRevenue: `Diversification index ${Math.round(index * 100)} supports sustainable multi-stream revenue.`,
        profitability: `Mix margins remain anchored near ${Math.round(input.baseline.grossMargin * 100)}% gross.`,
        missionImpact: `Diversified streams reduce single-point dependence for mission funding.`,
        revenueRisk: `Concentration risk ${(concentrationRisk * 100).toFixed(0)}% — ${priorityFromRisk(concentrationRisk)}.`,
        longTermHealth: `Broader mix improves long-term resilience against demand shocks.`,
      }),
      narrative: `Diversification ${status} (index ${Math.round(index * 100)}).`,
    };
  }
}

export class RecurringRevenueAnalysis
  implements RecurringRevenueAnalysisContract
{
  analyze(input: {
    baseline: RevenueBaseline;
  }): RecurringRevenueAnalysisResult {
    const arr = input.baseline.recurringRevenue;
    const mrr = Math.round(arr / 12);
    const status = statusFromScore(
      clamp(input.baseline.nrr * 70 + (1 - input.baseline.churnRate) * 30)
    );
    return {
      arr,
      mrr,
      nrr: Number(input.baseline.nrr.toFixed(3)),
      grr: Number(input.baseline.grr.toFixed(3)),
      churnRate: Number(input.baseline.churnRate.toFixed(3)),
      status,
      lenses: buildLenses({
        sustainableRevenue: `ARR $${arr.toLocaleString()} anchors sustainable recurring revenue.`,
        profitability: `Recurring share improves planning certainty for contribution margins.`,
        missionImpact: `Predictable recurring revenue stabilizes mission program funding.`,
        revenueRisk: `Churn ${(input.baseline.churnRate * 100).toFixed(1)}% is the primary recurring risk.`,
        longTermHealth: `NRR ${input.baseline.nrr.toFixed(2)} and GRR ${input.baseline.grr.toFixed(2)} signal long-term health.`,
      }),
      narrative: `Recurring ${status}: ARR $${arr.toLocaleString()}, NRR ${input.baseline.nrr.toFixed(2)}.`,
    };
  }
}

export class RevenueRiskAnalysis implements RevenueRiskAnalysisContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    now: Date;
  }): RevenueRiskRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const items = [
      {
        title: "Churn / retention risk",
        score: input.baseline.churnRate,
        drivers: ["Customer retention pressure", "Price sensitivity"],
        mitigations: ["Stay programs", "Value packaging", "Success motions"],
      },
      {
        title: "Concentration risk",
        score: input.diversification.concentrationRisk,
        drivers: ["Top stream dominance", "Limited adjacent offers"],
        mitigations: ["Stream expansion", "Partner channels"],
      },
      {
        title: "Margin compression risk",
        score: clamp01(1 - input.baseline.grossMargin),
        drivers: ["Cost inflation", "Discount leakage"],
        mitigations: ["Pricing guardrails", "COGS discipline"],
      },
      {
        title: "Cash conversion risk",
        score: clamp01(1 - input.baseline.cashConversion),
        drivers: ["Collections lag", "Working capital pressure"],
        mitigations: ["Billing cadence", "AR focus"],
      },
    ];

    return items.map((item) => ({
      id: createId("rev-risk"),
      title: item.title,
      score: Number(item.score.toFixed(3)),
      band: priorityFromRisk(item.score),
      drivers: item.drivers,
      mitigations: item.mitigations,
      lenses: buildLenses({
        sustainableRevenue: `${item.title} threatens durable revenue if left unaddressed.`,
        profitability: `Mitigations protect margin quality and contribution mix.`,
        missionImpact: `Containing ${item.title.toLowerCase()} preserves mission funding reliability.`,
        revenueRisk: `${item.title} scored ${(item.score * 100).toFixed(0)}% (${priorityFromRisk(item.score)}).`,
        longTermHealth: `Early mitigation improves long-term financial resilience.`,
      }),
      narrative: `${item.title}: ${priorityFromRisk(item.score)} (${(item.score * 100).toFixed(0)}%).`,
    }));
  }
}

export class RevenueOptimization implements RevenueOptimizationContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  optimize(input: {
    baseline: RevenueBaseline;
    risks: RevenueRiskRecord[];
    mix: RevenueMixRecord[];
    now: Date;
  }): RevenueOptimizationRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const levers = [
      {
        lever: "Improve NRR via expansion packaging",
        expectedLift: Math.round(input.baseline.annualRevenue * 0.04),
        effort: "medium" as const,
      },
      {
        lever: "Tighten discount governance",
        expectedLift: Math.round(input.baseline.annualRevenue * 0.025),
        effort: "low" as const,
      },
      {
        lever: "Grow highest-margin stream share",
        expectedLift: Math.round(
          input.baseline.annualRevenue *
            0.03 *
            (input.mix[0]?.marginPct ?? 0.5)
        ),
        effort: "high" as const,
      },
      {
        lever: `Mitigate ${input.risks[0]?.title ?? "top revenue risk"}`,
        expectedLift: Math.round(input.baseline.annualRevenue * 0.02),
        effort: "medium" as const,
      },
    ];

    return levers.map((l) => ({
      id: createId("rev-opt"),
      lever: l.lever,
      expectedLift: l.expectedLift,
      effort: l.effort,
      priority: priorityFromScore(100 - l.expectedLift / 50000),
      lenses: buildLenses({
        sustainableRevenue: `${l.lever} targets +$${l.expectedLift.toLocaleString()} sustainable lift.`,
        profitability: `Optimization prioritizes margin-accretive revenue actions.`,
        missionImpact: `Freed capacity and cash support mission-critical programs.`,
        revenueRisk: `Reduces exposure tied to ${input.risks[0]?.title ?? "portfolio risk"}.`,
        longTermHealth: `Compounding lift strengthens long-term revenue health.`,
      }),
      narrative: `${l.lever}: +$${l.expectedLift.toLocaleString()} expected.`,
    }));
  }
}

export class RevenueGrowthPlanner implements RevenueGrowthPlannerContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  plan(input: {
    baseline: RevenueBaseline;
    optimizations: RevenueOptimizationRecord[];
    now: Date;
  }): RevenueGrowthPlan[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const year = input.now.getFullYear();
    return [
      {
        id: createId("rev-growth"),
        horizon: `${year} H2`,
        targetGrowthPct: Number((input.baseline.growthRate + 0.03).toFixed(3)),
        initiatives: input.optimizations.slice(0, 3).map((o) => o.lever),
        investmentRequired: Math.round(input.baseline.annualRevenue * 0.04),
        priority: priorityFromScore(input.baseline.growthRate * 400),
        lenses: buildLenses({
          sustainableRevenue: `Near-term plan aims for ${((input.baseline.growthRate + 0.03) * 100).toFixed(1)}% sustainable growth.`,
          profitability: `Investment gated to preserve contribution and net margins.`,
          missionImpact: `Growth initiatives expand mission reach without diluting quality.`,
          revenueRisk: `Phased investment limits downside if demand softens.`,
          longTermHealth: `Builds runway for multi-year compounding health.`,
        }),
        narrative: `H2 growth plan targeting ${((input.baseline.growthRate + 0.03) * 100).toFixed(1)}%.`,
      },
      {
        id: createId("rev-growth"),
        horizon: `${year + 1}`,
        targetGrowthPct: Number((input.baseline.growthRate + 0.06).toFixed(3)),
        initiatives: [
          "Adjacent market expansion",
          "Recurring plan upgrades",
          "Partner channel scale",
        ],
        investmentRequired: Math.round(input.baseline.annualRevenue * 0.07),
        priority: "medium",
        lenses: buildLenses({
          sustainableRevenue: `Annual plan compounds recurring and expansion revenue.`,
          profitability: `Scale should improve unit economics as CAC payback shortens.`,
          missionImpact: `Broader access aligns growth with mission outcomes.`,
          revenueRisk: `Diversified initiatives reduce single-bet risk.`,
          longTermHealth: `Positions the portfolio for durable multi-year health.`,
        }),
        narrative: `Next-year growth plan at ${((input.baseline.growthRate + 0.06) * 100).toFixed(1)}%.`,
      },
    ];
  }
}

export class RevenueForecasting implements RevenueForecastingContract {
  forecast(input: {
    baseline: RevenueBaseline;
    growthPlans: RevenueGrowthPlan[];
    now: Date;
  }): RevenueForecastPoint[] {
    const points: RevenueForecastPoint[] = [];
    let revenue = input.baseline.annualRevenue / 4;
    let recurring = input.baseline.recurringRevenue / 4;
    const avgTarget =
      input.growthPlans.reduce((s, g) => s + g.targetGrowthPct, 0) /
        Math.max(1, input.growthPlans.length) || input.baseline.growthRate;
    const quarterlyGrowth = avgTarget / 4;

    for (let i = 0; i < 4; i++) {
      revenue = Math.round(revenue * (1 + quarterlyGrowth));
      recurring = Math.round(recurring * (1 + quarterlyGrowth + 0.005));
      const oneTime = Math.max(0, revenue - recurring);
      const d = new Date(input.now);
      d.setMonth(d.getMonth() + (i + 1) * 3);
      points.push({
        period: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        revenue,
        recurring,
        oneTime,
        growthPct: Number(quarterlyGrowth.toFixed(4)),
      });
    }
    return points;
  }
}

export class RevenueScenarioPlanning
  implements RevenueScenarioPlanningContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  scenarios(input: {
    baseline: RevenueBaseline;
    forecast: RevenueForecastPoint[];
    now: Date;
  }): RevenueScenarioPlan[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const baseRevenue =
      input.forecast[input.forecast.length - 1]?.revenue ??
      input.baseline.annualRevenue / 4;

    return [
      {
        id: createId("rev-scen"),
        name: "Base case",
        description: "Current growth and retention trajectory",
        revenueDelta: 0,
        marginDelta: 0,
        risk: "monitor",
        outcomes: ["Steady NRR", "Margin stability"],
        lenses: buildLenses({
          sustainableRevenue: "Base case sustains current recurring trajectory.",
          profitability: "Margins held near baseline contribution.",
          missionImpact: "Mission funding remains predictable.",
          revenueRisk: "Residual risk limited to normal churn variance.",
          longTermHealth: "Maintains long-term health without step-change investment.",
        }),
        narrative: "Base case: continue current trajectory.",
      },
      {
        id: createId("rev-scen"),
        name: "Upside expansion",
        description: "Successful expansion packaging + pricing discipline",
        revenueDelta: Math.round(baseRevenue * 0.12),
        marginDelta: 0.02,
        risk: "medium",
        outcomes: ["NRR lift", "Improved ARPU"],
        lenses: buildLenses({
          sustainableRevenue: `Upside adds ~$${Math.round(baseRevenue * 0.12).toLocaleString()} sustainable revenue.`,
          profitability: "Margin expands ~200 bps via mix and pricing.",
          missionImpact: "Expanded capacity funds additional mission programs.",
          revenueRisk: "Execution risk on packaging and sales capacity.",
          longTermHealth: "Strengthens multi-year compounding health.",
        }),
        narrative: "Upside: expansion + pricing discipline.",
      },
      {
        id: createId("rev-scen"),
        name: "Downside churn shock",
        description: "Elevated churn and discount pressure",
        revenueDelta: -Math.round(baseRevenue * 0.1),
        marginDelta: -0.03,
        risk: "high",
        outcomes: ["NRR compression", "Cash tightness"],
        lenses: buildLenses({
          sustainableRevenue: "Churn shock erodes recurring durability.",
          profitability: "Discounting and lost volume compress margins.",
          missionImpact: "Mission programs face funding pressure.",
          revenueRisk: "High — retention and price integrity under stress.",
          longTermHealth: "Requires rapid remediation to protect long-term health.",
        }),
        narrative: "Downside: churn and discount pressure.",
      },
    ];
  }
}

/**
 * Strategy orchestrator — composes mix through scenarios.
 * Named RevenueStrategyEngine to avoid colliding with core RevenueEngine.
 */
export class RevenueStrategyEngine implements RevenueStrategyEngineContract {
  private readonly mixAnalysis: RevenueMixAnalysis;
  private readonly diversification: RevenueDiversification;
  private readonly recurring: RecurringRevenueAnalysis;
  private readonly riskAnalysis: RevenueRiskAnalysis;
  private readonly optimization: RevenueOptimization;
  private readonly growthPlanner: RevenueGrowthPlanner;
  private readonly forecasting: RevenueForecasting;
  private readonly scenarios: RevenueScenarioPlanning;

  constructor(deps: { createId?: (prefix: string) => string } = {}) {
    this.mixAnalysis = new RevenueMixAnalysis(deps);
    this.diversification = new RevenueDiversification();
    this.recurring = new RecurringRevenueAnalysis();
    this.riskAnalysis = new RevenueRiskAnalysis(deps);
    this.optimization = new RevenueOptimization(deps);
    this.growthPlanner = new RevenueGrowthPlanner(deps);
    this.forecasting = new RevenueForecasting();
    this.scenarios = new RevenueScenarioPlanning(deps);
  }

  run(input: { baseline: RevenueBaseline; now: Date }) {
    const mix = this.mixAnalysis.analyze(input);
    const diversification = this.diversification.analyze({
      mix,
      baseline: input.baseline,
    });
    const recurring = this.recurring.analyze({ baseline: input.baseline });
    const risks = this.riskAnalysis.analyze({
      baseline: input.baseline,
      diversification,
      recurring,
      now: input.now,
    });
    const optimizations = this.optimization.optimize({
      baseline: input.baseline,
      risks,
      mix,
      now: input.now,
    });
    const growthPlans = this.growthPlanner.plan({
      baseline: input.baseline,
      optimizations,
      now: input.now,
    });
    const forecast = this.forecasting.forecast({
      baseline: input.baseline,
      growthPlans,
      now: input.now,
    });
    const scenarios = this.scenarios.scenarios({
      baseline: input.baseline,
      forecast,
      now: input.now,
    });
    return {
      mix,
      diversification,
      recurring,
      risks,
      optimizations,
      growthPlans,
      forecast,
      scenarios,
    };
  }
}

/** Alias for strategy consumers that expect StrategyRevenueEngine naming. */
export { RevenueStrategyEngine as StrategyRevenueEngine };
