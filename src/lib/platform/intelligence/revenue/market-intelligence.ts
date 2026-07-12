/**
 * Revenue Intelligence — Market suite (Sprint 033).
 */

import type {
  CompetitorRevenue as CompetitorRevenueContract,
  DemandForecast as DemandForecastContract,
  GeographicExpansion as GeographicExpansionContract,
  IndustryBenchmarks as IndustryBenchmarksContract,
  MarketExpansion as MarketExpansionContract,
  OpportunityScoring as OpportunityScoringContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/revenue/models";
import type {
  CompetitorRevenueRecord,
  DemandForecastResult,
  GeographicExpansionRecord,
  IndustryBenchmarkRecord,
  MarketExpansionRecord,
  OpportunityScoreRecord,
  RevenueBaseline,
} from "@/lib/platform/intelligence/revenue/types";

export class MarketExpansion implements MarketExpansionContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): MarketExpansionRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const markets = [
      "Adjacent adult learning",
      "Corporate partnerships",
      "Regional campus expansion",
      "Digital-first cohorts",
    ];
    return markets.map((market, i) => {
      const opportunityScore = clamp(
        58 + input.baseline.financialScore * 0.2 - i * 5 + input.baseline.growthRate * 40
      );
      const expectedRevenue = Math.round(
        input.baseline.annualRevenue * (0.08 - i * 0.012)
      );
      const investment = Math.round(expectedRevenue * (0.4 + i * 0.05));
      return {
        id: createId("mkt"),
        market,
        opportunityScore: Math.round(opportunityScore),
        expectedRevenue,
        investment,
        priority: priorityFromScore(opportunityScore),
        lenses: buildLenses({
          sustainableRevenue: `${market} could add $${expectedRevenue.toLocaleString()} durable revenue.`,
          profitability: `Investment $${investment.toLocaleString()} should clear contribution hurdles.`,
          missionImpact: `Expands mission reach into ${market.toLowerCase()}.`,
          revenueRisk: `New-market execution and brand risk — stage-gate investment.`,
          longTermHealth: `Diversifying markets strengthens long-term health.`,
        }),
        narrative: `${market}: score ${Math.round(opportunityScore)}, +$${expectedRevenue.toLocaleString()}.`,
      };
    });
  }
}

export class CompetitorRevenue implements CompetitorRevenueContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CompetitorRevenueRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const competitors = [
      { competitor: "Regional peer A", share: 0.22, price: 0.95 },
      { competitor: "National platform B", share: 0.18, price: 1.1 },
      { competitor: "Niche specialist C", share: 0.12, price: 0.88 },
    ];
    return competitors.map((c) => ({
      id: createId("comp"),
      competitor: c.competitor,
      estimatedShare: c.share,
      pricePosition: c.price,
      threat: priorityFromScore(100 - c.share * 200),
      lenses: buildLenses({
        sustainableRevenue: `${c.competitor} holds ~${Math.round(c.share * 100)}% share — informs win strategy.`,
        profitability: `Price position ${c.price}x vs us shapes margin room.`,
        missionImpact: `Competitive moves affect mission differentiation narrative.`,
        revenueRisk: `Share pressure from ${c.competitor} is ${priorityFromScore(100 - c.share * 200)}.`,
        longTermHealth: `Competitive intelligence protects long-term market health.`,
      }),
      narrative: `${c.competitor}: ~${Math.round(c.share * 100)}% share, price ${c.price}x.`,
    }));
  }
}

export class DemandForecast implements DemandForecastContract {
  forecast(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): DemandForecastResult {
    const points = [];
    let demandIndex = clamp(60 + input.baseline.growthRate * 80);
    for (let i = 0; i < 4; i++) {
      demandIndex = clamp(demandIndex * (1 + input.baseline.growthRate / 4));
      const d = new Date(input.now);
      d.setMonth(d.getMonth() + (i + 1) * 3);
      points.push({
        period: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        demandIndex: Math.round(demandIndex),
        expectedRevenue: Math.round(
          (input.baseline.annualRevenue / 4) * (demandIndex / 70)
        ),
      });
    }
    const trend: "up" | "stable" | "down" =
      input.baseline.growthRate > 0.08
        ? "up"
        : input.baseline.growthRate < 0.03
          ? "down"
          : "stable";
    const status = statusFromScore(points[points.length - 1]!.demandIndex);
    return {
      points,
      trend,
      status,
      lenses: buildLenses({
        sustainableRevenue: `Demand ${trend} supports forward revenue planning.`,
        profitability: `Demand-aligned capacity protects utilization margins.`,
        missionImpact: `Anticipating demand improves mission service readiness.`,
        revenueRisk: `Downside demand scenarios need contingency pricing/capacity.`,
        longTermHealth: `Demand foresight improves long-term planning health.`,
      }),
      narrative: `Demand forecast ${status} (${trend}).`,
    };
  }
}

