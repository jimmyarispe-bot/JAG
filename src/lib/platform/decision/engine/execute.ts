import { assistDecision } from "@/lib/platform/decision/engine/ai-engine";
import {
  buildDecisionAuditEntry,
  nextDecisionExecutionId,
  recordDecisionAuditEntry,
} from "@/lib/platform/decision/engine/audit";
import { buildDecisionExplanation } from "@/lib/platform/decision/engine/explanation";
import { evaluateDecisionRules } from "@/lib/platform/decision/engine/rule-engine";
import { collectDecisionEvidence } from "@/lib/platform/decision/evidence/collector";
import { persistDecisionAuditEntry } from "@/lib/platform/decision/persistence/records";
import { syncDecisionGraphEdges } from "@/lib/platform/intelligence-graph/integration/decisions";
import { getDecisionDefinition } from "@/lib/platform/decision/registry/registry";
import { computeDecisionConfidence } from "@/lib/platform/decision/scoring/confidence";
import { scoreDecisionOutcomes } from "@/lib/platform/decision/scoring/framework";
import { DECISION_ENGINE_VERSION } from "@/lib/platform/decision/version";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  AlternativeRecommendation,
  DecisionResult,
  ExecuteDecisionInput,
  Recommendation,
} from "@/lib/platform/decision/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ExecuteDecisionOptions {
  ruleEngineKey?: string;
  aiAssistEngineKey?: string;
  recordAudit?: boolean;
  /** Wave 1 — persist audit entry to platform_decision_records when provided. */
  persist?: {
    supabase: AuthClient;
  };
}

function buildRecommendation(
  outcomeKey: string,
  score: number,
  definition: ReturnType<typeof getDecisionDefinition>
): Recommendation {
  const option = definition!.recommendationOptions.find((o) => o.outcomeKey === outcomeKey);
  return {
    outcomeKey,
    actionKey: option?.actionKey ?? outcomeKey,
    label: option?.label ?? outcomeKey,
    description: option?.description,
    score,
    priority: option?.defaultPriority,
    metadata: option?.metadata,
  };
}

function buildAlternatives(
  scoring: ReturnType<typeof scoreDecisionOutcomes>,
  primaryOutcomeKey: string,
  definition: ReturnType<typeof getDecisionDefinition>
): AlternativeRecommendation[] {
  return scoring.rankedOutcomes
    .filter((outcome) => outcome.outcomeKey !== primaryOutcomeKey)
    .map((outcome, index) => {
      const option = definition!.recommendationOptions.find(
        (o) => o.outcomeKey === outcome.outcomeKey
      );
      return {
        outcomeKey: outcome.outcomeKey,
        actionKey: option?.actionKey ?? outcome.outcomeKey,
        label: option?.label ?? outcome.outcomeKey,
        description: option?.description,
        score: outcome.score,
        rank: index + 1,
        tradeoffs:
          outcome.score < scoring.rankedOutcomes[0]!.score
            ? [`Lower score than primary by ${(scoring.rankedOutcomes[0]!.score - outcome.score).toFixed(1)}`]
            : undefined,
        metadata: option?.metadata,
      };
    });
}

/**
 * Execute a registered decision through the unified platform API.
 * Supports rule-based, AI-assisted, and hybrid engine modes via the same contract.
 */
export async function executeDecision(
  input: ExecuteDecisionInput,
  options: ExecuteDecisionOptions = {}
): Promise<DecisionResult> {
  const definition = getDecisionDefinition(input.decisionType);
  if (!definition) {
    throw new Error(`Unknown decision type "${input.decisionType}"`);
  }
  if (definition.status !== "active") {
    throw new Error(`Decision type "${input.decisionType}" is not active`);
  }

  const executionId = nextDecisionExecutionId();
  const executionTimestamp = new Date().toISOString();

  const evidence = await collectDecisionEvidence(definition, {
    decisionType: input.decisionType,
    inputs: input.inputs,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  const ruleResult = await evaluateDecisionRules(
    { definition, inputs: input.inputs, evidence },
    options.ruleEngineKey
  );

  let outcomeAdjustments: Record<string, number> = {};
  let aiReasoning: string[] | undefined;
  let aiConfidenceAdjustment = 0;

  if (definition.engineMode !== "rule") {
    const initialScoring = scoreDecisionOutcomes({
      definition,
      rulesApplied: ruleResult.rulesApplied,
    });

    const aiResult = await assistDecision(
      {
        definition,
        inputs: input.inputs,
        evidence,
        ruleResult,
        scoringPreview: initialScoring,
      },
      options.aiAssistEngineKey
    );

    outcomeAdjustments = aiResult?.outcomeAdjustments ?? {};
    aiReasoning = aiResult?.reasoning;
    aiConfidenceAdjustment = aiResult?.confidenceAdjustment ?? 0;
  }

  const finalScoring = scoreDecisionOutcomes({
    definition,
    rulesApplied: ruleResult.rulesApplied,
    outcomeAdjustments,
  });

  const primaryOutcomeKey = finalScoring.primaryOutcomeKey;

  const primaryScore =
    finalScoring.rankedOutcomes.find((o) => o.outcomeKey === primaryOutcomeKey)?.score ??
    finalScoring.rankedOutcomes[0]?.score ??
    0;

  const recommendation = buildRecommendation(primaryOutcomeKey, primaryScore, definition);
  const alternativeRecommendations = buildAlternatives(finalScoring, primaryOutcomeKey, definition);

  const scoreGap =
    finalScoring.rankedOutcomes.length > 1
      ? finalScoring.rankedOutcomes[0]!.score - finalScoring.rankedOutcomes[1]!.score
      : 0;

  const confidence = computeDecisionConfidence({
    evidence,
    rulesApplied: ruleResult.rulesApplied,
    scoreGap,
    aiAdjustment: aiConfidenceAdjustment,
  });

  const explanation = buildDecisionExplanation({
    definition,
    recommendation,
    scoring: finalScoring,
    evidence,
    rulesApplied: ruleResult.rulesApplied,
    aiReasoning,
  });

  const result: DecisionResult = {
    decisionType: input.decisionType,
    inputs: input.inputs,
    collectedEvidence: evidence,
    rulesApplied: ruleResult.rulesApplied,
    recommendation,
    alternativeRecommendations,
    confidence,
    explanation,
    executionTimestamp,
    engineVersion: DECISION_ENGINE_VERSION,
    executionId,
    engineMode: definition.engineMode,
  };

  if (options.recordAudit !== false) {
    const auditEntry = buildDecisionAuditEntry(
      { ...input, metadata: { ...input.metadata, domain: definition.domain } },
      result,
      explanation.summary
    );
    recordDecisionAuditEntry(auditEntry);

    if (options.persist?.supabase) {
      const { error } = await persistDecisionAuditEntry(options.persist.supabase, auditEntry);
      if (error) {
        throw new Error(
          `Failed to persist platform decision "${auditEntry.executionId}": ${error}`
        );
      }
      await syncDecisionGraphEdges(options.persist.supabase, auditEntry);
    }
  }

  return result;
}
