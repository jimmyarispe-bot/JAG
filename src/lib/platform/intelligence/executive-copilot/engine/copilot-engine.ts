/**
 * Executive Copilot orchestrator (Sprint 067).
 * Conversational layer over the executive cognitive stack — no domain logic duplication.
 */

import { ContextBuilder } from "@/lib/platform/intelligence/executive-copilot/engine/context-builder";
import { ConversationEngine } from "@/lib/platform/intelligence/executive-copilot/engine/conversation-engine";
import { ResponseOrchestrator } from "@/lib/platform/intelligence/executive-copilot/engine/response-orchestrator";
import { runCopilotV2Bridge } from "@/lib/platform/intelligence/executive-copilot/engine/copilot-v2-bridge";
import { planReasoning } from "@/lib/platform/intelligence/executive-copilot/planners/reasoning-plan";
import {
  detectIntent,
  planRetrieval,
} from "@/lib/platform/intelligence/executive-copilot/planners/retrieval-plan";
import { buildFollowUps } from "@/lib/platform/intelligence/executive-copilot/prompts/follow-ups";
import type {
  CopilotRequest,
  CopilotResult,
} from "@/lib/platform/intelligence/executive-copilot/types";
import { EXECUTIVE_COPILOT_VERSION } from "@/lib/platform/intelligence/executive-copilot/types";

export interface CopilotEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class CopilotEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly contextBuilder: ContextBuilder;
  private readonly conversation: ConversationEngine;
  private readonly orchestrator: ResponseOrchestrator;

  constructor(deps: CopilotEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.contextBuilder = new ContextBuilder();
    this.conversation = new ConversationEngine(this.createId, this.now);
    this.orchestrator = new ResponseOrchestrator(this.createId);
  }

  answer(request: CopilotRequest): CopilotResult {
    // RC-5 — route org-scoped cross-domain questions through Copilot 2.0 soft-reads.
    const v2 = runCopilotV2Bridge({
      request,
      createId: this.createId,
      now: this.now,
      appendTurn: (args) => this.conversation.appendTurn(args),
    });
    if (v2) return v2;

    const intent = detectIntent(request.question);
    const domainTrace = planRetrieval(intent);
    const reasoning = planReasoning(intent, request.requestExecutionPrep);
    const context = this.contextBuilder.build(request);

    // Mark unused domains when soft-reads missing
    for (const entry of domainTrace) {
      const available =
        (entry.domain === "synthesis" && context.synthesis) ||
        (entry.domain === "briefing" && context.briefing) ||
        (entry.domain === "executive-memory" && context.memory) ||
        (entry.domain === "decision-intelligence" && context.decision) ||
        (entry.domain === "executive-predictive" && context.predictive) ||
        (entry.domain === "executive-autonomous" && context.autonomous);
      entry.used = Boolean(available);
      if (!available) {
        entry.reason = `${entry.domain} requested for intent but not attached`;
      }
    }

    const orchestrated = this.orchestrator.orchestrate({
      request,
      context,
      reasoning,
      domainTrace,
    });

    const conversationId = request.conversationId ?? this.createId("conv");
    const messages = this.conversation.appendTurn({
      prior: request.priorMessages,
      question: request.question,
      answer: orchestrated.answer,
      intent,
    });

    const contributing = new Set<string>([
      "executive-copilot",
      ...orchestrated.explainability.contributingDomains,
    ]);

    return {
      requestId: request.requestId,
      conversationId,
      version: EXECUTIVE_COPILOT_VERSION,
      scope: request.scope,
      generatedAt: this.now().toISOString(),
      intent,
      answer: orchestrated.answer,
      explainability: orchestrated.explainability,
      comparison: orchestrated.comparison,
      investigation: orchestrated.investigation,
      boardPrep: orchestrated.boardPrep,
      followUps: buildFollowUps(intent, this.createId),
      executionPlanRefs: orchestrated.executionPlanRefs,
      messages,
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        availableDomainCount: context.availableDomainCount,
        conflictingEvidence: context.conflictingEvidence,
        reasoningSteps: reasoning.steps,
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
}
