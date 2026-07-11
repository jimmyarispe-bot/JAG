/**
 * JAG Collaboration — default agent adapters.
 *
 * Wraps Executive / Strategic / Decision Intelligence (and lightweight
 * domain heuristics) as {@link JagCollaboratingAgent} participants.
 * Does not replace empty stubs under `jag/agents/` — injectable adapters only.
 */

import type {
  JagAgentRecommendation,
  JagAgentResponse,
  JagCollaboratingAgent,
  JagCollaborationAgentRole,
  JagCollaborationRequest,
} from "@/lib/platform/jag/collaboration/types";
import {
  createDecisionIntelligenceDomain,
  type DecisionResolver,
} from "@/lib/platform/intelligence/decision";
import {
  createExecutiveIntelligenceDomain,
  type ExecutiveResolver,
} from "@/lib/platform/intelligence/domains/executive";
import {
  createStrategicIntelligenceDomain,
  type StrategicResolver,
} from "@/lib/platform/intelligence/domains/strategic";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

export interface DefaultCollaborationAgentsDependencies {
  executiveResolver?: ExecutiveResolver;
  strategicResolver?: StrategicResolver;
  decisionResolver?: DecisionResolver;
  now?: () => Date;
}

function confidence(value: number): IntelligenceConfidenceScore {
  return {
    value: Math.max(0, Math.min(1, value)),
    level: value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown",
    factors: [],
  };
}

function timedResponse(
  role: JagCollaborationAgentRole,
  name: string,
  summary: string,
  recommendations: JagAgentRecommendation[],
  concerns: string[],
  conf: IntelligenceConfidenceScore,
  startedMs: number,
  now: () => Date
): JagAgentResponse {
  return {
    responseId: `${role}:${startedMs}`,
    agentRole: role,
    agentName: name,
    summary,
    recommendations,
    concerns,
    confidence: conf,
    elapsedMs: Math.max(0, now().getTime() - startedMs),
  };
}

/**
 * Build the default collaborating agent set.
 */
