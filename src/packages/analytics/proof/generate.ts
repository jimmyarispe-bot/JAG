import { EducationIndustryBlueprint } from "@/jag/blueprints";
import {
  compileApplicationModel,
  type ApplicationModelCompileResult,
} from "@/jag/modeling";
import {
  generateRuntimeSpecification,
  type GenerateRuntimeSpecificationResult,
} from "@/jag/runtime-generation";
import { buildAnalyticsProofOrganizationBlueprint } from "@/packages/analytics/proof/organization";
import { createAnalyticsModelCompilerPorts } from "@/packages/analytics/proof/ports";

export function generateAnalyticsProofRuntime(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: EducationIndustryBlueprint,
    organization: buildAnalyticsProofOrganizationBlueprint(),
  });
}

export function compileAnalyticsProofRuntime(
  options: { readonly skipIfRegistered?: boolean } = {}
): ApplicationModelCompileResult & {
  readonly generation: GenerateRuntimeSpecificationResult;
} {
  const generation = generateAnalyticsProofRuntime();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "analytics",
      packageId: "analytics",
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
        message: "Analytics proof generation failed",
      },
    };
  }

  const compiled = compileApplicationModel(generation.specification, {
    ports: createAnalyticsModelCompilerPorts(),
    skipIfRegistered: options.skipIfRegistered ?? false,
  });

  return { ...compiled, generation };
}
