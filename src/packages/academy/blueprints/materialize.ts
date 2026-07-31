/**
 * Academy Runtime Generation + compile path.
 */

import { EducationIndustryBlueprint } from "@/jag/blueprints";
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
import { buildAcademyOrganizationBlueprint } from "@/packages/academy/blueprints/academy.organization";
import {
  createAcademyModelCompilerPorts,
  finalizeAcademyModelCompilePorts,
} from "@/packages/academy/modeling/ports";

export type CompileAcademyFromBlueprintsOptions = {
  readonly skipIfRegistered?: boolean;
};

export type CompileAcademyFromGenerationResult = ApplicationModelCompileResult & {
  readonly industryId: string;
  readonly organizationId: string;
  readonly generation?: GenerateRuntimeSpecificationResult;
};

/**
 * Generate Academy Runtime Specification from Education + Academy org blueprints.
 */
export function materializeAcademyRuntimeSpecification(): MaterializeBlueprintsResult {
  const generated = generateRuntimeSpecification({
    industry: EducationIndustryBlueprint,
    organization: buildAcademyOrganizationBlueprint(),
  });
  return {
    ok: generated.ok,
    specification: generated.specification,
    industryId: generated.industryId,
    organizationId: generated.organizationId,
    error: generated.error,
  };
}

export function generateAcademyRuntimeSpecification(): GenerateRuntimeSpecificationResult {
  return generateRuntimeSpecification({
    industry: EducationIndustryBlueprint,
    organization: buildAcademyOrganizationBlueprint(),
  });
}

/**
 * Full pipeline: Industry + Org blueprints → Runtime Generation → Compiler.
 */
export function compileAcademyFromBlueprints(
  options: CompileAcademyFromBlueprintsOptions = {}
): CompileAcademyFromGenerationResult {
  const generation = generateAcademyRuntimeSpecification();
  if (!generation.ok || !generation.specification) {
    return {
      ok: false,
      applicationId: "academyos",
      packageId: "academy",
      version: buildAcademyOrganizationBlueprint().version,
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

  const ports = createAcademyModelCompilerPorts();
  const compileOptions: CompileApplicationModelOptions = {
    ports,
    skipIfRegistered: options.skipIfRegistered ?? false,
  };
  const compiled = compileApplicationModel(
    generation.specification,
    compileOptions
  );
  if (compiled.ok) {
    finalizeAcademyModelCompilePorts();
  }
  return {
    ...compiled,
    industryId: generation.industryId,
    organizationId: generation.organizationId,
    generation,
  };
}
