/**
 * Revenue Intelligence — Financial / margin suite (Sprint 033).
 */

import type {
  BreakEvenAnalysis as BreakEvenAnalysisContract,
  CashGenerationAnalysis as CashGenerationAnalysisContract,
  ContributionMargin as ContributionMarginContract,
  GrossMarginAnalysis as GrossMarginAnalysisContract,
  NetMarginAnalysis as NetMarginAnalysisContract,
  RevenueSensitivity as RevenueSensitivityContract,
  UnitEconomics as UnitEconomicsContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/revenue/models";
import type {
  BreakEvenAnalysisResult,
  CashGenerationAnalysisResult,
  ContributionMarginResult,
  GrossMarginAnalysisResult,
  MarginAnalysisResult,
  NetMarginAnalysisResult,
  RevenueBaseline,
  RevenueSensitivityRecord,
  UnitEconomicsResult,
} from "@/lib/platform/intelligence/revenue/types";

export class GrossMarginAnalysis implements GrossMarginAnalysisContract {
  analyze(input: {
    baseline: RevenueBaseline;
    marginAnalysis: MarginAnalysisResult;
  }): GrossMarginAnalysisResult {
    const grossMarginPct =
      input.marginAnalysis.overallGrossMargin || input.baseline.grossMargin;
    const status = statusFromScore(grossMarginPct * 100);
    return {
      grossMarginPct: Number(grossMarginPct.toFixed(3)),
      status,
      drivers: [
        "Offering mix",
        "Discount leakage",
        "Delivery / COGS discipline",
      ],
      lenses: buildLenses({
        sustainableRevenue: "Gross margin funds sustainable reinvestment.",
        profitability: `Gross margin ${Math.round(grossMarginPct * 100)}% is the primary profitability signal.`,
        missionImpact: "Healthy gross margin protects mission program funding.",
        revenueRisk: "Gross margin compression is a leading risk indicator.",
        longTermHealth: "Defended gross margin underpins long-term health.",
      }),
      narrative: `Gross margin ${status} at ${Math.round(grossMarginPct * 100)}%.`,
    };
  }
}

export class NetMarginAnalysis implements NetMarginAnalysisContract {
  analyze(input: {
    baseline: RevenueBaseline;
    grossMargin: GrossMarginAnalysisResult;
  }): NetMarginAnalysisResult {
    const netMarginPct = clamp01(
      input.baseline.netMargin * 0.7 +
        (input.grossMargin.grossMarginPct - 0.45) * 0.5
    );
    const status = statusFromScore(netMarginPct * 250);
    return {
      netMarginPct: Number(netMarginPct.toFixed(3)),
      status,
      drivers: ["OpEx intensity", "Sales efficiency", "Gross margin quality"],
      lenses: buildLenses({
        sustainableRevenue: "Net margin determines self-funded growth capacity.",
        profitability: `Net margin ${Math.round(netMarginPct * 100)}% after operating load.`,
        missionImpact: "Surplus net margin expands mission investment options.",
        revenueRisk: "Thin net margins reduce shock absorption.",
        longTermHealth: "Positive durable net margin is core long-term health.",
      }),
      narrative: `Net margin ${status} at ${Math.round(netMarginPct * 100)}%.`,
    };
  }
}

export class ContributionMargin implements ContributionMarginContract {
  analyze(input: {
    baseline: RevenueBaseline;
    marginAnalysis: MarginAnalysisResult;
  }): ContributionMarginResult {
    const contributionMarginPct =
      input.marginAnalysis.overallContributionMargin ||
      input.baseline.contributionMargin;
    const status = statusFromScore(contributionMarginPct * 120);
    return {
      contributionMarginPct: Number(contributionMarginPct.toFixed(3)),
      status,
      byOffering: input.marginAnalysis.byOffering.map((o) => ({
        offering: o.offering,
        cmPct: clamp01(o.marginPct - 0.08),
      })),
      lenses: buildLenses({
        sustainableRevenue: "Contribution margin shows what each dollar truly contributes.",
        profitability: `CM ${Math.round(contributionMarginPct * 100)}% after variable costs.`,
        missionImpact: "High-CM offers subsidize mission-access programs sustainably.",
        revenueRisk: "Low-CM growth can look good on revenue but hurt health.",
        longTermHealth: "CM discipline is essential to long-term portfolio health.",
      }),
      narrative: `Contribution margin ${status} at ${Math.round(contributionMarginPct * 100)}%.`,
    };
  }
}

export class BreakEvenAnalysis implements BreakEvenAnalysisContract {
  analyze(input: {
    baseline: RevenueBaseline;
  }): BreakEvenAnalysisResult {
    const fixedCostProxy = Math.round(
      input.baseline.annualRevenue * (1 - input.baseline.contributionMargin) * 0.55
    );
    const breakEvenRevenue = Math.round(
      fixedCostProxy / Math.max(0.05, input.baseline.contributionMargin)
    );
    const currentRevenue = input.baseline.annualRevenue;
    const cushionPct = Number(
      ((currentRevenue - breakEvenRevenue) / Math.max(1, currentRevenue)).toFixed(3)
    );
    const status = statusFromScore(clamp(cushionPct * 200 + 40));
    return {
      breakEvenRevenue,
      currentRevenue,
      cushionPct,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Break-even at $${breakEvenRevenue.toLocaleString()} vs current $${currentRevenue.toLocaleString()}.`,
        profitability: `Cushion ${(cushionPct * 100).toFixed(1)}% above break-even.`,
        missionImpact: "Break-even cushion protects mission continuity in downturns.",
        revenueRisk: "Thin cushion elevates existential revenue risk.",
        longTermHealth: "Adequate cushion is a hallmark of long-term health.",
      }),
      narrative: `Break-even ${status}: cushion ${(cushionPct * 100).toFixed(1)}%.`,
    };
  }
}

export class UnitEconomics implements UnitEconomicsContract {
  analyze(input: {
    baseline: RevenueBaseline;
  }): UnitEconomicsResult {
    const arpu = input.baseline.arpu;
    const ltv = input.baseline.ltv;
    const cac = input.baseline.cac;
    const ltvCacRatio = Number((ltv / Math.max(1, cac)).toFixed(2));
    const paybackMonths = Number(
      (cac / Math.max(1, arpu / 12)).toFixed(1)
    );
    const status = statusFromScore(clamp(ltvCacRatio * 20));
    return {
      arpu,
      ltv,
      cac,
      ltvCacRatio,
      paybackMonths,
      status,
      lenses: buildLenses({
        sustainableRevenue: `ARPU $${arpu.toLocaleString()} and LTV $${ltv.toLocaleString()} define unit durability.`,
        profitability: `LTV:CAC ${ltvCacRatio} with ${paybackMonths}mo payback.`,
        missionImpact: "Unit economics determine scalable mission access models.",
        revenueRisk: "LTV:CAC < 3 elevates acquisition risk.",
        longTermHealth: "Strong unit economics compound long-term health.",
      }),
      narrative: `Unit economics ${status}: LTV:CAC ${ltvCacRatio}, payback ${paybackMonths}mo.`,
    };
  }
}

export class CashGenerationAnalysis
  implements CashGenerationAnalysisContract
{
  analyze(input: {
    baseline: RevenueBaseline;
  }): CashGenerationAnalysisResult {
    const cashConversion = input.baseline.cashConversion;
    const operatingCashProxy = Math.round(
      input.baseline.annualRevenue * input.baseline.netMargin * cashConversion
    );
    const status = statusFromScore(cashConversion * 100);
    return {
      cashConversion: Number(cashConversion.toFixed(3)),
      operatingCashProxy,
      status,
      drivers: ["Billing cadence", "Collections", "Working capital"],
      lenses: buildLenses({
        sustainableRevenue: "Cash conversion turns booked revenue into operable fuel.",
        profitability: `Proxy operating cash ~$${operatingCashProxy.toLocaleString()}.`,
        missionImpact: "Cash availability keeps mission delivery uninterrupted.",
        revenueRisk: "Weak conversion creates liquidity risk even with strong bookings.",
        longTermHealth: "Cash generation quality is central to long-term health.",
      }),
      narrative: `Cash generation ${status}: conversion ${(cashConversion * 100).toFixed(0)}%.`,
    };
  }
}

export class RevenueSensitivity implements RevenueSensitivityContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueSensitivityRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const variables = [
      { variable: "Price ±5%", deltaPct: 0.05, revMult: 0.9, marginMult: 1.1 },
      { variable: "Churn +2pts", deltaPct: 0.02, revMult: -1.4, marginMult: -0.6 },
      { variable: "Win rate ±5pts", deltaPct: 0.05, revMult: 1.2, marginMult: 0.4 },
      { variable: "COGS +5%", deltaPct: 0.05, revMult: 0, marginMult: -1.0 },
    ];
    return variables.map((v) => {
      const revenueImpact = Math.round(
        input.baseline.annualRevenue * v.deltaPct * v.revMult
      );
      const marginImpact = Number((v.deltaPct * v.marginMult).toFixed(3));
      return {
        id: createId("sens"),
        variable: v.variable,
        deltaPct: v.deltaPct,
        revenueImpact,
        marginImpact,
        priority: priorityFromScore(100 - Math.abs(revenueImpact) / 40000),
        lenses: buildLenses({
          sustainableRevenue: `${v.variable} swings revenue by ~$${revenueImpact.toLocaleString()}.`,
          profitability: `Margin impact ~${(marginImpact * 100).toFixed(1)} pts.`,
          missionImpact: "Sensitivity informs buffers for mission continuity.",
          revenueRisk: `Highest-sensitivity variables are priority risk levers.`,
          longTermHealth: "Scenario awareness improves long-term resilience.",
        }),
        narrative: `${v.variable}: revenue $${revenueImpact.toLocaleString()}, margin ${(marginImpact * 100).toFixed(1)}pts.`,
      };
    });
  }
}
