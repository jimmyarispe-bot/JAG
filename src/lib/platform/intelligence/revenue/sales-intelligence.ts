/**
 * Revenue Intelligence — Sales suite (Sprint 033).
 */

import type {
  ConversionAnalysis as ConversionAnalysisContract,
  PipelineForecast as PipelineForecastContract,
  SalesCapacity as SalesCapacityContract,
  SalesPerformance as SalesPerformanceContract,
  TerritoryOptimization as TerritoryOptimizationContract,
  WinRateAnalysis as WinRateAnalysisContract,
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
  ConversionAnalysisResult,
  PipelineForecastResult,
  RevenueBaseline,
  SalesCapacityResult,
  SalesPerformanceRecord,
  SalesPipelineStage,
  TerritoryOptimizationRecord,
  WinRateAnalysisResult,
} from "@/lib/platform/intelligence/revenue/types";

const STAGES: SalesPipelineStage[] = [
  "prospect",
  "qualify",
  "propose",
  "negotiate",
  "closed_won",
  "closed_lost",
];

export class PipelineForecast implements PipelineForecastContract {
  forecast(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): PipelineForecastResult {
    const target = input.baseline.annualRevenue / 4;
    const totalPipeline = Math.round(
      target * input.baseline.pipelineCoverage
    );
    const weightedPipeline = Math.round(
      totalPipeline * input.baseline.winRate * 1.1
    );
    const expectedClosed = Math.round(totalPipeline * input.baseline.winRate);
    const coverage = Number(input.baseline.pipelineCoverage.toFixed(2));
    const status = statusFromScore(clamp(coverage * 30 + input.baseline.winRate * 40));

    const weights = [0.28, 0.22, 0.18, 0.14, 0.1, 0.08];
    const stages = STAGES.map((stage, i) => ({
      stage,
      amount: Math.round(totalPipeline * (weights[i] ?? 0.1)),
      count: Math.max(
        1,
        Math.round(
          (totalPipeline * (weights[i] ?? 0.1)) /
            Math.max(1, input.baseline.averageDealSize)
        )
      ),
    }));

    return {
      totalPipeline,
      weightedPipeline,
      coverage,
      expectedClosed,
      stages,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Pipeline $${totalPipeline.toLocaleString()} covers ${coverage}x near-term revenue.`,
        profitability: `Weighted $${weightedPipeline.toLocaleString()} informs attainable contribution.`,
        missionImpact: `Healthy pipeline sustains mission enrollment/partner flow.`,
        revenueRisk: `Coverage below 2x elevates quarter revenue risk.`,
        longTermHealth: `Consistent coverage rituals protect long-term growth health.`,
      }),
      narrative: `Pipeline ${status}: $${totalPipeline.toLocaleString()} (${coverage}x), win-implied $${expectedClosed.toLocaleString()}.`,
    };
  }
}

export class WinRateAnalysis implements WinRateAnalysisContract {
  analyze(input: {
    baseline: RevenueBaseline;
  }): WinRateAnalysisResult {
    const overallWinRate = input.baseline.winRate;
    const byStage = STAGES.filter(
      (s) => s !== "closed_won" && s !== "closed_lost"
    ).map((stage, i) => ({
      stage,
      winRate: Number(
        clamp01(overallWinRate + 0.35 - i * 0.08).toFixed(3)
      ),
    }));
    const trend: "up" | "stable" | "down" =
      input.baseline.growthRate > 0.1
        ? "up"
        : input.baseline.growthRate < 0.05
          ? "down"
          : "stable";
    const status = statusFromScore(overallWinRate * 200);
    return {
      overallWinRate: Number(overallWinRate.toFixed(3)),
      byStage,
      trend,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Win rate ${(overallWinRate * 100).toFixed(0)}% converts pipeline into durable revenue.`,
        profitability: `Higher win rates reduce wasted pursuit cost.`,
        missionImpact: `Conversion quality affects who receives mission services.`,
        revenueRisk: `Downtrend in win rate is an early revenue risk signal.`,
        longTermHealth: `Stable/improving win rate supports long-term sales health.`,
      }),
      narrative: `Win rate ${status}: ${(overallWinRate * 100).toFixed(0)}% (${trend}).`,
    };
  }
}

export class SalesPerformance implements SalesPerformanceContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): SalesPerformanceRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const teams = ["Team North", "Team Central", "Team South", "Partners"];
    return teams.map((repOrTeam, i) => {
      const quotaAttainment = Number(
        clamp(0.75 + input.baseline.winRate + i * 0.04 - 0.08, 0.4, 1.3).toFixed(3)
      );
      const closedRevenue = Math.round(
        (input.baseline.annualRevenue / 4 / teams.length) * quotaAttainment
      );
      const winRate = Number(
        clamp01(input.baseline.winRate + (i - 1) * 0.03).toFixed(3)
      );
      return {
        id: createId("sales-perf"),
        repOrTeam,
        quotaAttainment,
        closedRevenue,
        winRate,
        priority: priorityFromScore(quotaAttainment * 80),
        lenses: buildLenses({
          sustainableRevenue: `${repOrTeam} closed $${closedRevenue.toLocaleString()} toward sustainable targets.`,
          profitability: `Attainment ${Math.round(quotaAttainment * 100)}% affects sales efficiency.`,
          missionImpact: `Territory performance shapes local mission access.`,
          revenueRisk: `Under-attainment creates coverage risk.`,
          longTermHealth: `Coaching underperformers protects long-term capacity health.`,
        }),
        narrative: `${repOrTeam}: ${Math.round(quotaAttainment * 100)}% quota, $${closedRevenue.toLocaleString()} closed.`,
      };
    });
  }
}

