import { randomUUID } from "crypto";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { getLoopTransition, OPERATIONAL_LOOP_WORKFLOW_KEY } from "@/lib/platform/operational-loop/registry";
import type {
  LoopSideEffectResult,
  LoopTransitionContext,
  LoopTransitionResult,
  OperationalLoopTransitionKey,
  TransitionSideEffect,
} from "@/lib/platform/operational-loop/types";
import { publishPajEvent } from "@/lib/platform/paj/integration/events";
import { getPajJourneyByStudent } from "@/lib/platform/paj/persistence/records";
import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import { recordEntityWorkflowStateChange } from "@/lib/platform/workflow/engine/execute";
import { getActiveWorkflowInstance } from "@/lib/platform/workflow/persistence/instances";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const SIDE_EFFECT_ORDER: TransitionSideEffect[] = [
  "publish_event",
  "workflow_state",
  "rules_engine",
  "jag_profile",
  "paj_journey",
  "platform_audit",
  "mission_control",
  "executive_intelligence",
];

async function runSideEffect(
  supabase: AuthClient,
  effect: TransitionSideEffect,
  ctx: LoopTransitionContext,
  def: ReturnType<typeof getLoopTransition>,
  attemptId: string,
  fromStage: string | null,
  instanceId?: string
): Promise<LoopSideEffectResult> {
  try {
    switch (effect) {
      case "publish_event": {
        await publishEvent(
          {
            eventType: def.eventType,
            entityType: "student",
            entityId: ctx.studentId,
            organizationId: ctx.organizationId ?? undefined,
            schoolId: ctx.schoolId,
            actorId: ctx.actorUserId ?? undefined,
            payload: {
              transitionKey: ctx.transitionKey,
              fromStage: def.fromStage,
              toStage: def.toStage,
              attemptId,
              relatedEntityType: ctx.relatedEntityType,
              relatedEntityId: ctx.relatedEntityId,
              cycleNumber: ctx.cycleNumber ?? 1,
              ...ctx.facts,
            },
            metadata: ctx.metadata,
          },
          { persist: { supabase }, recordAudit: true }
        );
        return { effect, success: true, detail: def.eventType };
      }

      case "workflow_state": {
        const result = await recordEntityWorkflowStateChange(supabase, {
          workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
          domain: "sis",
          entityType: "student",
          entityId: ctx.studentId,
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId,
          fromStateKey: fromStage,
          toStateKey: def.toStage,
          transitionKey: ctx.transitionKey,
          actorUserId: ctx.actorUserId,
          summary: `${def.label} — operational loop transition`,
          metadata: {
            attemptId,
            operational_loop: true,
            cycleNumber: ctx.cycleNumber ?? 1,
            ...ctx.metadata,
          },
          facts: {
            lastTransitionKey: ctx.transitionKey,
            lastTransitionAt: new Date().toISOString(),
            cycleNumber: ctx.cycleNumber ?? 1,
            ...(ctx.facts ?? {}),
          },
        });
        if (result.error) {
          return { effect, success: false, error: result.error };
        }
        return { effect, success: true, detail: result.instanceId };
      }

      case "rules_engine": {
        const outcomes: string[] = [];
        for (const ruleSetKey of def.ruleSetKeys) {
          try {
            const evaluation = await evaluateRuleSet(
              {
                ruleSetKey,
                facts: {
                  studentId: ctx.studentId,
                  schoolId: ctx.schoolId,
                  transitionKey: ctx.transitionKey,
                  fromStage: def.fromStage,
                  toStage: def.toStage,
                  ...(ctx.facts ?? {}),
                },
                entityType: "student",
                entityId: ctx.studentId,
                schoolId: ctx.schoolId,
                organizationId: ctx.organizationId ?? undefined,
                actorUserId: ctx.actorUserId ?? undefined,
              },
              { persist: { supabase }, publishEvent: { supabase, actorId: ctx.actorUserId ?? undefined } }
            );
            outcomes.push(`${ruleSetKey}:${evaluation.primaryOutcome?.outcomeKey ?? "evaluated"}`);
          } catch (err) {
            outcomes.push(`${ruleSetKey}:skipped`);
          }
        }
        return { effect, success: true, detail: outcomes.join(", ") };
      }

      case "jag_profile": {
        await syncStudentPlatformRelationships(supabase, ctx.studentId);
        return {
          effect,
          success: true,
          detail: `Profile sync — sections: ${def.profileSections.join(", ")}`,
        };
      }

      case "paj_journey": {
        const journey = await getPajJourneyByStudent(supabase, ctx.studentId);
        if (!journey) {
          return { effect, success: true, detail: "No PAJ journey — skipped" };
        }
        const pajEventType =
          ctx.transitionKey === "enrollment_to_scheduling"
            ? "learning.placement.completed"
            : ctx.transitionKey === "evidence_to_progress"
              ? "learning.mastery.updated"
              : ctx.transitionKey === "progress_to_parent_communication"
                ? "learning.competency.advanced"
                : null;
        if (!pajEventType) {
          return { effect, success: true, detail: "No PAJ event mapping — skipped" };
        }
        await publishPajEvent(supabase, {
          eventType: pajEventType,
          journeyId: journey.id,
          studentId: ctx.studentId,
          schoolId: ctx.schoolId,
          organizationId: ctx.organizationId ?? undefined,
          actorUserId: ctx.actorUserId ?? undefined,
          payload: {
            transitionKey: ctx.transitionKey,
            toStage: def.toStage,
            attemptId,
          },
        });
        return { effect, success: true, detail: `${pajEventType}:${journey.id}` };
      }

      case "platform_audit": {
        await writePlatformAudit(supabase, {
          schoolId: ctx.schoolId,
          module: "work",
          entityType: "student",
          entityId: ctx.studentId,
          actionType: "operational_loop_transition",
          summary: `${def.label} completed`,
          workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
          actorUserId: ctx.actorUserId,
          metadata: {
            operational_loop: true,
            attemptId,
            transitionKey: ctx.transitionKey,
            fromStage: def.fromStage,
            toStage: def.toStage,
            instanceId,
            status: "completed",
            sideEffectsPending: false,
            cycleNumber: ctx.cycleNumber ?? 1,
            relatedEntityType: ctx.relatedEntityType,
            relatedEntityId: ctx.relatedEntityId,
            ...ctx.metadata,
          },
          afterState: { stage: def.toStage, transitionKey: ctx.transitionKey },
        });
        return { effect, success: true };
      }

      case "mission_control": {
        await createMissionControlItem(supabase, {
          schoolId: ctx.schoolId,
          module: def.nextWorkModule,
          itemType: def.nextWorkItemType,
          title: def.nextWorkTitle,
          body: `Operational loop advanced to ${def.toStage.replace(/_/g, " ")}`,
          entityType: "student",
          entityId: ctx.studentId,
          href: def.nextWorkHref,
          severity: "normal",
          metadata: {
            operational_loop: true,
            transitionKey: ctx.transitionKey,
            attemptId,
          },
        });
        return { effect, success: true, detail: def.nextWorkHref };
      }

      case "executive_intelligence": {
        await writePlatformAudit(supabase, {
          schoolId: ctx.schoolId,
          module: "executive",
          entityType: "student",
          entityId: ctx.studentId,
          actionType: "operational_loop_intelligence_signal",
          summary: `Loop transition ${ctx.transitionKey} — executive intelligence updated`,
          actorUserId: ctx.actorUserId,
          isSystemEvent: true,
          metadata: {
            operational_loop: true,
            transitionKey: ctx.transitionKey,
            toStage: def.toStage,
            attemptId,
          },
        });
        return { effect, success: true };
      }

      default:
        return { effect, success: false, error: "Unknown side effect" };
    }
  } catch (err) {
    return {
      effect,
      success: false,
      error: err instanceof Error ? err.message : "Side effect failed",
    };
  }
}

