import { publishEvent } from "@/lib/platform/events/publisher/publish";
import type { RuleEvaluationResult } from "@/lib/platform/rules/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface PublishRuleEvaluationEventInput {
  supabase: AuthClient;
  result: RuleEvaluationResult;
  organizationId?: string;
  schoolId?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
}

/** Publish platform.rules.evaluated via the Event Engine after rule evaluation. */
export async function publishRuleEvaluationEvent(
  input: PublishRuleEvaluationEventInput
): Promise<void> {
  const { result } = input;

  await publishEvent(
    {
      eventType: "platform.rules.evaluated",
      entityType: input.entityType ?? "rule_evaluation",
      entityId: input.entityId ?? result.evaluationId,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      actorId: input.actorId,
      payload: {
        evaluationId: result.evaluationId,
        ruleSetKey: result.ruleSetKey,
        domain: result.domain,
        evaluationMode: result.evaluationMode,
        primaryOutcomeKey: result.primaryOutcome?.outcomeKey ?? null,
        matchedRuleCount: result.matchedRules.length,
        summary: result.explanation.summary,
      },
      correlationId: result.evaluationId,
    },
    { persist: { supabase: input.supabase } }
  );
}
