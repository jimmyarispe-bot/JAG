/**
 * Manufacturing Runtime Generation + compile path.
 * No handwritten registrations — foundation packs + industry/org blueprints only.
 */

import { ManufacturingIndustryBlueprint } from "@/jag/blueprints";
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
import { buildAdvancedManufacturingOrganizationBlueprint } from "@/packages/manufacturing/blueprints/advanced-manufacturing.organization";

export type CompileAdvancedManufacturingFromBlueprintsOptions = {
  readonly skipIfRegistered?: boolean;
};

export type CompileAdvancedManufacturingFromGenerationResult =
  ApplicationModelCompileResult & {
    readonly industryId: string;
    readonly organizationId: string;
    readonly generation?: GenerateRuntimeSpecificationResult;
  };

export function materializeAdvancedManufacturingRuntimeSpecification(): MaterializeBlueprintsResult {
  const generated = generateRuntimeSpecification({
    industry: ManufacturingIndustryBlueprint,
    organization: buildAdvancedManufacturingOrganizationBlueprint(),
  });
  return {
    ok: generated.ok,
    specification: generated.specification,
    industryId: generated.industryId,
    organizationId: generated.organizationId,
    error: generated.error,
  };
}

export function generateAdvancedManufacturingRuntimeSpecification(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: ManufacturingIndustryBlueprint,
    organization: buildAdvancedManufacturingOrganizationBlueprint(),
  });
}

/**
 * Full pipeline: Manufacturing + Advanced Manufacturing → Runtime Generation → Compiler.
 */
export function compileAdvancedManufacturingFromBlueprints(
  options: CompileAdvancedManufacturingFromBlueprintsOptions = {}
): CompileAdvancedManufacturingFromGenerationResult {
  const generation = generateAdvancedManufacturingRuntimeSpecification();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "advanced-manufacturing",
      packageId: "manufacturing",
      version: buildAdvancedManufacturingOrganizationBlueprint().version,
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
