/**
 * Operations Intelligence — projection + queries (Sprint 038).
 */

import type {
  OperationsProjection as OperationsProjectionContract,
  OperationsQueries as OperationsQueriesContract,
} from "@/lib/platform/intelligence/operations/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/operations/models";
import type {
  OperationsProjectionResult,
  OperationsQueryRequest,
  OperationsQueryResult,
  OperationsResult,
} from "@/lib/platform/intelligence/operations/types";

export class OperationsProjection implements OperationsProjectionContract {
  project(input: {
    request: Parameters<OperationsProjectionContract["project"]>[0]["request"];
    healthScore: Parameters<OperationsProjectionContract["project"]>[0]["healthScore"];
    workflowScore: Parameters<OperationsProjectionContract["project"]>[0]["workflowScore"];
    staffingScore: Parameters<OperationsProjectionContract["project"]>[0]["staffingScore"];
    capacityScore: Parameters<OperationsProjectionContract["project"]>[0]["capacityScore"];
    automationScore: Parameters<OperationsProjectionContract["project"]>[0]["automationScore"];
    workflowHealth: Parameters<OperationsProjectionContract["project"]>[0]["workflowHealth"];
    processMonitoring: Parameters<OperationsProjectionContract["project"]>[0]["processMonitoring"];
    capacityPlan: Parameters<OperationsProjectionContract["project"]>[0]["capacityPlan"];
    brief: Parameters<OperationsProjectionContract["project"]>[0]["brief"];
    confidence: Parameters<OperationsProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<OperationsProjectionContract["project"]>[0]["dashboard"];
    baseline: Parameters<OperationsProjectionContract["project"]>[0]["baseline"];
  }): OperationsProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.healthScore.value,
      workflowScore: input.workflowScore.value,
      staffingScore: input.staffingScore.value,
      capacityScore: input.capacityScore.value,
      automationScore: input.automationScore.value,
      workflowHealth: input.workflowHealth,
      processMonitoring: input.processMonitoring,
      capacityPlan: input.capacityPlan,
      brief: input.brief,
      dashboard: input.dashboard,
      metrics: {
        staffCount: input.baseline.staffCount,
        enrollment: input.baseline.enrollment,
        openRoles: input.baseline.openRoles,
        resourceUtilization: input.baseline.resourceUtilization,
        operationalComplexity: input.baseline.operationalComplexity,
        backlogPressure: input.baseline.backlogPressure,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class OperationsQueries implements OperationsQueriesContract {
  ask(
    result: OperationsResult,
    request: OperationsQueryRequest
  ): OperationsQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "workflow":
        answer = result.workflowHealth.narrative;
        references = result.workflowHealth.dimensions
          .slice(0, max)
          .map((d) => d.narrative);
        break;
      case "process":
        answer = result.processMonitoring.narrative;
        references = result.processMonitoring.areas
          .slice(0, max)
          .map((a) => a.narrative);
        break;
      case "staffing":
        answer = result.staffingAnalytics.narrative;
        references = result.staffingAnalytics.gaps.slice(0, max);
        break;
      case "capacity":
        answer = result.capacityPlan.narrative;
        references = result.capacityPlan.horizons
          .slice(0, max)
          .map((h) => h.narrative);
        break;
      case "automation":
        answer = result.automationOpportunities.narrative;
        references = result.automationOpportunities.opportunities
          .slice(0, max)
          .map((o) => o.narrative);
        break;
      case "utilization":
        answer = result.resourceUtilization.narrative;
        references = result.resourceUtilization.levers.slice(0, max);
        break;
      case "risk":
        answer = result.riskScore.narrative;
        references = result.risks.slice(0, max).map((r) => r.narrative);
        break;
      case "opportunity":
        answer = result.opportunities[0]?.narrative ?? result.brief.summary;
        references = result.opportunities.slice(0, max).map((o) => o.narrative);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((r) => r.title);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        {
          key: "result",
          label: "Result coverage",
          contribution: result.confidence.value,
        },
        {
          key: "focus",
          label: "Focus specificity",
          contribution: focus === "general" ? 0.55 : 0.8,
        },
      ]),
    };
  }
}
