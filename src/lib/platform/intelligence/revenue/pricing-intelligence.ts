/**
 * Revenue Intelligence — Pricing suite (Sprint 033).
 */

import type {
  CompetitivePricing as CompetitivePricingContract,
  ContractPricing as ContractPricingContract,
  DiscountOptimization as DiscountOptimizationContract,
  DynamicPricing as DynamicPricingContract,
  PriceElasticity as PriceElasticityContract,
  PricingEngine as PricingEngineContract,
  ScholarshipPricing as ScholarshipPricingContract,
  SubscriptionPricing as SubscriptionPricingContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  buildLenses,
  clamp,
  clamp01,
  defaultCreateId,
  priorityFromScore,
} from "@/lib/platform/intelligence/revenue/models";
import type {
  CompetitivePricingRecord,
  ContractPricingRecord,
  DiscountOptimizationRecord,
  DynamicPricingRecord,
  OfferingRecord,
  PriceElasticityRecord,
  PricingRecommendation,
  RevenueBaseline,
  ScholarshipPricingRecord,
  SubscriptionPricingRecord,
} from "@/lib/platform/intelligence/revenue/types";

export class PricingEngine implements PricingEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): PricingRecommendation[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const offerings =
      input.offerings.length > 0
        ? input.offerings
        : [
            {
              id: "offering-default",
              name: "Core program",
              category: "core",
              revenue: input.baseline.annualRevenue * 0.5,
              marginPct: input.baseline.grossMargin,
              lifecycle: "grow" as const,
              growthRate: input.baseline.growthRate,
              priority: "medium" as const,
              lenses: buildLenses({
                sustainableRevenue: "Core program",
                profitability: "Baseline",
                missionImpact: "Core mission",
                revenueRisk: "Moderate",
                longTermHealth: "Anchor",
              }),
              narrative: "Default offering",
            },
          ];

    return offerings.slice(0, 5).map((o, i) => {
      const currentPrice = Math.round(
        input.baseline.averageDealSize * (1 - i * 0.08)
      );
      const competitivenessGap =
        (100 - input.baseline.priceCompetitiveness) / 100;
      const recommendedPrice = Math.round(
        currentPrice * (1 + 0.03 + competitivenessGap * 0.04)
      );
      const expectedLift = Math.round(
        (recommendedPrice - currentPrice) *
          (input.baseline.customerCount / Math.max(1, offerings.length)) *
          0.35
      );
      return {
        id: createId("price"),
        offering: o.name,
        currentPrice,
        recommendedPrice,
        model: i % 2 === 0 ? "subscription" : "tiered",
        elasticity: Number((-1.1 - i * 0.15).toFixed(2)),
        expectedLift,
        priority: priorityFromScore(100 - expectedLift / 20000),
        lenses: buildLenses({
          sustainableRevenue: `Price move on ${o.name} targets +$${expectedLift.toLocaleString()} durable revenue.`,
          profitability: `Recommended price protects ${Math.round(o.marginPct * 100)}% margin quality.`,
          missionImpact: `Pricing remains accessible enough to protect mission reach.`,
          revenueRisk: `Elasticity-aware change limits volume risk.`,
          longTermHealth: `Disciplined pricing compounds long-term health.`,
        }),
        narrative: `${o.name}: $${currentPrice} → $${recommendedPrice} (+$${expectedLift.toLocaleString()}).`,
      };
    });
  }
}

export class DynamicPricing implements DynamicPricingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  adjust(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): DynamicPricingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const demandIndex = clamp(
      55 + input.baseline.growthRate * 100 + input.baseline.winRate * 20,
      0,
      100
    );
    return (input.offerings.length ? input.offerings : [{ name: "Core program" } as OfferingRecord])
      .slice(0, 4)
      .map((o, i) => {
        const basePrice = Math.round(input.baseline.averageDealSize * (1 - i * 0.05));
        const adjustedPrice = Math.round(
          basePrice * (1 + (demandIndex - 50) / 500)
        );
        return {
          id: createId("dyn-price"),
          offering: o.name,
          basePrice,
          adjustedPrice,
          demandIndex: Math.round(demandIndex),
          lenses: buildLenses({
            sustainableRevenue: `Dynamic adjustment keeps ${o.name} aligned to demand.`,
            profitability: `Demand-aware pricing protects contribution in peak/soft periods.`,
            missionImpact: `Guards mission access during soft demand windows.`,
            revenueRisk: `Reduces stale-price risk when demand shifts.`,
            longTermHealth: `Adaptive pricing supports long-term revenue health.`,
          }),
          narrative: `${o.name} dynamic price $${basePrice} → $${adjustedPrice} (demand ${Math.round(demandIndex)}).`,
        };
      });
  }
}

