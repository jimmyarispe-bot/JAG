import type {
  RuntimeContext,
  RuntimeExperience,
  RuntimePipelineStage,
} from "../contracts";
import {
  RuntimeCancellationError,
  RuntimeError,
} from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import {
  createExperienceComposer,
  type ExperienceComposer,
} from "./experience-composer";
import {
  EXPERIENCE_EVENT_TYPES,
  type BriefingGeneratedPayload,
  type ExperienceComposedPayload,
  type ExperienceCompositionFailedPayload,
  type NextActionsGeneratedPayload,
} from "./experience-events";
import type { ExperienceProvider } from "./experience-provider";
import {
  createExperienceRegistry,
  type ExperienceRegistry,
} from "./experience-registry";
import type { ExperienceWidgetRegistration } from "./experience-widget";
import {
  toRuntimeExperience,
  type ExperienceCompositionOutcome,
  type ExperienceCompositionRequest,
  type ExperienceModel,
} from "./experience-types";

export interface ExperienceRuntimeOptions {
  events?: RuntimeEventBus;
  registry?: ExperienceRegistry;
  listProviders?: () => readonly ExperienceProvider[];
  composer?: ExperienceComposer;
}

export interface ExperienceRuntime {
  readonly registry: ExperienceRegistry;
  compose(
    request: ExperienceCompositionRequest
  ): Promise<ExperienceCompositionOutcome>;
  composeOrThrow(
    request: ExperienceCompositionRequest
  ): Promise<ExperienceModel>;
  registerWidget(widget: ExperienceWidgetRegistration): void;
  registerProvider(provider: ExperienceProvider): void;
  toRuntimeExperience(model: ExperienceModel): RuntimeExperience;
  createPipelineStage(): RuntimePipelineStage;
}

export function createExperienceRuntime(
  options: ExperienceRuntimeOptions = {}
): ExperienceRuntime {
  return new ExperienceRuntimeImpl(options);
}

class ExperienceRuntimeImpl implements ExperienceRuntime {
  readonly registry: ExperienceRegistry;
  private readonly events?: RuntimeEventBus;
  private readonly listProviders?: () => readonly ExperienceProvider[];
  private readonly composer: ExperienceComposer;

  constructor(options: ExperienceRuntimeOptions) {
    this.events = options.events;
    this.registry =
      options.registry ?? createExperienceRegistry({ events: options.events });
    this.listProviders = options.listProviders;
    this.composer = options.composer ?? createExperienceComposer();
  }

  registerWidget(widget: ExperienceWidgetRegistration): void {
    this.registry.registerWidget(widget);
  }

  registerProvider(provider: ExperienceProvider): void {
    this.registry.registerProvider(provider);
  }

  toRuntimeExperience(model: ExperienceModel): RuntimeExperience {
    return toRuntimeExperience(model);
  }

  async compose(
    request: ExperienceCompositionRequest
  ): Promise<ExperienceCompositionOutcome> {
    try {
      if (request.signal?.aborted) {
        throw new RuntimeCancellationError();
      }

      const model = await this.composer.compose(
        request,
        this.registry,
        this.listProviders?.() ?? []
      );

      const composedPayload: ExperienceComposedPayload = {
        workspaceId: model.workspaceId,
        contextId: model.contextId,
        widgetCount: model.widgets.length,
        renderTarget: model.renderTarget,
      };
      await this.events?.publish(
        EXPERIENCE_EVENT_TYPES.EXPERIENCE_COMPOSED,
        composedPayload,
        {
          correlationId: request.correlationId,
          sessionId: request.sessionId,
          organizationId: request.identity.activeOrganizationId,
          actorUserId: request.identity.principalId,
          effectiveUserId: request.identity.effectiveUserId,
        }
      );

      if (model.briefing) {
        const briefingPayload: BriefingGeneratedPayload = {
          briefingId: model.briefing.briefingId,
          priorityCount: model.briefing.priorities.length,
          unknownGapCount: model.briefing.unknownGaps.length,
        };
        await this.events?.publish(
          EXPERIENCE_EVENT_TYPES.BRIEFING_GENERATED,
          briefingPayload
        );
      }

      const nextPayload: NextActionsGeneratedPayload = {
        actionIds: model.nextActions.map((a) => a.actionId),
      };
      await this.events?.publish(
        EXPERIENCE_EVENT_TYPES.NEXT_ACTIONS_GENERATED,
        nextPayload
      );

      if (model.widgets.length === 0 && !model.briefing?.summary) {
        return {
          status: "empty",
          value: model,
          reason: "No widgets or briefing content",
        };
      }
      return { status: "composed", value: model };
    } catch (error) {
      if (error instanceof RuntimeCancellationError) throw error;
      const reason =
        error instanceof Error
          ? error.message
          : "Experience composition failed";
      const code =
        error instanceof RuntimeError
          ? error.code
          : "EXPERIENCE_COMPOSITION_FAILED";
      const payload: ExperienceCompositionFailedPayload = { reason, code };
      await this.events?.publish(
        EXPERIENCE_EVENT_TYPES.EXPERIENCE_COMPOSITION_FAILED,
        payload
      );
      throw error;
    }
  }

  async composeOrThrow(
    request: ExperienceCompositionRequest
  ): Promise<ExperienceModel> {
    const outcome = await this.compose(request);
    return outcome.value;
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "experience",
      order: RUNTIME_PIPELINE_STAGE_ORDER.experience,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const identity = ctx.state.identity;
        if (!identity) {
          throw new RuntimeError(
            "Identity required before Experience stage",
            { code: "EXPERIENCE_REQUIRES_IDENTITY", stageId: "experience" }
          );
        }
        const request = experienceRequestFromExecution(ctx);
        const model = await this.composeOrThrow(request);
        ctx.setExperience(toRuntimeExperience(model));
        ctx.state.data.experienceModel = model;
      },
    };
  }
}

export function experienceRequestFromExecution(
  ctx: RuntimeContext
): ExperienceCompositionRequest {
  const identity = ctx.state.identity;
  if (!identity) {
    throw new RuntimeError("Identity required for experience composition", {
      code: "EXPERIENCE_REQUIRES_IDENTITY",
      stageId: "experience",
    });
  }

  const data = ctx.state.data;
  const personalization =
    data.experiencePersonalization &&
    typeof data.experiencePersonalization === "object"
      ? (data.experiencePersonalization as ExperienceCompositionRequest["personalization"])
      : undefined;

  const renderTarget =
    typeof data.renderTarget === "string"
      ? (data.renderTarget as ExperienceCompositionRequest["renderTarget"])
      : undefined;

  return {
    identity,
    organizationalContext: ctx.state.organizationalContext,
    intent: ctx.state.intent,
    cognition: ctx.state.cognition,
    personalization,
    renderTarget,
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  };
}