async function resolveCurrentStage(
  supabase: AuthClient,
  studentId: string
): Promise<{ stage: string | null; instanceId?: string; cycleNumber: number }> {
  const instance = await getActiveWorkflowInstance(supabase, {
    domain: "sis",
    entityType: "student",
    entityId: studentId,
  });

  if (!instance) {
    return { stage: null, cycleNumber: 1 };
  }

  const facts = (instance.facts ?? {}) as { cycleNumber?: number };
  return {
    stage: instance.current_state_key,
    instanceId: instance.id,
    cycleNumber: facts.cycleNumber ?? 1,
  };
}

async function recordFailedTransition(
  supabase: AuthClient,
  ctx: LoopTransitionContext,
  def: ReturnType<typeof getLoopTransition>,
  attemptId: string,
  sideEffects: LoopSideEffectResult[],
  errors: string[]
) {
  await Promise.all([
    publishEvent(
      {
        eventType: "jag.operational_loop.transition_failed",
        entityType: "student",
        entityId: ctx.studentId,
        schoolId: ctx.schoolId,
        organizationId: ctx.organizationId ?? undefined,
        actorId: ctx.actorUserId ?? undefined,
        payload: { transitionKey: ctx.transitionKey, attemptId, errors },
      },
      { persist: { supabase }, recordAudit: true }
    ).catch(() => undefined),
    writePlatformAudit(supabase, {
      schoolId: ctx.schoolId,
      module: "work",
      entityType: "student",
      entityId: ctx.studentId,
      actionType: "operational_loop_transition_failed",
      summary: `${def.label} failed — recoverable`,
      workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
      actorUserId: ctx.actorUserId,
      metadata: {
        operational_loop: true,
        attemptId,
        transitionKey: ctx.transitionKey,
        status: "failed",
        errors,
        sideEffects,
        recoverable: true,
        ...ctx.metadata,
      },
    }),
    createMissionControlItem(supabase, {
      schoolId: ctx.schoolId,
      module: "mission_control",
      itemType: "failed_automation",
      title: `Operational loop transition failed — ${def.label}`,
      body: errors.join("; ") || "Side effects incomplete",
      entityType: "student",
      entityId: ctx.studentId,
      href: "/dashboard/executive?view=operational-loop",
      severity: "high",
      metadata: { attemptId, transitionKey: ctx.transitionKey, recoverable: true },
    }),
  ]);
}

