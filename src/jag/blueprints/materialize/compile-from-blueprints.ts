/**
 * Materialize blueprints then compile the Runtime Specification.
 */

import type {
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import { materializeBlueprints } from "@/jag/blueprints/materialize/materialize-blueprints";
import {
  compileApplicationModel,
  type ApplicationModelCompileResult,
  type CompileApplicationModelOptions,
} from "@/jag/modeling";

export type CompileFromBlueprintsOptions = CompileApplicationModelOptions;

export type CompileFromBlueprintsResult = ApplicationModelCompileResult & {
  readonly industryId: string;
  readonly organizationId: string;
};

export function compileFromBlueprints(
  industry: IndustryBlueprint,
  organization: OrganizationBlueprint,
  options: CompileFromBlueprintsOptions = {}
): CompileFromBlueprintsResult {
  const materialized = materializeBlueprints(industry, organization);
  if (!materialized.ok || !materialized.specification) {
    return {
      ok: false,
      applicationId: organization.applicationId,
      packageId: organization.packageId,
      version: organization.version,
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
      industryId: industry.id,
      organizationId: organization.id,
      error: materialized.error ?? {
        code: "materialize_failed",
        message: "Failed to materialize runtime specification",
      },
    };
  }

  const compiled = compileApplicationModel(
    materialized.specification,
    options
  );
  return {
    ...compiled,
    industryId: industry.id,
    organizationId: organization.id,
  };
}