export class PriceElasticity implements PriceElasticityContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): PriceElasticityRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return (input.offerings.length ? input.offerings : [{ name: "Core program" } as OfferingRecord])
      .slice(0, 4)
      .map((o, i) => {
        const elasticity = Number((-0.9 - i * 0.2 - (1 - input.baseline.winRate)).toFixed(2));
        const optimalPrice = Math.round(
          input.baseline.averageDealSize * (1 + Math.abs(elasticity) * 0.02)
        );
        return {
          id: createId("elast"),
          offering: o.name,
          elasticity,
          optimalPrice,
          demandSensitivity: Number(clamp01(Math.abs(elasticity) / 2).toFixed(3)),
          lenses: buildLenses({
            sustainableRevenue: `Elasticity ${elasticity} guides durable price points for ${o.name}.`,
            profitability: `Optimal $${optimalPrice} balances volume and margin.`,
            missionImpact: `Sensitivity informs scholarship and access pricing.`,
            revenueRisk: `High |elasticity| implies greater volume risk on price moves.`,
            longTermHealth: `Evidence-based elasticity supports long-term pricing health.`,
          }),
          narrative: `${o.name} elasticity ${elasticity}; optimal ~$${optimalPrice}.`,
        };
      });
  }
}

export class CompetitivePricing implements CompetitivePricingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    offerings: OfferingRecord[];
    now: Date;
  }): CompetitivePricingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return (input.offerings.length ? input.offerings : [{ name: "Core program" } as OfferingRecord])
      .slice(0, 4)
      .map((o, i) => {
        const ourPrice = Math.round(input.baseline.averageDealSize * (1 - i * 0.04));
        const marketMedian = Math.round(
          ourPrice * (0.92 + (100 - input.baseline.priceCompetitiveness) / 400)
        );
        const gap = ourPrice - marketMedian;
        const percentile = clamp(
          Math.round(input.baseline.priceCompetitiveness + i * 2),
          5,
          95
        );
        return {
          id: createId("comp-price"),
          offering: o.name,
          ourPrice,
          marketMedian,
          percentile,
          gap,
          priority: priorityFromScore(100 - Math.abs(gap) / 200),
          lenses: buildLenses({
            sustainableRevenue: `Competitive position for ${o.name} informs sustainable list pricing.`,
            profitability: `Gap $${gap} affects achievable margin vs peers.`,
            missionImpact: `Relative pricing shapes accessibility vs peers.`,
            revenueRisk: `Mispricing vs market increases win/loss risk.`,
            longTermHealth: `Competitive alignment supports durable share and health.`,
          }),
          narrative: `${o.name}: our $${ourPrice} vs market $${marketMedian} (p${percentile}).`,
        };
      });
  }
}

export class DiscountOptimization implements DiscountOptimizationContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  optimize(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): DiscountOptimizationRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const segments = ["Enterprise", "Mid-market", "Mission / scholarship"];
    return segments.map((segment, i) => {
      const currentDiscountPct = Number((0.12 + i * 0.04).toFixed(3));
      const recommendedDiscountPct = Number(
        Math.max(0.05, currentDiscountPct - 0.03).toFixed(3)
      );
      return {
        id: createId("disc"),
        segment,
        currentDiscountPct,
        recommendedDiscountPct,
        marginImpact: Number(
          ((currentDiscountPct - recommendedDiscountPct) * 0.8).toFixed(3)
        ),
        volumeLift: Number((-0.02 + i * 0.01).toFixed(3)),
        priority: priorityFromScore(100 - currentDiscountPct * 200),
        lenses: buildLenses({
          sustainableRevenue: `Discount discipline on ${segment} protects net revenue durability.`,
          profitability: `Reducing discount by ${((currentDiscountPct - recommendedDiscountPct) * 100).toFixed(1)} pts lifts margin.`,
          missionImpact: `Mission segment retains intentional aid without uncontrolled leakage.`,
          revenueRisk: `Over-discounting is a controllable revenue risk.`,
          longTermHealth: `Guardrails strengthen long-term price integrity.`,
        }),
        narrative: `${segment}: discount ${(currentDiscountPct * 100).toFixed(0)}% → ${(recommendedDiscountPct * 100).toFixed(0)}%.`,
      };
    });
  }
}

