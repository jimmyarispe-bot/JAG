/**
 * Government Runtime Generation + compile path.
 * No handwritten registrations — foundation packs + industry/org blueprints only.
 */

import { GovernmentIndustryBlueprint } from "@/jag/blueprints";
import type { MaterializeBlueprintsResult } from "@/jag/blueprints";
import {
  compileApplicationModel,
  type ApplicationModelCompileResult,
  type CompileApplicationModelOptions,
} from "@/jag/modeling";
import {
  generateRuntimeSpecification,
  type GenerateRuntimeSpecificationResult,
} from "@/jag/runtime-generation";
import { buildCityGovernmentOrganizationBlueprint } from "@/packages/government/blueprints/city-government.organization";

export type CompileCityGovernmentFromBlueprintsOptions = {
  readonly skipIfRegistered?: boolean;
};

export type CompileCityGovernmentFromGenerationResult =
  ApplicationModelCompileResult & {
    readonly industryId: string;
    readonly organizationId: string;
    readonly generation?: GenerateRuntimeSpecificationResult;
  };

export function materializeCityGovernmentRuntimeSpecification(): MaterializeBlueprintsResult {
  const generated = generateRuntimeSpecification({
    industry: GovernmentIndustryBlueprint,
    organization: buildCityGovernmentOrganizationBlueprint(),
  });
  return {
    ok: generated.ok,
    specification: generated.specification,
    industryId: generated.industryId,
    organizationId: generated.organizationId,
    error: generated.error,
  };
}

export function generateCityGovernmentRuntimeSpecification(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: GovernmentIndustryBlueprint,
    organization: buildCityGovernmentOrganizationBlueprint(),
  });
}

/**
 * Full pipeline: Government + City Government → Runtime Generation → Compiler.
 */
export function compileCityGovernmentFromBlueprints(
  options: CompileCityGovernmentFromBlueprintsOptions = {}
): CompileCityGovernmentFromGenerationResult {
  const generation = generateCityGovernmentRuntimeSpecification();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "city-government",
      packageId: "government",
      version: buildCityGovernmentOrganizationBlueprint().version,
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
      industryId: generation.industryId,
      organizationId: generation.organizationId,
      generation,
      error: generation.error ?? {
        code: "generation_failed",
        message: "Runtime Generation failed",
      },
    };
  }

  const compileOptions: CompileApplicationModelOptions = {
    skipIfRegistered: options.skipIfRegistered ?? false,
  };
  const compiled = compileApplicationModel(
    generation.specification,
    compileOptions
  );
  return {
    ...compiled,
    industryId: generation.industryId,
    organizationId: generation.organizationId,
    generation,
  };
}
