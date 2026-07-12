/**
 * Revenue Intelligence — Customer revenue suite (Sprint 033).
 */

import type {
  CrossSellEngine as CrossSellEngineContract,
  CustomerLifetimeValue as CustomerLifetimeValueContract,
  CustomerProfitability as CustomerProfitabilityContract,
  ExpansionRevenue as ExpansionRevenueContract,
  RetentionRevenue as RetentionRevenueContract,
  SegmentProfitability as SegmentProfitabilityContract,
  UpsellEngine as UpsellEngineContract,
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
  CrossSellRecord,
  CustomerLtvRecord,
  CustomerProfitabilityRecord,
  ExpansionRevenueRecord,
  OfferingRecord,
  RetentionRevenueRecord,
  RevenueBaseline,
  SegmentProfitabilityResult,
  SubscriptionPricingRecord,
  UpsellRecord,
} from "@/lib/platform/intelligence/revenue/types";

const SEGMENTS = ["Enterprise", "Mid-market", "SMB / family", "Mission cohort"];

export class CustomerLifetimeValue
  implements CustomerLifetimeValueContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CustomerLtvRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return SEGMENTS.map((segment, i) => {
      const mult = 1.3 - i * 0.18;
      const ltv = Math.round(input.baseline.ltv * mult);
      const cac = Math.round(input.baseline.cac * (0.9 + i * 0.1));
      const ltvCacRatio = Number((ltv / Math.max(1, cac)).toFixed(2));
      const paybackMonths = Number(
        ((cac / Math.max(1, input.baseline.arpu / 12)) * (1 + i * 0.1)).toFixed(1)
      );
      return {
        id: createId("ltv"),
        segment,
        ltv,
        cac,
        ltvCacRatio,
        paybackMonths,
        priority: priorityFromScore(ltvCacRatio * 25),
        lenses: buildLenses({
          sustainableRevenue: `${segment} LTV $${ltv.toLocaleString()} anchors durable cohort value.`,
          profitability: `LTV:CAC ${ltvCacRatio} with ${paybackMonths}mo payback.`,
          missionImpact: `${segment} economics determine sustainable mission access.`,
          revenueRisk: `Weak LTV:CAC elevates acquisition risk for ${segment}.`,
          longTermHealth: `Healthy unit economics compound long-term customer health.`,
        }),
        narrative: `${segment}: LTV $${ltv.toLocaleString()}, LTV:CAC ${ltvCacRatio}.`,
      };
    });
  }
}

export class RetentionRevenue implements RetentionRevenueContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): RetentionRevenueRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return SEGMENTS.map((segment, i) => {
      const retentionRate = clamp01(
        1 - input.baseline.churnRate * (0.8 + i * 0.15)
      );
      const segmentShare = 0.35 - i * 0.07;
      const retainedRevenue = Math.round(
        input.baseline.recurringRevenue * segmentShare * retentionRate
      );
      const atRiskRevenue = Math.round(
        input.baseline.recurringRevenue * segmentShare * (1 - retentionRate)
      );
      return {
        id: createId("retain-rev"),
        segment,
        retentionRate: Number(retentionRate.toFixed(3)),
        retainedRevenue,
        atRiskRevenue,
        priority: priorityFromScore(retentionRate * 100),
        lenses: buildLenses({
          sustainableRevenue: `${segment} retains $${retainedRevenue.toLocaleString()} of recurring revenue.`,
          profitability: `Retention protects high-margin recurring contribution.`,
          missionImpact: `Kept customers continue receiving mission outcomes.`,
          revenueRisk: `$${atRiskRevenue.toLocaleString()} at risk from churn.`,
          longTermHealth: `Retention is the strongest lever for long-term health.`,
        }),
        narrative: `${segment}: ${(retentionRate * 100).toFixed(1)}% retention, $${atRiskRevenue.toLocaleString()} at risk.`,
      };
    });
  }
}

