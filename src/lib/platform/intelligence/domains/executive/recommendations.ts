/**
 * Executive Intelligence — recommendations.
 *
 * Produces tenant-agnostic executive action recommendations by category.
 */

import type {
  ExecutiveCategory,
  ExecutiveRecommendation,
  ExecutiveRecommendationSet,
} from "@/lib/platform/intelligence/domains/executive/types";
import type { IntelligenceActionAuthority } from "@/lib/platform/intelligence/types";

interface RecommendationDefinition {
  title: string;
  summary: string;
  items: ReadonlyArray<{
    actionKey: string;
    label: string;
    instruction: string;
    authority: IntelligenceActionAuthority;
    expectedImpact?: string;
    optional?: boolean;
  }>;
}

const RECOMMENDATION_DEFINITIONS: Record<ExecutiveCategory, RecommendationDefinition> = {
  strategic: {
    title: "Strategic Alignment Actions",
    summary: "Refocus leadership attention on strategic goal alignment",
    items: [
      {
        actionKey: "exec.strategic.review_goals",
        label: "Review strategic goals",
        instruction: "Compare current KPI trajectory against annual strategic goals",
        authority: "recommend",
        expectedImpact: "Clarify whether course correction is required",
      },
      {
        actionKey: "exec.strategic.initiative_status",
        label: "Initiative status check",
        instruction: "Request status updates for top strategic initiatives",
        authority: "requires_human",
      },
    ],
  },
  risk: {
    title: "Risk Mitigation Actions",
    summary: "Reduce elevated organizational risk exposure",
    items: [
      {
        actionKey: "exec.risk.triage_alerts",
        label: "Triage open alerts",
        instruction: "Prioritize open executive alerts by severity and blast radius",
        authority: "recommend",
      },
      {
        actionKey: "exec.risk.mitigation_owner",
        label: "Assign mitigation owner",
        instruction: "Assign an owner and deadline for the top risk finding",
        authority: "requires_human",
      },
    ],
  },
  opportunity: {
    title: "Opportunity Pursuit Actions",
    summary: "Evaluate and prioritize growth opportunities",
    items: [
      {
        actionKey: "exec.opp.score_opportunity",
        label: "Score opportunity",
        instruction: "Estimate impact, effort, and risk for the identified opportunity",
        authority: "recommend",
      },
      {
        actionKey: "exec.opp.pilot",
        label: "Approve pilot",
        instruction: "Decide whether to authorize a time-boxed pilot",
        authority: "requires_human",
      },
    ],
  },
  forecast: {
    title: "Forecast Response Actions",
    summary: "Address forecast variance with plan updates",
    items: [
      {
        actionKey: "exec.forecast.compare",
        label: "Compare forecast vs actuals",
        instruction: "Quantify variance drivers for the current forecast period",
        authority: "recommend",
      },
      {
        actionKey: "exec.forecast.update_plan",
        label: "Update plan assumptions",
        instruction: "Revise planning assumptions with finance and program leads",
        authority: "requires_human",
      },
    ],
  },
  scenario: {
    title: "Scenario Planning Actions",
    summary: "Use scenarios to inform executive decisions",
    items: [
      {
        actionKey: "exec.scenario.run_set",
        label: "Run scenario set",
        instruction: "Evaluate best, base, and worst scenarios for the decision",
        authority: "recommend",
      },
      {
        actionKey: "exec.scenario.choose_path",
        label: "Select preferred path",
        instruction: "Document the preferred scenario and trigger conditions",
        authority: "requires_human",
      },
    ],
  },
  summary: {
    title: "Executive Summary Actions",
    summary: "Complete a concise leadership briefing",
    items: [
      {
        actionKey: "exec.summary.compose",
        label: "Compose briefing",
        instruction: "Assemble KPI, risk, and opportunity highlights into one summary",
        authority: "recommend",
      },
    ],
  },
  board: {
    title: "Board Reporting Actions",
    summary: "Prepare board-ready narrative and evidence",
    items: [
      {
        actionKey: "exec.board.assemble_pack",
        label: "Assemble board pack",
        instruction: "Collect required metrics, narratives, and evidence references",
        authority: "recommend",
      },
      {
        actionKey: "exec.board.approve_pack",
        label: "Approve board pack",
        instruction: "Obtain founder/CEO approval before distribution",
        authority: "requires_human",
      },
    ],
  },
  enrollment: {
    title: "Enrollment Response Actions",
    summary: "Stabilize or improve enrollment outcomes",
    items: [
      {
        actionKey: "exec.enroll.funnel_review",
        label: "Review admissions funnel",
        instruction: "Identify conversion drop-offs across admissions stages",
        authority: "recommend",
      },
      {
        actionKey: "exec.enroll.intervention",
        label: "Authorize intervention",
        instruction: "Approve targeted admissions or retention interventions",
        authority: "requires_human",
      },
    ],
  },
  financial_health: {
    title: "Financial Health Actions",
    summary: "Protect cash and margin health",
    items: [
      {
        actionKey: "exec.fin.cash_review",
        label: "Cash review",
        instruction: "Review cash position, collections, and near-term obligations",
        authority: "recommend",
      },
      {
        actionKey: "exec.fin.decision",
        label: "Financial decision",
        instruction: "Decide on spend controls, collections push, or funding actions",
        authority: "requires_human",
      },
    ],
  },
  operations: {
    title: "Operations Improvement Actions",
    summary: "Remove operational bottlenecks affecting performance",
    items: [
      {
        actionKey: "exec.ops.bottleneck_map",
        label: "Map bottlenecks",
        instruction: "Identify the top operational constraints from staffing and workflow signals",
        authority: "recommend",
      },
      {
        actionKey: "exec.ops.capacity_action",
        label: "Capacity action",
        instruction: "Approve staffing or process changes to relieve the bottleneck",
        authority: "requires_human",
      },
    ],
  },
  compliance: {
    title: "Compliance Readiness Actions",
    summary: "Reduce compliance and audit exposure",
    items: [
      {
        actionKey: "exec.comp.gap_list",
        label: "List compliance gaps",
        instruction: "Enumerate open compliance alerts and expiring documents",
        authority: "recommend",
      },
      {
        actionKey: "exec.comp.remediate",
        label: "Remediation ownership",
        instruction: "Assign owners and due dates for each material gap",
        authority: "requires_human",
      },
    ],
  },
  general: {
    title: "Executive Triage Actions",
    summary: "Gather enough context to specialize the briefing",
    items: [
      {
        actionKey: "exec.general.clarify",
        label: "Clarify decision",
        instruction: "Ask what decision or outcome the executive needs",
        authority: "recommend",
      },
      {
        actionKey: "exec.general.collect_kpis",
        label: "Collect KPI context",
        instruction: "Attach relevant KPI trends, timeframe, and school scope",
        authority: "recommend",
      },
    ],
  },
};

/** Options for recommendation generation. */
export interface ExecutiveRecommendationsOptions {
  includeOptional?: boolean;
}

/**
 * Builds category-scoped executive recommendation sets.
 */
export class ExecutiveRecommendations {
  private readonly includeOptional: boolean;

  constructor(options: ExecutiveRecommendationsOptions = {}) {
    this.includeOptional = options.includeOptional ?? true;
  }

  /**
   * Get recommendations for an executive category.
   */
  getRecommendations(category: ExecutiveCategory): ExecutiveRecommendationSet {
    const definition = RECOMMENDATION_DEFINITIONS[category];
    const recommendations: ExecutiveRecommendation[] = definition.items
      .filter((item) => this.includeOptional || !item.optional)
      .map((item, index) => ({
        recommendationId: `${category}:${item.actionKey}`,
        actionKey: item.actionKey,
        label: item.label,
        instruction: item.instruction,
        authority: item.authority,
        order: index + 1,
        expectedImpact: item.expectedImpact,
        optional: item.optional,
      }));

    return {
      setKey: `executive.recommendations.${category}`,
      category,
      title: definition.title,
      summary: definition.summary,
      recommendations,
    };
  }
}
