import type { RuntimePipelineStage } from "../contracts";
import { contextRequestFromExecution } from "../context/context-runtime";
import { toOrganizationalContext } from "../context/context-types";
import { actionRequestFromExecution } from "../action/action-runtime";
import { toRuntimeAction } from "../action/action-result";
import { cognitionRequestFromExecution } from "../cognition/cognitive-runtime";
import { cognitiveResultToBag } from "../cognition/cognition-types";
import { RuntimeContextError, RuntimeError, RuntimeIntentError } from "../errors";
import { experienceRequestFromExecution } from "../experience/experience-runtime";
import { toRuntimeExperience } from "../experience/experience-types";
import { identityRequestFromContext } from "../identity/identity-runtime";
import { intentRequestFromExecution } from "../intent/intent-runtime";
import type { RuntimeRegistry } from "../registry";
import {
  RUNTIME_PIPELINE_STAGE_IDS,
  RUNTIME_PIPELINE_STAGE_ORDER,
  type RuntimePipelineStageId,
} from "../types/stages";

/**
 * No-op / passthrough skeleton stages.
 * Real subsystem logic is registered later by adapters — not in the Kernel.
 */
export function createDefaultPipelineStages(
  registry: RuntimeRegistry
): RuntimePipelineStage[] {
  return RUNTIME_PIPELINE_STAGE_IDS.map((id) =>
    createSkeletonStage(id, registry)
  );
}

function createSkeletonStage(
  id: RuntimePipelineStageId,
  registry: RuntimeRegistry
): RuntimePipelineStage {
  return {
    id,
    order: RUNTIME_PIPELINE_STAGE_ORDER[id],
    optional: isPostExperienceOptional(id),
    async execute(ctx) {
      ctx.throwIfCancelled();

      if (id === "identity") {
        const identityRuntime = registry.getIdentityRuntime();
        if (identityRuntime) {
          const resolved = await identityRuntime.resolveOrThrow(
            identityRequestFromContext(ctx)
          );
          ctx.setIdentity(resolved.identity);
          ctx.state.data.identityScope = resolved.scope;
          ctx.state.data.identityProviderId = resolved.providerId;
        }
        return;
      }

      if (id === "context") {
        const contextRuntime = registry.getContextRuntime();
        if (contextRuntime) {
          const identity = ctx.state.identity;
          if (!identity) {
            throw new RuntimeContextError(
              "Identity required before Context stage",
              { code: "CONTEXT_REQUIRES_IDENTITY" }
            );
          }
          const snapshot = await contextRuntime.resolveOrThrow(
            contextRequestFromExecution(ctx, identity)
          );
          ctx.setOrganizationalContext(toOrganizationalContext(snapshot));
          ctx.state.data.contextSnapshot = snapshot;
        }
        return;
      }

      if (id === "intent") {
        const intentRuntime = registry.getIntentRuntime();
        if (intentRuntime) {
          const identity = ctx.state.identity;
          if (!identity) {
            throw new RuntimeIntentError(
              "Identity required before Intent stage",
              { code: "INTENT_REQUIRES_IDENTITY" }
            );
          }
          const intent = await intentRuntime.resolveOrThrow(
            intentRequestFromExecution(ctx, identity)
          );
          ctx.setIntent(intent);
          ctx.state.data.intentConcurrent = intentRuntime.listConcurrent(
            identity.principalId
          );
        }
        return;
      }

      if (id === "cognition") {
        const cognitiveRuntime = registry.getCognitiveRuntime();
        if (cognitiveRuntime) {
          if (!ctx.state.identity) {
            throw new RuntimeError(
              "Identity required before Cognition stage",
              { code: "COGNITION_REQUIRES_IDENTITY", stageId: "cognition" }
            );
          }
          const result = await cognitiveRuntime.thinkOrThrow(
            cognitionRequestFromExecution(ctx)
          );
          ctx.setCognition(cognitiveResultToBag(result));
          ctx.state.data.cognitiveResult = result;
        }
        return;
      }

      if (id === "experience") {
        const experienceRuntime = registry.getExperienceRuntime();
        if (!experienceRuntime) return;
        if (!ctx.state.identity) {
          throw new RuntimeError(
            "Identity required before Experience stage",
            { code: "EXPERIENCE_REQUIRES_IDENTITY", stageId: "experience" }
          );
        }
        const model = await experienceRuntime.composeOrThrow(
          experienceRequestFromExecution(ctx)
        );
        ctx.setExperience(toRuntimeExperience(model));
        ctx.state.data.experienceModel = model;
        return;
      }

      if (id === "action") {
        const actionRuntime = registry.getActionRuntime();
        const actionId = ctx.state.data.actionId;
        if (typeof actionId !== "string" || !actionRuntime) {
          return;
        }
        const result = await actionRuntime.execute(
          actionRequestFromExecution(ctx, actionId)
        );
        ctx.setAction(toRuntimeAction(result));
        ctx.state.data.actionResult = result;
        ctx.state.data.actionAuditEventId = result.auditEventId;
      }
    },
  };
}

function isPostExperienceOptional(id: RuntimePipelineStageId): boolean {
  return (
    id === "action" ||
    id === "domain" ||
    id === "evidence" ||
    id === "memory" ||
    id === "twin"
  );
}
