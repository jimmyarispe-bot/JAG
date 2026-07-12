/**
 * Revenue Intelligence — Offering / product-service suite (Sprint 033).
 */

import type {
  ExpansionRecommendations as ExpansionRecommendationsContract,
  LifecycleAnalysis as LifecycleAnalysisContract,
  MarginAnalysis as MarginAnalysisContract,
  OfferingAnalysis as OfferingAnalysisContract,
  ProductProfitability as ProductProfitabilityContract,
  RetirementRecommendations as RetirementRecommendationsContract,
  ServiceProfitability as ServiceProfitabilityContract,
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
  ExpansionRecommendation,
  LifecycleAnalysisResult,
  MarginAnalysisResult,
  OfferingLifecycleStage,
  OfferingRecord,
  ProductProfitabilityRecord,
  RetirementRecommendation,
  RevenueBaseline,
  ServiceProfitabilityRecord,
} from "@/lib/platform/intelligence/revenue/types";

const DEFAULT_OFFERINGS: Array<{
  name: string;
  category: string;
  share: number;
  lifecycle: OfferingLifecycleStage;
}> = [
  { name: "Core enrollment program", category: "product", share: 0.42, lifecycle: "mature" },
  { name: "Premium advisory", category: "service", share: 0.18, lifecycle: "grow" },
  { name: "Digital subscription", category: "product", share: 0.22, lifecycle: "grow" },
  { name: "Legacy workshop series", category: "service", share: 0.1, lifecycle: "harvest" },
  { name: "Pilot micro-credential", category: "product", share: 0.08, lifecycle: "introduce" },
];

export class OfferingAnalysis implements OfferingAnalysisContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): OfferingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return DEFAULT_OFFERINGS.map((o, i) => {
      const revenue = Math.round(input.baseline.annualRevenue * o.share);
      const marginPct = clamp01(
        input.baseline.grossMargin + (i % 2 === 0 ? 0.04 : -0.03)
      );
      const growthRate = Number(
        (input.baseline.growthRate + (o.lifecycle === "grow" ? 0.04 : o.lifecycle === "retire" || o.lifecycle === "harvest" ? -0.03 : 0)).toFixed(3)
      );
      return {
        id: createId("offer"),
        name: o.name,
        category: o.category,
        revenue,
        marginPct: Number(marginPct.toFixed(3)),
        lifecycle: o.lifecycle,
        growthRate,
        priority: priorityFromScore(marginPct * 50 + o.share * 50),
        lenses: buildLenses({
          sustainableRevenue: `${o.name} contributes $${revenue.toLocaleString()} to the portfolio.`,
          profitability: `Margin ${Math.round(marginPct * 100)}% shapes offering profitability.`,
          missionImpact: `${o.name} advances mission through ${o.category} delivery.`,
          revenueRisk: `${o.lifecycle} stage implies ${o.lifecycle === "harvest" ? "elevated" : "managed"} lifecycle risk.`,
          longTermHealth: `Lifecycle-aware investment sustains long-term portfolio health.`,
        }),
        narrative: `${o.name}: $${revenue.toLocaleString()}, ${o.lifecycle}, ${(growthRate * 100).toFixed(1)}% growth.`,
      };
    });
  }
}

export class ProductProfitability implements ProductProfitabilityContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ProductProfitabilityRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return input.offerings
      .filter((o) => o.category === "product")
      .map((o) => {
        const cogs = Math.round(o.revenue * (1 - o.marginPct));
        const contributionMarginPct = clamp01(o.marginPct - 0.08);
        return {
          id: createId("prod-prof"),
          product: o.name,
          revenue: o.revenue,
          cogs,
          grossMarginPct: Number(o.marginPct.toFixed(3)),
          contributionMarginPct: Number(contributionMarginPct.toFixed(3)),
          priority: priorityFromScore(contributionMarginPct * 100),
          lenses: buildLenses({
            sustainableRevenue: `${o.name} product revenue $${o.revenue.toLocaleString()}.`,
            profitability: `Gross ${Math.round(o.marginPct * 100)}% / CM ${Math.round(contributionMarginPct * 100)}%.`,
            missionImpact: `Product economics fund scalable mission delivery.`,
            revenueRisk: `COGS $${cogs.toLocaleString()} is the primary cost risk.`,
            longTermHealth: `Healthy product CM supports long-term portfolio health.`,
          }),
          narrative: `${o.name} product profitability CM ${Math.round(contributionMarginPct * 100)}%.`,
        };
      });
  }
}

export class ServiceProfitability implements ServiceProfitabilityContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ServiceProfitabilityRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return input.offerings
      .filter((o) => o.category === "service")
      .map((o, i) => {
        const deliveryCost = Math.round(o.revenue * (1 - o.marginPct));
        const utilization = clamp(0.62 + i * 0.08 + input.baseline.winRate * 0.1, 0, 1);
        return {
          id: createId("svc-prof"),
          service: o.name,
          revenue: o.revenue,
          deliveryCost,
          marginPct: Number(o.marginPct.toFixed(3)),
          utilization: Number(utilization.toFixed(3)),
          priority: priorityFromScore(o.marginPct * 60 + utilization * 40),
          lenses: buildLenses({
            sustainableRevenue: `${o.name} service revenue $${o.revenue.toLocaleString()}.`,
            profitability: `Service margin ${Math.round(o.marginPct * 100)}% at ${(utilization * 100).toFixed(0)}% utilization.`,
            missionImpact: `Services deepen mission relationships and outcomes.`,
            revenueRisk: `Utilization below target elevates delivery cost risk.`,
            longTermHealth: `Utilization discipline sustains service health over time.`,
          }),
          narrative: `${o.name}: margin ${Math.round(o.marginPct * 100)}%, util ${(utilization * 100).toFixed(0)}%.`,
        };
      });
  }
}

