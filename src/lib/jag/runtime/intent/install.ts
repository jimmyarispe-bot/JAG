import type { JagRuntime } from "../kernel";
import {
  createIntentRuntime,
  type IntentRuntime,
  type IntentRuntimeOptions,
} from "./intent-runtime";

export interface InstallIntentRuntimeOptions
  extends Omit<IntentRuntimeOptions, "events" | "listProviders"> {
  intent?: IntentRuntime;
}

/**
 * Install Intent Runtime onto a Kernel instance.
 * Registers the Intent pipeline stage (after Context).
 */
export function installIntentRuntime(
  runtime: JagRuntime,
  options: InstallIntentRuntimeOptions = {}
): IntentRuntime {
  const intent =
    options.intent ??
    createIntentRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listIntentProviders(),
    });

  runtime.registry.setIntentRuntime(intent);
  runtime.registry.registerPipelineStage(intent.createPipelineStage());
  return intent;
}
