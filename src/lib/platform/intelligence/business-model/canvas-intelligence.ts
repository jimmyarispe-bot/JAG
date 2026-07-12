/**
 * Business Model Intelligence — Business Model Canvas + Lean Canvas (Sprint 037).
 */

import type {
  BusinessModelCanvasBuilder as BusinessModelCanvasBuilderContract,
  LeanCanvasBuilder as LeanCanvasBuilderContract,
} from "@/lib/platform/intelligence/business-model/contracts";
import {
  buildLenses,
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/business-model/models";
import type {
  BmcBlock,
  BmcBlockRecord,
  BusinessModelBaseline,
  BusinessModelCanvasResult,
  LeanCanvasBlock,
  LeanCanvasBlockRecord,
  LeanCanvasResult,
} from "@/lib/platform/intelligence/business-model/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";

const BMC_LABELS: Record<BmcBlock, string> = {
  customer_segments: "Customer Segments",
  value_propositions: "Value Propositions",
  channels: "Channels",
  customer_relationships: "Customer Relationships",
  revenue_streams: "Revenue Streams",
  key_resources: "Key Resources",
  key_activities: "Key Activities",
  key_partnerships: "Key Partnerships",
  cost_structure: "Cost Structure",
};

const LEAN_LABELS: Record<LeanCanvasBlock, string> = {
  problem: "Problem",
  solution: "Solution",
  unique_value_proposition: "Unique Value Proposition",
  unfair_advantage: "Unfair Advantage",
  early_adopters: "Early Adopters",
  key_metrics: "Key Metrics",
  channels: "Channels",
  revenue: "Revenue",
  costs: "Costs",
};

function blockStrength(items: string[], gaps: string[]): number {
  return clamp(items.length * 18 - gaps.length * 12 + 40);
}

export class BusinessModelCanvasBuilder
  implements BusinessModelCanvasBuilderContract
{
  build(input: {
    baseline: BusinessModelBaseline;
    dna: OrganizationDNA | null | undefined;
    now: Date;
  }): BusinessModelCanvasResult {
    void input.now;
    const bm = input.dna?.businessModel;
    const vp = input.dna?.valueProposition ?? bm?.valueProposition;

    const blocks: BmcBlockRecord[] = (
      Object.keys(BMC_LABELS) as BmcBlock[]
    ).map((block) => {
      const { items, gaps } = resolveBmcBlock(block, bm, vp, input.baseline);
      const strength = blockStrength(items, gaps);
      return {
        block,
        label: BMC_LABELS[block],
        items,
        strength,
        gaps,
        narrative: `${BMC_LABELS[block]} strength ${Math.round(strength)}.`,
      };
    });

    const completeness = clamp(
      blocks.reduce((sum, b) => sum + b.strength, 0) / blocks.length
    );

    return {
      blocks,
      completeness,
      status: statusFromScore(completeness),
      narrative: `Business Model Canvas completeness ${Math.round(completeness)} (${statusFromScore(completeness)}).`,
    };
  }
}

export class LeanCanvasBuilder implements LeanCanvasBuilderContract {
  build(input: {
    baseline: BusinessModelBaseline;
    dna: OrganizationDNA | null | undefined;
    now: Date;
  }): LeanCanvasResult {
    void input.now;
    const bm = input.dna?.businessModel;
    const vp = input.dna?.valueProposition ?? bm?.valueProposition;
    const swot = input.dna?.swot;

    const blocks: LeanCanvasBlockRecord[] = (
      Object.keys(LEAN_LABELS) as LeanCanvasBlock[]
    ).map((block) => {
      const { items, gaps } = resolveLeanBlock(
        block,
        bm,
        vp,
        swot,
        input.baseline
      );
      const strength = blockStrength(items, gaps);
      return {
        block,
        label: LEAN_LABELS[block],
        items,
        strength,
        gaps,
        narrative: `${LEAN_LABELS[block]} strength ${Math.round(strength)}.`,
      };
    });

    const completeness = clamp(
      blocks.reduce((sum, b) => sum + b.strength, 0) / blocks.length
    );

    return {
      blocks,
      completeness,
      status: statusFromScore(completeness),
      narrative: `Lean Canvas completeness ${Math.round(completeness)} (${statusFromScore(completeness)}).`,
    };
  }
}

function resolveBmcBlock(
  block: BmcBlock,
  bm: OrganizationDNA["businessModel"] | undefined,
  vp: OrganizationDNA["valueProposition"] | undefined,
  baseline: BusinessModelBaseline
): { items: string[]; gaps: string[] } {
  switch (block) {
    case "customer_segments":
      return {
        items:
          bm?.customerSegments?.length
            ? bm.customerSegments
            : ["Mission-aligned families", "Institutional partners"],
        gaps: (bm?.customerSegments?.length ?? 0) < 2 ? ["Segment depth"] : [],
      };
    case "value_propositions":
      return {
        items: vp?.statement
          ? [vp.statement, ...(vp.differentiators ?? vp.gainsCreated ?? []).slice(0, 2)]
          : ["Mission-driven outcomes", "Trusted delivery"],
        gaps: vp?.statement ? [] : ["Explicit value proposition"],
      };
    case "channels":
      return {
        items:
          bm?.channels?.length
            ? bm.channels
            : ["Direct enrollment", "Community partnerships"],
        gaps: (bm?.channels?.length ?? 0) < 2 ? ["Channel diversification"] : [],
      };
    case "customer_relationships":
      return {
        items: ["High-touch advising", "Community engagement", "Retention programs"],
        gaps: baseline.valueDeliveryScore < 60 ? ["Relationship systemization"] : [],
      };
    case "revenue_streams":
      return {
        items: bm?.revenueModel?.streams?.map((s) => s.name) ?? [
          "Primary revenue",
          "Ancillary / grants",
        ],
        gaps:
          (bm?.revenueModel?.streams?.length ?? 0) < 2
            ? ["Revenue diversification"]
            : [],
      };
    case "key_resources":
      return {
        items:
          bm?.keyResources?.length
            ? bm.keyResources
            : ["Talent", "Brand trust", "Delivery systems"],
        gaps: (bm?.keyResources?.length ?? 0) < 2 ? ["Resource map"] : [],
      };
    case "key_activities":
      return {
        items:
          bm?.keyActivities?.length
            ? bm.keyActivities
            : ["Service delivery", "Enrollment growth", "Quality assurance"],
        gaps: (bm?.keyActivities?.length ?? 0) < 2 ? ["Activity prioritization"] : [],
      };
    case "key_partnerships":
      return {
        items:
          bm?.keyPartners?.length
            ? bm.keyPartners
            : ["Community partners", "Funding partners"],
        gaps: (bm?.keyPartners?.length ?? 0) < 2 ? ["Partnership strategy"] : [],
      };
    case "cost_structure":
      return {
        items:
          bm?.costDrivers?.length
            ? bm.costDrivers
            : ["People costs", "Program delivery", "Facilities / platform"],
        gaps: baseline.grossMargin < 0.4 ? ["Cost discipline"] : [],
      };
  }
}

function resolveLeanBlock(
  block: LeanCanvasBlock,
  bm: OrganizationDNA["businessModel"] | undefined,
  vp: OrganizationDNA["valueProposition"] | undefined,
  swot: OrganizationDNA["swot"] | undefined,
  baseline: BusinessModelBaseline
): { items: string[]; gaps: string[] } {
  switch (block) {
    case "problem":
      return {
        items: swot?.weaknesses?.slice(0, 3) ?? [
          "Access gaps",
          "Outcome consistency",
          "Funding volatility",
        ],
        gaps: (swot?.weaknesses?.length ?? 0) === 0 ? ["Problem clarity"] : [],
      };
    case "solution":
      return {
        items: bm?.keyActivities?.slice(0, 3) ?? [
          "Core offering",
          "Support systems",
          "Quality loops",
        ],
        gaps: [],
      };
    case "unique_value_proposition":
      return {
        items: [vp?.statement ?? "Mission-aligned differentiated outcomes"],
        gaps: vp?.statement ? [] : ["UVP articulation"],
      };
    case "unfair_advantage":
      return {
        items: swot?.strengths?.slice(0, 3) ?? [
          "Trust capital",
          "Community position",
        ],
        gaps: (swot?.strengths?.length ?? 0) < 2 ? ["Advantage proof"] : [],
      };
    case "early_adopters":
      return {
        items: bm?.customerSegments?.slice(0, 2) ?? ["Early mission partners"],
        gaps: [],
      };
    case "key_metrics":
      return {
        items: [
          "Revenue growth",
          "Gross margin",
          "Mission outcome score",
          `Clarity ${Math.round(baseline.clarityScore)}`,
        ],
        gaps: [],
      };
    case "channels":
      return {
        items: bm?.channels?.slice(0, 3) ?? ["Direct", "Partner"],
        gaps: [],
      };
    case "revenue":
      return {
        items: [
          `Annual revenue $${baseline.annualRevenue.toLocaleString()}`,
          `Growth ${(baseline.growthRate * 100).toFixed(1)}%`,
        ],
        gaps: baseline.valueCaptureScore < 55 ? ["Capture model"] : [],
      };
    case "costs":
      return {
        items: bm?.costDrivers?.slice(0, 3) ?? ["Delivery", "People", "Platform"],
        gaps: baseline.capitalIntensity > 0.55 ? ["Capital intensity"] : [],
      };
  }
}

/** Re-export lens helper for canvas narratives when needed. */
export { buildLenses };