export function createDefaultCollaborationAgents(
  dependencies: DefaultCollaborationAgentsDependencies = {}
): JagCollaboratingAgent[] {
  const now = dependencies.now ?? (() => new Date());
  const executive =
    dependencies.executiveResolver ?? createExecutiveIntelligenceDomain();
  const strategic =
    dependencies.strategicResolver ?? createStrategicIntelligenceDomain();
  const decision =
    dependencies.decisionResolver ?? createDecisionIntelligenceDomain();

  const executiveAgent: JagCollaboratingAgent = {
    role: "executive",
    name: "Executive Intelligence Agent",
    weight: 1.4,
    participate(request) {
      const startedMs = now().getTime();
      const result = executive.analyze({
        requestId: `${request.requestId}:executive`,
        subject: request.subject,
        description: request.description,
        metadata: {
          ...request.metadata,
          sharedContext: request.sharedContext,
        },
      });
      const rec = result.recommendations.recommendations[0];
      const recommendation: JagAgentRecommendation = {
        recommendationKey: rec?.actionKey ?? "executive-briefing",
        title: rec?.label ?? result.briefing.summary.slice(0, 80),
        summary: result.briefing.summary,
        actions: result.recommendations.recommendations.map((r) => r.instruction),
        risk: result.classification.severity === "critical" ? 0.85 : 0.55,
        urgency: result.classification.severity === "critical" ? 0.9 : 0.6,
        impact: 0.75,
        cost: 0.5,
        missionAlignment: 0.7,
        confidence: result.classification.confidence,
        evidenceRefs: request.evidenceRefs ?? [],
      };
      return timedResponse(
        "executive",
        executiveAgent.name,
        result.briefing.summary,
        [recommendation],
        result.analysis.findings.slice(1).map((f) => f.title),
        result.classification.confidence,
        startedMs,
        now
      );
    },
  };

  const strategicAgent: JagCollaboratingAgent = {
    role: "strategic",
    name: "Strategic Intelligence Agent",
    weight: 1.2,
    participate(request) {
      const startedMs = now().getTime();
      const result = strategic.analyze({
        requestId: `${request.requestId}:strategic`,
        subject: request.subject,
        description: request.description,
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        metadata: {
          ...request.metadata,
          sharedContext: request.sharedContext,
        },
      });
      const top = result.recommendations[0];
      const recommendation: JagAgentRecommendation = {
        recommendationKey: top?.recommendationId ?? "strategic-goal",
        title: top?.recommendedActions[0] ?? result.goals[0]?.title ?? "Strategic action",
        summary: result.brief.executiveSummary,
        actions: top?.recommendedActions ?? result.goals.map((g) => g.title),
        risk: result.goals[0]?.priority === "critical" ? 0.8 : 0.5,
        urgency: top?.urgency === "immediate" ? 0.9 : 0.55,
        impact: result.impact.overallScore,
        cost: 0.55,
        missionAlignment: 0.85,
        confidence: top?.confidence ?? result.goals[0]?.confidence ?? confidence(0.6),
        evidenceRefs: request.evidenceRefs ?? [],
      };
      return timedResponse(
        "strategic",
        strategicAgent.name,
        result.brief.executiveSummary,
        [recommendation],
        result.brief.risks,
        recommendation.confidence,
        startedMs,
        now
      );
    },
  };

  const decisionAgent: JagCollaboratingAgent = {
    role: "decision",
    name: "Decision Intelligence Agent",
    weight: 1.3,
    participate(request) {
      const startedMs = now().getTime();
      const result = decision.analyze({
        requestId: `${request.requestId}:decision`,
        subject: request.subject,
        description: request.description,
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        sharedContext: request.sharedContext,
        memories: request.memories ? [...request.memories] : undefined,
        evidenceRefs: request.evidenceRefs ? [...request.evidenceRefs] : undefined,
        metadata: request.metadata,
      });
      const top = result.alternatives.alternatives[0];
      const recommendation: JagAgentRecommendation = {
        recommendationKey:
          result.recommendation.recommendedAlternativeId || "decision-option",
        title: result.recommendation.recommendedOption,
        summary: result.brief.decisionSummary,
        actions: top?.benefits.slice(0, 3) ?? result.recommendation.rationale,
        risk: result.risks.primaryRisk?.likelihood ?? 0.5,
        urgency: result.analysis.priority === "critical" ? 0.9 : 0.6,
        impact: result.impact.overallScore,
        cost: top ? Math.min(1, top.cost.amount / 100000) : 0.5,
        missionAlignment: 0.75,
        confidence: result.recommendation.confidence,
        evidenceRefs: request.evidenceRefs ?? [],
      };
      return timedResponse(
        "decision",
        decisionAgent.name,
        result.brief.decisionSummary,
        [recommendation],
        result.risks.risks.map((r) => r.title),
        result.recommendation.confidence,
        startedMs,
        now
      );
    },
  };

  const operationsAgent: JagCollaboratingAgent = {
    role: "operations",
    name: "Operations Agent",
    weight: 1.0,
    participate(request) {
      const startedMs = now().getTime();
      const recommendation: JagAgentRecommendation = {
        recommendationKey: "stabilize-operations",
        title: "Stabilize operational throughput",
        summary: `Operational response to "${request.subject}" with process controls and owners.`,
        actions: [
          "Assign operational owner",
          "Instrument leading process indicators",
          "Run a two-week stabilization sprint",
        ],
        risk: 0.45,
        urgency: 0.55,
        impact: 0.65,
        cost: 0.4,
        missionAlignment: 0.6,
        confidence: confidence(0.58),
        evidenceRefs: request.evidenceRefs ?? [],
      };
      return timedResponse(
        "operations",
        operationsAgent.name,
        recommendation.summary,
        [recommendation],
        ["Operational capacity may constrain aggressive timelines"],
        recommendation.confidence,
        startedMs,
        now
      );
    },
  };

  return [executiveAgent, strategicAgent, decisionAgent, operationsAgent];
}
