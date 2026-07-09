import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import { resolveWorkflowContext } from "@/lib/platform/hierarchy/query/lookup";
import { resolveParameterDefaults } from "@/lib/platform/hierarchy/references/resolve";
import type {
  ExecuteHierarchyCapabilityInput,
  HierarchyExecutionResult,
  HierarchyPipelineStepId,
  HierarchyPipelineStepResult,
} from "@/lib/platform/hierarchy/types";
import { HIERARCHY_PIPELINE_STEP_IDS } from "@/lib/platform/hierarchy/types";

function step(
  stepId: HierarchyPipelineStepId,
  status: HierarchyPipelineStepResult["status"],
  detail?: string,
  data?: Record<string, unknown>
): HierarchyPipelineStepResult {
  return { stepId, status, detail, data };
}

/**
 * Execute a capability through the JAG Hierarchy pipeline.
 * Delegates to Rules Engine — does not duplicate PAJ or other runtime logic.
 */
export async function executeHierarchyCapability(
  input: ExecuteHierarchyCapabilityInput
): Promise<HierarchyExecutionResult> {
  const steps: HierarchyPipelineStepResult[] = [];
  const errors: string[] = [];
  const ruleEvaluationIds: string[] = [];

  const context = resolveWorkflowContext(input.capabilityKey);
  if (!context) {
    return {
      capabilityKey: input.capabilityKey,
      workflowContext: null as unknown as HierarchyExecutionResult["workflowContext"],
      steps: [step("read-hierarchy", "error", `Unknown capability "${input.capabilityKey}"`)],
      ok: false,
      errors: [`Unknown capability "${input.capabilityKey}"`],
    };
  }

  steps.push(
    step("read-hierarchy", "complete", `${context.resolvedNodes.length} nodes resolved`, {
      nodeKeys: context.resolvedNodes.map((n) => n.nodeKey),
    })
  );

  const { governance } = context;

  steps.push(
    step(
      "load-standard",
      governance.standard ? "complete" : "error",
      governance.standard?.title,
      governance.standard ? { nodeKey: governance.standard.nodeKey } : undefined
    )
  );
  steps.push(
    step(
      "load-protocol",
      governance.protocol ? "complete" : "error",
      governance.protocol?.title,
      governance.protocol ? { nodeKey: governance.protocol.nodeKey } : undefined
    )
  );
  steps.push(
    step(
      "load-process",
      governance.process ? "complete" : "error",
      governance.process?.title,
      governance.process ? { nodeKey: governance.process.nodeKey } : undefined
    )
  );
  steps.push(
    step(
      "load-procedure",
      governance.procedure ? "complete" : "error",
      governance.procedure?.title,
      governance.procedure ? { nodeKey: governance.procedure.nodeKey } : undefined
    )
  );

  if (!governance.standard || !governance.protocol || !governance.process || !governance.procedure) {
    errors.push("Incomplete governance chain for capability");
  }

  let rulesStatus: HierarchyPipelineStepResult["status"] = context.ruleSetKeys.length ? "complete" : "skipped";
  let rulesDetail = context.ruleSetKeys.length
    ? `${context.ruleSetKeys.length} rule set(s) evaluated`
    : "No rule sets bound";

  if (context.ruleSetKeys.length && input.facts) {
    for (const ruleSetKey of context.ruleSetKeys) {
      try {
        const result = await evaluateRuleSet({
          ruleSetKey,
          facts: input.facts,
          organizationId: input.organizationId,
          schoolId: input.schoolId,
          entityType: input.entityType,
          entityId: input.entityId,
          actorUserId: input.actorUserId,
        });
        ruleEvaluationIds.push(result.evaluationId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(message);
        rulesStatus = "error";
        rulesDetail = message;
      }
    }
  } else if (context.ruleSetKeys.length) {
    rulesStatus = "skipped";
    rulesDetail = "No facts supplied for rule evaluation";
  }

  steps.push(step("evaluate-rules", rulesStatus, rulesDetail, { ruleSetKeys: context.ruleSetKeys }));

  const defaults = resolveParameterDefaults(context.parameterKeys, context.resolvedNodes);
  const parameters = { ...defaults, ...input.parameters };
  steps.push(
    step("read-parameters", "complete", `${Object.keys(parameters).length} parameter(s)`, { parameters })
  );

  steps.push(
    step("execute", "complete", context.workflowKey ? `Workflow ${context.workflowKey}` : "Capability ready", {
      workflowKey: context.workflowKey,
      automationKey: context.automationKey,
      eventType: context.eventType,
    })
  );

  steps.push(
    step("collect-evidence", "complete", `${context.evidenceTypeKeys.length} evidence type(s) configured`, {
      evidenceTypeKeys: context.evidenceTypeKeys,
    })
  );

  steps.push(
    step("update-knowledge", "complete", `${context.knowledgeAssetKeys.length} knowledge asset(s) referenced`, {
      knowledgeAssetKeys: context.knowledgeAssetKeys,
    })
  );

  steps.push(
    step("recommend-improvements", "complete", `${context.intelligenceServiceKeys.length} intelligence service(s)`, {
      intelligenceServiceKeys: context.intelligenceServiceKeys,
      decisionTypeKey: context.decisionTypeKey,
    })
  );

  steps.push(step("done", errors.length ? "error" : "complete", "Pipeline complete"));

  return {
    capabilityKey: input.capabilityKey,
    workflowContext: context,
    steps,
    ruleEvaluationIds: ruleEvaluationIds.length ? ruleEvaluationIds : undefined,
    ok: errors.length === 0,
    errors,
  };
}

export { HIERARCHY_PIPELINE_STEP_IDS };
