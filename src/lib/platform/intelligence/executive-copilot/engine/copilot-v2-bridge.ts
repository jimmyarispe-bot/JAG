/**
 * Bridge Sprint 067 CopilotResult ← RC-5 Executive Copilot 2.0 answers.
 */

import {
  answerExecutiveCopilotV2,
  shouldRouteToCopilotV2,
  type CopilotV2Answer,
} from "@/lib/platform/executive-copilot";
import { buildFollowUps } from "@/lib/platform/intelligence/executive-copilot/prompts/follow-ups";
import type {
  CopilotFollowUp,
  CopilotIntent,
  CopilotRequest,
  CopilotResult,
} from "@/lib/platform/intelligence/executive-copilot/types";
import { EXECUTIVE_COPILOT_VERSION } from "@/lib/platform/intelligence/executive-copilot/types";

export { shouldRouteToCopilotV2 };

function mapIntent(v2: CopilotV2Answer["intent"]): CopilotIntent {
  switch (v2) {
    case "board_prep":
      return "plan";
    case "memory":
      return "recall";
    case "digital_twin":
    case "timeline":
      return "forecast";
    case "decision_makers":
      return "recommend";
    case "narrative":
    case "cross_domain":
      return "summarize";
    case "revenue_decline":
    case "disconnected_departments":
    case "initiative_impact":
    case "organizational_risks":
    case "root_cause":
    case "general_investigate":
    default:
      return "investigate";
  }
}

export function runCopilotV2Bridge(input: {
  request: CopilotRequest;
  createId: (prefix: string) => string;
  now: () => Date;
  appendTurn: (args: {
    prior?: CopilotRequest["priorMessages"];
    question: string;
    answer: string;
    intent: CopilotIntent;
  }) => CopilotResult["messages"];
}): CopilotResult | null {
  const orgId = input.request.scope.organizationId;
  if (!orgId || !shouldRouteToCopilotV2(input.request.question)) {
    return null;
  }

  const v2 = answerExecutiveCopilotV2({
    organizationId: orgId,
    question: input.request.question,
    memoryLights: input.request.memoryResult
      ? {
          decisions: (input.request.memoryResult.decisions ?? [])
            .filter((d): d is { title: string; decision: string } =>
              Boolean(d.title && d.decision)
            )
            .map((d) => ({ title: d.title, decision: d.decision })),
          lessons: input.request.memoryResult.lessons,
          timeline: input.request.memoryResult.timeline,
        }
      : undefined,
  });

  const intent = mapIntent(v2.intent);
  const followUps: CopilotFollowUp[] =
    v2.followUps.length > 0
      ? v2.followUps.map((prompt, i) => ({
          id: input.createId(`fu-v2-${i}`),
          prompt,
          intent,
        }))
      : buildFollowUps(intent, input.createId);

  const messages = input.appendTurn({
    prior: input.request.priorMessages,
    question: input.request.question,
    answer: v2.answer,
    intent,
  });

  return {
    requestId: input.request.requestId,
    conversationId: input.request.conversationId ?? input.createId("conv"),
    version: EXECUTIVE_COPILOT_VERSION,
    scope: input.request.scope,
    generatedAt: input.now().toISOString(),
    intent,
    answer: v2.answer,
    explainability: {
      executiveSummary: v2.answer,
      supportingEvidence: v2.evidence.map((e) => ({
        id: e.id,
        statement: e.statement,
        domain: e.domain,
        supporting: e.supporting,
      })),
      contributingDomains: v2.contributingDomains,
      confidence: v2.confidence,
      knownUncertainties:
        v2.confidence < 0.4
          ? ["Limited domain soft-reads for Copilot 2.0"]
          : [],
      domainTrace: v2.contributingDomains.map((domain) => ({
        domain: "synthesis" as const,
        reason: `RC-5 Copilot 2.0 used ${domain}`,
        used: true,
      })),
    },
    investigation: v2.investigation
      ? {
          topic: v2.investigation.topic,
          signals: v2.investigation.findings,
          risks: v2.investigation.risks,
          opportunities: [],
          historicalDecisions: [],
          predictions: v2.rootCauses ?? [],
          recommendedNextSteps: v2.investigation.nextSteps,
        }
      : v2.rootCauses
        ? {
            topic: v2.intent,
            signals: v2.rootCauses,
            risks: [],
            opportunities: [],
            historicalDecisions: [],
            predictions: [],
            recommendedNextSteps: v2.decisionSupport ?? [],
          }
        : undefined,
    boardPrep: v2.boardPrep
      ? {
          briefingSummary: v2.boardPrep.briefingSummary,
          openDecisions: v2.boardPrep.decisions,
          highPriorityRisks: v2.boardPrep.risks,
          pendingApprovals: [],
          forecasts: v2.boardPrep.forecasts,
          recentChanges: [],
        }
      : undefined,
    followUps,
    messages,
    contributingDomains: v2.contributingDomains,
    metadata: {
      ...(input.request.metadata ?? {}),
      copilotV2: true,
      copilotV2Version: v2.version,
      copilotV2Intent: v2.intent,
      capabilitiesUsed: v2.capabilitiesUsed,
    },
    governance: {
      mayExplain: true,
      mayRecommend: true,
      mayPrepare: true,
      mayInvestigate: true,
      mayAutoExecute: false,
      routesExecutionThroughAutonomous: true,
    },
  };
}