/**
 * Execute an operational loop transition — coordinates platform side effects
 * without duplicating domain business logic.
 */
export async function executeOperationalLoopTransition(
  supabase: AuthClient,
  input: LoopTransitionContext
): Promise<LoopTransitionResult> {
  const def = getLoopTransition(input.transitionKey);
  const attemptId = randomUUID();
  const { stage: currentStage, cycleNumber: existingCycle } = await resolveCurrentStage(
    supabase,
    input.studentId
  );

  const cycleNumber =
    input.transitionKey === "billing_to_scheduling_cycle"
      ? existingCycle + 1
      : (input.cycleNumber ?? existingCycle);

  const ctx: LoopTransitionContext = { ...input, cycleNumber };
  const sideEffects: LoopSideEffectResult[] = [];
  const errors: string[] = [];

  for (const effect of SIDE_EFFECT_ORDER) {
    const result = await runSideEffect(
      supabase,
      effect,
      ctx,
      def,
      attemptId,
      currentStage,
      undefined
    );
    sideEffects.push(result);
    if (!result.success && result.error) {
      errors.push(`${effect}: ${result.error}`);
    }
  }

  const criticalEffects: TransitionSideEffect[] = ["platform_audit"];
  const criticalFailed = sideEffects.some(
    (s) => criticalEffects.includes(s.effect) && !s.success
  );

  if (criticalFailed || errors.length > 0) {
    await recordFailedTransition(supabase, ctx, def, attemptId, sideEffects, errors);
    return {
      success: false,
      transitionKey: input.transitionKey,
      fromStage: def.fromStage,
      toStage: def.toStage,
      attemptId,
      sideEffects,
      errors,
      recoverable: true,
    };
  }

  return {
    success: true,
    transitionKey: input.transitionKey,
    fromStage: def.fromStage,
    toStage: def.toStage,
    attemptId,
    sideEffects,
    errors: [],
    recoverable: false,
  };
}

/** Fire multiple transitions in sequence (e.g. enrollment handoff). */
export async function executeOperationalLoopTransitionChain(
  supabase: AuthClient,
  transitions: LoopTransitionContext[]
): Promise<LoopTransitionResult[]> {
  const results: LoopTransitionResult[] = [];
  for (const t of transitions) {
    const result = await executeOperationalLoopTransition(supabase, t);
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

export type { OperationalLoopTransitionKey };
