import type { JagRuntime } from "../kernel";
import {
  createCognitiveRuntime,
  type CognitiveRuntime,
  type CognitiveRuntimeOptions,
} from "./cognitive-runtime";

export interface InstallCognitiveRuntimeOptions
  extends Omit<CognitiveRuntimeOptions, "events" | "listProviders"> {
  cognition?: CognitiveRuntime;
}

/**
 * Install Cognitive Runtime onto a Kernel instance.
 * Registers the Cognition pipeline stage (after Intent, before Experience).
 */
export function installCognitiveRuntime(
  runtime: JagRuntime,
  options: InstallCognitiveRuntimeOptions = {}
): CognitiveRuntime {
  const cognition =
    options.cognition ??
    createCognitiveRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listCognitiveProviders(),
    });

  runtime.registry.setCognitiveRuntime(cognition);
  runtime.registry.registerPipelineStage(cognition.createPipelineStage());
  return cognition;
}
