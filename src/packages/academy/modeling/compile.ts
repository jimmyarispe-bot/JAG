/**
 * Compile the Academy ApplicationModel through the JAG Modeling Engine.
 */

import {
  compileApplicationModel,
  type ApplicationModelCompileResult,
} from "@/jag/modeling";
import { buildAcademyApplicationModel } from "@/packages/academy/modeling/academy.application";
import {
  createAcademyModelCompilerPorts,
  finalizeAcademyModelCompilePorts,
} from "@/packages/academy/modeling/ports";

export type CompileAcademyApplicationOptions = {
  readonly skipIfRegistered?: boolean;
};

/**
 * Compile Academy model → package registrations via universal compiler + Academy ports.
 */
export function compileAcademyApplication(
  options: CompileAcademyApplicationOptions = {}
): ApplicationModelCompileResult {
  const model = buildAcademyApplicationModel();
  const ports = createAcademyModelCompilerPorts();
  const result = compileApplicationModel(model, {
    ports,
    skipIfRegistered: options.skipIfRegistered ?? false,
  });
  if (result.ok) {
    finalizeAcademyModelCompilePorts();
  }
  return result;
}