export class ExpansionRevenue implements ExpansionRevenueContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): ExpansionRevenueRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return SEGMENTS.slice(0, 3).map((segment, i) => {
      const expansionRate = Number(
        (0.08 + input.baseline.nrr - 1 + i * 0.02).toFixed(3)
      );
      const expansionRevenue = Math.round(
        input.baseline.recurringRevenue * (0.3 - i * 0.05) * Math.max(0, expansionRate)
      );
      return {
        id: createId("exp-rev"),
        segment,
        expansionRate,
        expansionRevenue,
        opportunities: [
          "Plan upgrades",
          "Seat expansion",
          "Add-on services",
        ],
        priority: priorityFromScore(expansionRate * 400),
        lenses: buildLenses({
          sustainableRevenue: `${segment} expansion targets +$${expansionRevenue.toLocaleString()}.`,
          profitability: `Expansion revenue typically carries above-average margins.`,
          missionImpact: `Deeper adoption increases mission outcome intensity.`,
          revenueRisk: `Over-selling without success capacity creates churn risk.`,
          longTermHealth: `NRR-driven expansion compounds long-term health.`,
        }),
        narrative: `${segment}: expansion ${(expansionRate * 100).toFixed(1)}% → $${expansionRevenue.toLocaleString()}.`,
      };
    });
  }
}

export class CrossSellEngine implements CrossSellEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    offerings: OfferingRecord[];
    baseline: RevenueBaseline;
    now: Date;
  }): CrossSellRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const offers = input.offerings.length >= 2 ? input.offerings : [
      { name: "Core enrollment program", revenue: input.baseline.annualRevenue * 0.4 },
      { name: "Premium advisory", revenue: input.baseline.annualRevenue * 0.15 },
      { name: "Digital subscription", revenue: input.baseline.annualRevenue * 0.2 },
    ];

    const pairs: CrossSellRecord[] = [];
    for (let i = 0; i < Math.min(3, offers.length - 1); i++) {
      const from = offers[i]!;
      const to = offers[i + 1]!;
      const attachRate = Number((0.12 + i * 0.04).toFixed(3));
      const expectedRevenue = Math.round(
        (("revenue" in from ? from.revenue : input.baseline.annualRevenue * 0.2) as number) *
          attachRate *
          0.35
      );
      pairs.push({
        id: createId("xsell"),
        fromOffering: from.name,
        toOffering: to.name,
        attachRate,
        expectedRevenue,
        priority: priorityFromScore(attachRate * 300),
        lenses: buildLenses({
          sustainableRevenue: `Cross-sell ${from.name} → ${to.name} adds $${expectedRevenue.toLocaleString()}.`,
          profitability: `Attach motions leverage existing CAC for higher contribution.`,
          missionImpact: `Bundles deepen holistic mission delivery.`,
          revenueRisk: `Poor attach UX can hurt retention — gate with success criteria.`,
          longTermHealth: `Cross-sell diversity strengthens long-term ARPU health.`,
        }),
        narrative: `${from.name} → ${to.name}: ${(attachRate * 100).toFixed(0)}% attach, +$${expectedRevenue.toLocaleString()}.`,
      });
    }
    return pairs;
  }
}

