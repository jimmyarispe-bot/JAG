import type { JagRuntime } from "../kernel";
import {
  createActionRuntime,
  type ActionRuntime,
  type ActionRuntimeOptions,
} from "./action-runtime";

export interface InstallActionRuntimeOptions
  extends Omit<ActionRuntimeOptions, "events" | "listProviders"> {
  action?: ActionRuntime;
}

/**
 * Install Action Runtime onto a Kernel instance.
 * Registers the Action pipeline stage (after Experience).
 */
export function installActionRuntime(
  runtime: JagRuntime,
  options: InstallActionRuntimeOptions = {}
): ActionRuntime {
  const action =
    options.action ??
    createActionRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listActionContributors(),
    });

  runtime.registry.setActionRuntime(action);
  runtime.registry.registerPipelineStage(action.createPipelineStage());
  return action;
}
