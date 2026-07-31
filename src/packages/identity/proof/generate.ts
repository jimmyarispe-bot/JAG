/**
 * Identity pack proof — Runtime Generation → Compiler (no handwritten registrations).
 */

import { EducationIndustryBlueprint } from "@/jag/blueprints";
import {
  compileApplicationModel,
  type ApplicationModelCompileResult,
} from "@/jag/modeling";
import {
  generateRuntimeSpecification,
  type GenerateRuntimeSpecificationResult,
} from "@/jag/runtime-generation";
import { buildIdentityProofOrganizationBlueprint } from "@/packages/identity/proof/organization";
import { createIdentityModelCompilerPorts } from "@/packages/identity/proof/ports";

export function generateIdentityProofRuntime(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: EducationIndustryBlueprint,
    organization: buildIdentityProofOrganizationBlueprint(),
  });
}

export function compileIdentityProofRuntime(
  options: { readonly skipIfRegistered?: boolean } = {}
): ApplicationModelCompileResult & {
  readonly generation: GenerateRuntimeSpecificationResult;
} {
  const generation = generateIdentityProofRuntime();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "identity",
      packageId: "identity",
      version: "1.0.0",
      contributions: Object.freeze([]),
      counts: Object.freeze({
        entities: 0,
        forms: 0,
        workflows: 0,
        processes: 0,
        decisions: 0,
        documents: 0,
        communications: 0,
        permissions: 0,
        reports: 0,
        navigation: 0,
        terminology: 0,
        localization: 0,
      }),
      generation,
      error: generation.error ?? {
        code: "generation_failed",
        message: "Identity proof generation failed",
      },
    };
  }

  const compiled = compileApplicationModel(generation.specification, {
    ports: createIdentityModelCompilerPorts(),
    skipIfRegistered: options.skipIfRegistered ?? false,
  });

  return { ...compiled, generation };
}
