import type { RuntimeEventBus } from "../events";
import {
  ACTION_EVENT_TYPES,
  type ActionDispatchedPayload,
} from "./action-events";
import type { ActionProvider, ActionProviderResult } from "./action-provider";
import type { ActionRegistry } from "./action-registry";
import type { ActionExecutionRequest } from "./action-types";

export class ActionDispatcher {
  constructor(
    private readonly registry: ActionRegistry,
    private readonly listProviders?: () => readonly ActionProvider[],
    private readonly events?: RuntimeEventBus
  ) {}

  findProvider(actionId: string): ActionProvider | undefined {
    const fromLocal = this.registry.findProvider(actionId);
    if (fromLocal) return fromLocal;
    const external = this.listProviders?.() ?? [];
    return [...external]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .find((p) => p.actionIds.includes(actionId));
  }

  async dispatch(
    request: ActionExecutionRequest,
    provider: ActionProvider
  ): Promise<{ providerId: string; result: ActionProviderResult }> {
    if (provider.supports && !provider.supports(request)) {
      return {
        providerId: provider.id,
        result: {
          status: "rejected",
          error: {
            code: "ACTION_PROVIDER_UNSUPPORTED",
            message: `Provider ${provider.id} does not support this request`,
          },
        },
      };
    }

    const payload: ActionDispatchedPayload = {
      actionId: request.actionId,
      providerId: provider.id,
    };
    await this.events?.publish(ACTION_EVENT_TYPES.ACTION_DISPATCHED, payload);

    const result = await provider.execute(request);
    return { providerId: provider.id, result };
  }
}

export function createActionDispatcher(
  registry: ActionRegistry,
  listProviders?: () => readonly ActionProvider[],
  events?: RuntimeEventBus
): ActionDispatcher {
  return new ActionDispatcher(registry, listProviders, events);
}