export class ScholarshipPricing implements ScholarshipPricingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ScholarshipPricingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return [
      {
        id: createId("schol"),
        program: "Need-based aid",
        aidPct: 0.35,
        missionScore: clamp(input.baseline.organizationHealthScore + 5, 0, 100),
        netRevenueImpact: -Math.round(input.baseline.annualRevenue * 0.04),
        priority: "medium",
        lenses: buildLenses({
          sustainableRevenue: "Aid budgeted as intentional net-revenue investment.",
          profitability: "Offset via full-pay mix and ancillary margin.",
          missionImpact: "Directly expands access and mission outcomes.",
          revenueRisk: "Unmanaged aid creep is the primary risk.",
          longTermHealth: "Sustainable aid policy protects long-term health and trust.",
        }),
        narrative: "Need-based aid at 35% with mission-aligned net impact.",
      },
      {
        id: createId("schol"),
        program: "Merit scholarship",
        aidPct: 0.2,
        missionScore: clamp(input.baseline.organizationHealthScore, 0, 100),
        netRevenueImpact: -Math.round(input.baseline.annualRevenue * 0.015),
        priority: "low",
        lenses: buildLenses({
          sustainableRevenue: "Merit awards attract high-LTV cohorts.",
          profitability: "Lower aid rate preserves contribution.",
          missionImpact: "Recognizes excellence aligned to mission.",
          revenueRisk: "Moderate — capped cohorts contain exposure.",
          longTermHealth: "Supports brand and long-term enrollment health.",
        }),
        narrative: "Merit scholarship at 20% aid with contained net impact.",
      },
    ];
  }
}

export class ContractPricing implements ContractPricingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ContractPricingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return [
      {
        id: createId("contract"),
        contractType: "Annual enterprise",
        termMonths: 12,
        recommendedRate: Math.round(input.baseline.averageDealSize * 1.15),
        riskBand: "low",
        lenses: buildLenses({
          sustainableRevenue: "Annual contracts lock sustainable recurring revenue.",
          profitability: "Longer terms reduce CAC amortization pressure.",
          missionImpact: "Stable partnerships enable deeper mission delivery.",
          revenueRisk: "Low — prepaid annual reduces collection risk.",
          longTermHealth: "Contract discipline improves long-term cash health.",
        }),
        narrative: `Annual enterprise ~$${Math.round(input.baseline.averageDealSize * 1.15).toLocaleString()}.`,
      },
      {
        id: createId("contract"),
        contractType: "Multi-year partnership",
        termMonths: 36,
        recommendedRate: Math.round(input.baseline.averageDealSize * 1.05),
        riskBand: "medium",
        lenses: buildLenses({
          sustainableRevenue: "Multi-year deals extend revenue visibility.",
          profitability: "Slight rate concession traded for term certainty.",
          missionImpact: "Long partnerships deepen shared mission outcomes.",
          revenueRisk: "Medium — termination clauses and indexation needed.",
          longTermHealth: "Anchors long-term health if escalators are included.",
        }),
        narrative: `36-month partnership ~$${Math.round(input.baseline.averageDealSize * 1.05).toLocaleString()}/yr.`,
      },
    ];
  }
}

export class SubscriptionPricing implements SubscriptionPricingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): SubscriptionPricingRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const plans = [
      { plan: "Essential", mult: 0.7 },
      { plan: "Professional", mult: 1.0 },
      { plan: "Enterprise", mult: 1.45 },
    ];
    return plans.map((p) => {
      const monthlyPrice = Math.round((input.baseline.arpu / 12) * p.mult);
      const annualPrice = Math.round(monthlyPrice * 10.5);
      const expectedChurn = Number(
        clamp01(input.baseline.churnRate * (1.2 - p.mult * 0.15)).toFixed(3)
      );
      const ltvEstimate = Math.round(
        monthlyPrice * 12 * (1 / Math.max(0.05, expectedChurn)) * input.baseline.grossMargin
      );
      return {
        id: createId("sub"),
        plan: p.plan,
        monthlyPrice,
        annualPrice,
        expectedChurn,
        ltvEstimate,
        priority: priorityFromScore(ltvEstimate / 1000),
        lenses: buildLenses({
          sustainableRevenue: `${p.plan} subscription designs durable MRR.`,
          profitability: `LTV ~$${ltvEstimate.toLocaleString()} vs CAC $${input.baseline.cac.toLocaleString()}.`,
          missionImpact: `${p.plan} tier balances access and capability.`,
          revenueRisk: `Expected churn ${(expectedChurn * 100).toFixed(1)}% guides risk buffers.`,
          longTermHealth: `Healthy LTV:CAC supports long-term subscription health.`,
        }),
        narrative: `${p.plan}: $${monthlyPrice}/mo, LTV ~$${ltvEstimate.toLocaleString()}.`,
      };
    });
  }
}
