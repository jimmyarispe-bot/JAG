import type { JagRuntime } from "../kernel";
import {
  createExperienceRuntime,
  type ExperienceRuntime,
  type ExperienceRuntimeOptions,
} from "./experience-runtime";

export interface InstallExperienceRuntimeOptions
  extends Omit<ExperienceRuntimeOptions, "events" | "listProviders"> {
  experience?: ExperienceRuntime;
}

/**
 * Install Experience Runtime onto a Kernel instance.
 * Registers the Experience pipeline stage (after Intent / Cognition).
 */
export function installExperienceRuntime(
  runtime: JagRuntime,
  options: InstallExperienceRuntimeOptions = {}
): ExperienceRuntime {
  const experience =
    options.experience ??
    createExperienceRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listExperienceContributors(),
    });

  runtime.registry.setExperienceRuntime(experience);
  runtime.registry.registerPipelineStage(experience.createPipelineStage());
  return experience;
}