export class UpsellEngine implements UpsellEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    baseline: RevenueBaseline;
    subscriptions: SubscriptionPricingRecord[];
    now: Date;
  }): UpsellRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    const plans =
      input.subscriptions.length >= 2
        ? input.subscriptions
        : [
            { plan: "Essential", monthlyPrice: 100 },
            { plan: "Professional", monthlyPrice: 180 },
            { plan: "Enterprise", monthlyPrice: 320 },
          ];

    const records: UpsellRecord[] = [];
    for (let i = 0; i < plans.length - 1; i++) {
      const from = plans[i]!;
      const to = plans[i + 1]!;
      const conversionRate = Number((0.1 + i * 0.03).toFixed(3));
      const priceDelta =
        ("monthlyPrice" in to ? to.monthlyPrice : 180) -
        ("monthlyPrice" in from ? from.monthlyPrice : 100);
      const expectedRevenue = Math.round(
        priceDelta * 12 * input.baseline.customerCount * 0.15 * conversionRate
      );
      records.push({
        id: createId("upsell"),
        segment: SEGMENTS[i] ?? "Mid-market",
        fromPlan: from.plan,
        toPlan: to.plan,
        conversionRate,
        expectedRevenue,
        priority: priorityFromScore(conversionRate * 400),
        lenses: buildLenses({
          sustainableRevenue: `Upsell ${from.plan} → ${to.plan} targets +$${expectedRevenue.toLocaleString()}.`,
          profitability: `Plan upgrades improve ARPU with limited incremental CAC.`,
          missionImpact: `Higher tiers unlock richer mission capabilities.`,
          revenueRisk: `Pushy upsell increases churn risk — keep value-led.`,
          longTermHealth: `NRR via upsell strengthens long-term recurring health.`,
        }),
        narrative: `${from.plan} → ${to.plan}: ${(conversionRate * 100).toFixed(0)}% convert, +$${expectedRevenue.toLocaleString()}.`,
      });
    }
    return records;
  }
}

export class CustomerProfitability
  implements CustomerProfitabilityContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    baseline: RevenueBaseline;
    now: Date;
  }): CustomerProfitabilityRecord[] {
    const createId = this.deps.createId ?? defaultCreateId;
    return SEGMENTS.map((segment, i) => {
      const share = 0.34 - i * 0.06;
      const revenue = Math.round(input.baseline.annualRevenue * share);
      const costToServe = Math.round(
        revenue * (0.35 + i * 0.05 + (1 - input.baseline.grossMargin) * 0.2)
      );
      const marginPct = clamp01((revenue - costToServe) / Math.max(1, revenue));
      return {
        id: createId("cust-prof"),
        segment,
        revenue,
        costToServe,
        marginPct: Number(marginPct.toFixed(3)),
        priority: priorityFromScore(marginPct * 100),
        lenses: buildLenses({
          sustainableRevenue: `${segment} contributes $${revenue.toLocaleString()}.`,
          profitability: `Customer margin ${Math.round(marginPct * 100)}% after cost-to-serve.`,
          missionImpact: `Serve economics determine scalable mission coverage.`,
          revenueRisk: `High cost-to-serve segments elevate margin risk.`,
          longTermHealth: `Segment profitability discipline sustains long-term health.`,
        }),
        narrative: `${segment}: $${revenue.toLocaleString()} rev, ${Math.round(marginPct * 100)}% margin.`,
      };
    });
  }
}

export class SegmentProfitability implements SegmentProfitabilityContract {
  analyze(input: {
    customers: CustomerProfitabilityRecord[];
    baseline: RevenueBaseline;
  }): SegmentProfitabilityResult {
    const sorted = [...input.customers].sort(
      (a, b) => b.marginPct - a.marginPct
    );
    const top = sorted[0];
    const weak = sorted[sorted.length - 1];
    const avg =
      input.customers.reduce((s, c) => s + c.marginPct, 0) /
      Math.max(1, input.customers.length);
    const status = statusFromScore(avg * 100);
    return {
      segments: input.customers,
      topSegment: top?.segment ?? "n/a",
      weakestSegment: weak?.segment ?? "n/a",
      status,
      lenses: buildLenses({
        sustainableRevenue: "Segment mix drives durable portfolio revenue quality.",
        profitability: `Average segment margin ${Math.round(avg * 100)}%; top ${top?.segment ?? "n/a"}.`,
        missionImpact: `Balance profitable segments with mission cohort access.`,
        revenueRisk: `Weakest segment ${weak?.segment ?? "n/a"} needs remediation.`,
        longTermHealth: `Rebalancing toward healthy segments improves long-term health.`,
      }),
      narrative: `Segment profitability ${status}: top ${top?.segment ?? "n/a"}, weak ${weak?.segment ?? "n/a"}.`,
    };
  }
}
