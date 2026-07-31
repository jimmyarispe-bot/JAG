/**
 * Healthcare Runtime Generation + compile path.
 * No handwritten registrations — foundation packs + industry/org blueprints only.
 */

import { HealthcareIndustryBlueprint } from "@/jag/blueprints";
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
import { buildRegionalHealthOrganizationBlueprint } from "@/packages/healthcare/blueprints/regional-health.organization";

export type CompileRegionalHealthFromBlueprintsOptions = {
  readonly skipIfRegistered?: boolean;
};

export type CompileRegionalHealthFromGenerationResult =
  ApplicationModelCompileResult & {
    readonly industryId: string;
    readonly organizationId: string;
    readonly generation?: GenerateRuntimeSpecificationResult;
  };

export function materializeRegionalHealthRuntimeSpecification(): MaterializeBlueprintsResult {
  const generated = generateRuntimeSpecification({
    industry: HealthcareIndustryBlueprint,
    organization: buildRegionalHealthOrganizationBlueprint(),
  });
  return {
    ok: generated.ok,
    specification: generated.specification,
    industryId: generated.industryId,
    organizationId: generated.organizationId,
    error: generated.error,
  };
}

export function generateRegionalHealthRuntimeSpecification(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: HealthcareIndustryBlueprint,
    organization: buildRegionalHealthOrganizationBlueprint(),
  });
}

/**
 * Full pipeline: Healthcare + Regional Health → Runtime Generation → Compiler.
 */
export function compileRegionalHealthFromBlueprints(
  options: CompileRegionalHealthFromBlueprintsOptions = {}
): CompileRegionalHealthFromGenerationResult {
  const generation = generateRegionalHealthRuntimeSpecification();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "regional-health",
      packageId: "healthcare",
      version: buildRegionalHealthOrganizationBlueprint().version,
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