export class MarginAnalysis implements MarginAnalysisContract {
  analyze(input: {
    offerings: OfferingRecord[];
    products: ProductProfitabilityRecord[];
    services: ServiceProfitabilityRecord[];
    baseline: RevenueBaseline;
  }): MarginAnalysisResult {
    const overallGrossMargin =
      input.offerings.length > 0
        ? input.offerings.reduce((s, o) => s + o.marginPct * o.revenue, 0) /
          Math.max(1, input.offerings.reduce((s, o) => s + o.revenue, 0))
        : input.baseline.grossMargin;
    const overallContributionMargin = clamp01(overallGrossMargin - 0.1);
    const status = statusFromScore(overallGrossMargin * 100);
    return {
      overallGrossMargin: Number(overallGrossMargin.toFixed(3)),
      overallContributionMargin: Number(overallContributionMargin.toFixed(3)),
      status,
      byOffering: input.offerings.map((o) => ({
        offering: o.name,
        marginPct: o.marginPct,
      })),
      lenses: buildLenses({
        sustainableRevenue: "Margin quality determines reinvestment capacity.",
        profitability: `Portfolio gross ${Math.round(overallGrossMargin * 100)}% / CM ${Math.round(overallContributionMargin * 100)}%.`,
        missionImpact: "Strong margins fund mission-critical programs sustainably.",
        revenueRisk: "Margin compression is a leading revenue-health risk.",
        longTermHealth: "Defended margins are foundational to long-term health.",
      }),
      narrative: `Margin analysis ${status}: gross ${Math.round(overallGrossMargin * 100)}%.`,
    };
  }
}

export class LifecycleAnalysis implements LifecycleAnalysisContract {
  analyze(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
  }): LifecycleAnalysisResult {
    const count = (stage: OfferingLifecycleStage) =>
      input.offerings.filter((o) => o.lifecycle === stage).length;
    const introduceCount = count("introduce");
    const growCount = count("grow");
    const matureCount = count("mature");
    const harvestCount = count("harvest");
    const retireCount = count("retire");
    const balance = clamp(
      growCount * 20 + introduceCount * 15 + matureCount * 10 - harvestCount * 8 - retireCount * 12 + 40
    );
    const status = statusFromScore(balance);
    return {
      offerings: input.offerings,
      introduceCount,
      growCount,
      matureCount,
      harvestCount,
      retireCount,
      status,
      lenses: buildLenses({
        sustainableRevenue: "Lifecycle balance sustains pipeline of future revenue.",
        profitability: "Mature/grow mix should carry portfolio margins.",
        missionImpact: "Introduce/grow stages renew mission-relevant offerings.",
        revenueRisk: "Over-harvesting without introduce/grow creates cliff risk.",
        longTermHealth: "Healthy lifecycle mix underpins long-term portfolio health.",
      }),
      narrative: `Lifecycle ${status}: ${growCount} grow / ${matureCount} mature / ${harvestCount} harvest.`,
    };
  }
}

export class ExpansionRecommendations
  implements ExpansionRecommendationsContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): ExpansionRecommendation[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const grow = input.offerings.filter(
      (o) => o.lifecycle === "grow" || o.lifecycle === "introduce"
    );
    const seeds =
      grow.length > 0
        ? grow
        : input.offerings.slice(0, 2);

    return seeds.slice(0, 4).map((o, i) => {
      const expectedRevenue = Math.round(o.revenue * (0.15 + i * 0.05));
      const investment = Math.round(expectedRevenue * 0.35);
      return {
        id: createId("expand"),
        opportunity: `Expand ${o.name}`,
        expectedRevenue,
        investment,
        priority: priorityFromScore(100 - investment / 30000),
        lenses: buildLenses({
          sustainableRevenue: `Expansion of ${o.name} targets +$${expectedRevenue.toLocaleString()}.`,
          profitability: `Investment $${investment.toLocaleString()} gated to payback within 18 months.`,
          missionImpact: `Scales mission reach through proven offering.`,
          revenueRisk: `Execution and capacity risk moderated by existing product-market fit.`,
          longTermHealth: `Expansion compounds long-term portfolio health.`,
        }),
        narrative: `Expand ${o.name}: +$${expectedRevenue.toLocaleString()} for $${investment.toLocaleString()}.`,
      };
    });
  }
}

export class RetirementRecommendations
  implements RetirementRecommendationsContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    offerings: OfferingRecord[];
    lifecycle: LifecycleAnalysisResult;
    now: Date;
  }): RetirementRecommendation[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const candidates = input.offerings.filter(
      (o) =>
        o.lifecycle === "harvest" ||
        o.lifecycle === "retire" ||
        (o.growthRate < 0 && o.marginPct < 0.4)
    );
    return candidates.map((o) => ({
      id: createId("retire"),
      offering: o.name,
      currentRevenue: o.revenue,
      marginPct: o.marginPct,
      rationale: `${o.name} is ${o.lifecycle} with ${(o.growthRate * 100).toFixed(1)}% growth; reallocate to higher-ROI offers.`,
      priority: priorityFromScore(o.marginPct * 100),
      lenses: buildLenses({
        sustainableRevenue: `Retiring ${o.name} frees focus for durable growth offers.`,
        profitability: `Low/declining margin ${Math.round(o.marginPct * 100)}% dilutes portfolio profitability.`,
        missionImpact: `Reallocation should preserve mission-critical access paths.`,
        revenueRisk: `Sunset risk managed via migration and communication plan.`,
        longTermHealth: `Pruning weak offers improves long-term portfolio health.`,
      }),
      narrative: `Consider retiring ${o.name} ($${o.revenue.toLocaleString()}, ${o.lifecycle}).`,
    }));
  }
}