export class SalesCapacity implements SalesCapacityContract {
  analyze(input: {
    baseline: RevenueBaseline;
  }): SalesCapacityResult {
    const productivityPerRep = Math.round(
      input.baseline.averageDealSize * 12 * input.baseline.winRate * 8
    );
    const requiredFte = Math.max(
      1,
      Math.ceil(input.baseline.annualRevenue / Math.max(1, productivityPerRep))
    );
    const capacityFte = Math.max(1, requiredFte - (input.baseline.pipelineCoverage < 2 ? 1 : 0));
    const gapFte = Math.max(0, requiredFte - capacityFte);
    const status = statusFromScore(100 - gapFte * 25);
    return {
      capacityFte,
      requiredFte,
      gapFte,
      productivityPerRep,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Capacity ${capacityFte} FTE vs ${requiredFte} required for target revenue.`,
        profitability: `Productivity ~$${productivityPerRep.toLocaleString()}/rep anchors sales ROI.`,
        missionImpact: `Adequate capacity ensures mission demand is served.`,
        revenueRisk: `Gap ${gapFte} FTE elevates missed-quota risk.`,
        longTermHealth: `Right-sized capacity sustains long-term growth health.`,
      }),
      narrative: `Sales capacity ${status}: gap ${gapFte} FTE.`,
    };
  }
}

export class TerritoryOptimization
  implements TerritoryOptimizationContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  optimize(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): TerritoryOptimizationRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const territories = ["North", "Central", "South", "Remote / digital"];
    return territories.map((territory, i) => {
      const currentCoverage = clamp(55 + i * 8 + input.baseline.winRate * 20);
      const recommendedCoverage = clamp(currentCoverage + (70 - currentCoverage) * 0.4);
      const revenuePotential = Math.round(
        (input.baseline.annualRevenue / territories.length) *
          (recommendedCoverage / Math.max(1, currentCoverage))
      );
      return {
        id: createId("terr"),
        territory,
        currentCoverage: Math.round(currentCoverage),
        recommendedCoverage: Math.round(recommendedCoverage),
        revenuePotential,
        priority: priorityFromScore(currentCoverage),
        lenses: buildLenses({
          sustainableRevenue: `${territory} potential $${revenuePotential.toLocaleString()} with improved coverage.`,
          profitability: `Coverage efficiency reduces wasted pursuit cost.`,
          missionImpact: `Balanced territories expand equitable mission access.`,
          revenueRisk: `Under-covered territories leave revenue on the table.`,
          longTermHealth: `Territory balance supports long-term market health.`,
        }),
        narrative: `${territory}: coverage ${Math.round(currentCoverage)} → ${Math.round(recommendedCoverage)}.`,
      };
    });
  }
}

export class ConversionAnalysis implements ConversionAnalysisContract {
  analyze(input: {
    baseline: RevenueBaseline;
    pipeline: PipelineForecastResult;
  }): ConversionAnalysisResult {
    const funnel = input.pipeline.stages
      .filter((s) => s.stage !== "closed_lost")
      .map((s, i, arr) => ({
        stage: s.stage,
        conversionPct: Number(
          clamp01(
            i === 0
              ? 1
              : (arr[i]!.count / Math.max(1, arr[i - 1]!.count)) *
                  (0.85 + input.baseline.winRate)
          ).toFixed(3)
        ),
      }));
    const overallConversion = input.baseline.winRate;
    const leakPoints = funnel
      .filter((f) => f.conversionPct < 0.45 && f.stage !== "closed_won")
      .map((f) => `${f.stage} conversion ${(f.conversionPct * 100).toFixed(0)}%`);
    if (leakPoints.length === 0) {
      leakPoints.push("negotiate stage needs tighter proposal quality");
    }
    const status = statusFromScore(overallConversion * 200);
    return {
      overallConversion: Number(overallConversion.toFixed(3)),
      funnel,
      leakPoints,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Funnel conversion ${(overallConversion * 100).toFixed(0)}% turns demand into revenue.`,
        profitability: `Fixing leak points reduces cost per win.`,
        missionImpact: `Smoother conversion improves time-to-mission-impact.`,
        revenueRisk: `Leak points are controllable revenue risks.`,
        longTermHealth: `Funnel hygiene sustains long-term sales health.`,
      }),
      narrative: `Conversion ${status}: ${(overallConversion * 100).toFixed(0)}%; leaks at ${leakPoints[0]}.`,
    };
  }
}
