/**
 * Runtime Generation Engine — main entry.
 *
 * Industry Blueprint + Organization Blueprint (+ capability packs)
 * → plan → resolve → validate → Runtime Specification (+ optional diff)
 */

import type { GenerateRuntimeSpecificationInput } from "@/jag/runtime-generation/contracts";
import type { GenerateRuntimeSpecificationResult } from "@/jag/runtime-generation/contracts";
import { diffRuntimeSpecifications } from "@/jag/runtime-generation/diff";
import { generateSpecificationFromResolved } from "@/jag/runtime-generation/generator";
import { planRuntimeGeneration, selectCapabilityPacks } from "@/jag/runtime-generation/planner";
import { resolveRuntimeModel } from "@/jag/runtime-generation/resolver";
import {
  validateGenerationInputs,
  validateResolvedModel,
} from "@/jag/runtime-generation/validation";

export function generateRuntimeSpecification(
  input: GenerateRuntimeSpecificationInput
): GenerateRuntimeSpecificationResult {
  const { industry, organization, capabilityPacks, previousSpecification } =
    input;

  const enabledModules = [
    ...(organization.enabledModules ?? industry.modules ?? []),
  ].filter((m) => !(organization.disabledModules ?? []).includes(m));

  const packsForValidation = selectCapabilityPacks(
    organization,
    capabilityPacks,
    enabledModules
  );

  const inputValidation = validateGenerationInputs(
    industry,
    organization,
    packsForValidation
  );
  if (!inputValidation.ok) {
    return {
      ok: false,
      industryId: industry.id,
      organizationId: organization.id,
      diagnostics: inputValidation.diagnostics,
      error: {
        code: "generation_validation_failed",
        message: inputValidation.diagnostics
          .filter((d) => d.severity === "error")
          .map((d) => d.message)
          .join("; "),
      },
    };
  }

  const plan = planRuntimeGeneration(
    industry,
    organization,
    capabilityPacks
  );

  const resolved = resolveRuntimeModel(
    industry,
    organization,
    plan,
    capabilityPacks
  );

  const resolvedValidation = validateResolvedModel(resolved, plan);
  const diagnostics = Object.freeze([
    ...inputValidation.diagnostics,
    ...resolvedValidation.diagnostics,
  ]);

  if (!resolvedValidation.ok) {
    return {
      ok: false,
      plan,
      resolved,
      industryId: industry.id,
      organizationId: organization.id,
      diagnostics,
      error: {
        code: "resolved_model_invalid",
        message: resolvedValidation.diagnostics
          .filter((d) => d.severity === "error")
          .map((d) => d.message)
          .join("; "),
      },
    };
  }

  const specification = generateSpecificationFromResolved(resolved);
  const diff = diffRuntimeSpecifications(
    previousSpecification,
    specification
  );

  return {
    ok: true,
    plan,
    resolved,
    specification,
    diff,
    industryId: industry.id,
    organizationId: organization.id,
    diagnostics,
  };
}
