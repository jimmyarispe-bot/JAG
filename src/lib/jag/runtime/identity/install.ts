import type { JagRuntime } from "../kernel";
import {
  createIdentityRuntime,
  type IdentityRuntime,
  type IdentityRuntimeOptions,
} from "./identity-runtime";

export interface InstallIdentityRuntimeOptions
  extends Omit<IdentityRuntimeOptions, "events" | "listProviders"> {
  /** Existing identity runtime; created when omitted. */
  identity?: IdentityRuntime;
}

/**
 * Install Identity Runtime onto a Kernel instance:
 * - wires providers from RuntimeRegistry
 * - registers the Identity pipeline stage
 */
export function installIdentityRuntime(
  runtime: JagRuntime,
  options: InstallIdentityRuntimeOptions = {}
): IdentityRuntime {
  const identity =
    options.identity ??
    createIdentityRuntime({
      ...options,
      events: runtime.events,
      listProviders: () => runtime.registry.listIdentityProviders(),
    });

  runtime.registry.setIdentityRuntime(identity);
  runtime.registry.registerPipelineStage(identity.createPipelineStage());
  return identity;
}