export class OpportunityScoring implements OpportunityScoringContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  score(input: {
    baseline: RevenueBaseline;
    marketExpansion: MarketExpansionRecord[];
    now: Date;
  }): OpportunityScoreRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return input.marketExpansion.slice(0, 5).map((m) => ({
      id: createId("opp"),
      opportunity: m.market,
      score: m.opportunityScore,
      expectedRevenue: m.expectedRevenue,
      effort: m.investment > m.expectedRevenue * 0.45 ? "high" : "medium",
      priority: priorityFromScore(m.opportunityScore),
      lenses: buildLenses({
        sustainableRevenue: `${m.market} scored ${m.opportunityScore} with $${m.expectedRevenue.toLocaleString()} potential.`,
        profitability: `Effort band reflects investment vs return discipline.`,
        missionImpact: `Prioritize opportunities with strong mission adjacency.`,
        revenueRisk: `Lower scores warrant smaller staged bets.`,
        longTermHealth: `Scored backlog guides healthy multi-year growth.`,
      }),
      narrative: `${m.market}: score ${m.opportunityScore}, +$${m.expectedRevenue.toLocaleString()}.`,
    }));
  }
}

export class GeographicExpansion implements GeographicExpansionContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): GeographicExpansionRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const regions = ["Metro East", "Metro West", "Suburban corridor", "Online national"];
    return regions.map((region, i) => {
      const readiness = clamp(
        50 + input.baseline.organizationHealthScore * 0.3 - i * 6
      );
      const expectedRevenue = Math.round(
        input.baseline.annualRevenue * (0.06 - i * 0.01)
      );
      return {
        id: createId("geo"),
        region,
        readiness: Math.round(readiness),
        expectedRevenue,
        priority: priorityFromScore(readiness),
        lenses: buildLenses({
          sustainableRevenue: `${region} expansion could add $${expectedRevenue.toLocaleString()}.`,
          profitability: `Readiness ${Math.round(readiness)} gates profitable entry timing.`,
          missionImpact: `Geographic reach expands mission equity of access.`,
          revenueRisk: `Low readiness elevates launch and brand risk.`,
          longTermHealth: `Staged geo expansion supports long-term market health.`,
        }),
        narrative: `${region}: readiness ${Math.round(readiness)}, +$${expectedRevenue.toLocaleString()}.`,
      };
    });
  }
}

export class IndustryBenchmarks implements IndustryBenchmarksContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): IndustryBenchmarkRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const rows = [
      {
        metric: "Gross margin",
        ourValue: input.baseline.grossMargin,
        industryMedian: 0.58,
      },
      {
        metric: "NRR",
        ourValue: input.baseline.nrr,
        industryMedian: 1.05,
      },
      {
        metric: "Win rate",
        ourValue: input.baseline.winRate,
        industryMedian: 0.28,
      },
      {
        metric: "LTV:CAC",
        ourValue: input.baseline.ltv / Math.max(1, input.baseline.cac),
        industryMedian: 3.5,
      },
    ];
    return rows.map((r) => {
      const gap = Number((r.ourValue - r.industryMedian).toFixed(3));
      const percentile = clamp(
        Math.round(50 + (gap / Math.max(0.01, r.industryMedian)) * 25)
      );
      return {
        id: createId("bench"),
        metric: r.metric,
        ourValue: Number(r.ourValue.toFixed(3)),
        industryMedian: r.industryMedian,
        percentile,
        gap,
        priority: priorityFromScore(percentile),
        lenses: buildLenses({
          sustainableRevenue: `${r.metric} vs industry informs sustainable performance targets.`,
          profitability: `Gap ${gap} highlights margin/efficiency opportunity.`,
          missionImpact: `Benchmarks contextualize mission-sustainable economics.`,
          revenueRisk: `Below-median metrics elevate competitive revenue risk.`,
          longTermHealth: `Closing gaps improves long-term competitive health.`,
        }),
        narrative: `${r.metric}: ours ${r.ourValue.toFixed(2)} vs median ${r.industryMedian} (p${percentile}).`,
      };
    });
  }
}
