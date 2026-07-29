import type { JagRuntime } from "../kernel";
import {
  createContextRuntime,
  type ContextRuntime,
  type ContextRuntimeOptions,
} from "./context-runtime";

export interface InstallContextRuntimeOptions
  extends Omit<ContextRuntimeOptions, "events" | "listProviders"> {
  context?: ContextRuntime;
}

/**
 * Install Context Runtime onto a Kernel instance.
 * Registers the Context pipeline stage (after Identity).
 */
export function installContextRuntime(
  runtime: JagRuntime,
  options: InstallContextRuntimeOptions = {}
): ContextRuntime {
  const context =
    options.context ??
    createContextRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listContextProviders(),
    });

  runtime.registry.setContextRuntime(context);
  runtime.registry.registerPipelineStage(context.createPipelineStage());
  return context;
}
