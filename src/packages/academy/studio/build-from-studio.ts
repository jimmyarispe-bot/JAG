/**
 * Build Academy Organization Blueprint via Organization Studio,
 * then attach Education foundation packs + Academy vertical pack.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
  educationIndustryCatalogPayload,
} from "@/jag/blueprints";
import { produceOrganizationBlueprint } from "@/jag/studio";
import { buildAcademyCapabilityPacks } from "@/packages/academy/capability-packs";
import { buildEducationFoundationCapabilityPacks } from "@/packages/academy/composition";
import { describeAcademyOrganization } from "@/packages/academy/studio/describe-academy";

/**
 * Studio answers → Organization Blueprint + foundation packs + Academy pack.
 * Runtime Generation expands packs into the Runtime Specification.
 */
export function buildAcademyOrganizationBlueprintFromStudio(): OrganizationBlueprint {
  const answers = describeAcademyOrganization();
  const produced = produceOrganizationBlueprint(
    EducationIndustryBlueprint,
    answers
  );
  if (!produced.ok || !produced.organization) {
    throw new Error(
      produced.error?.message ??
        "Failed to produce Academy organization blueprint from Studio"
    );
  }

  const foundationPacks = buildEducationFoundationCapabilityPacks();
  const academyPacks = buildAcademyCapabilityPacks();
  const packs = Object.freeze([...foundationPacks, ...academyPacks]);
  const packEntityTypes = new Set(
    packs.flatMap((p) => (p.entities ?? []).map((e) => e.entityType))
  );
  const studio = produced.organization;

  return Object.freeze({
    ...studio,
    displayName: "Academy",
    description:
      "Reference education application — Organization answers + branding over Education Blueprint + foundation Capability Packs.",
    publisher: "JAG",
    capabilityPacks: packs,
    integrations: Object.freeze([]),
    terminology: undefined,
    disableEntityTypes: Object.freeze(
      EDUCATION_INDUSTRY_ENTITIES.map((e) => e.entityType).filter(
        (t) => !packEntityTypes.has(t)
      )
    ),
    disablePermissionIds: Object.freeze(
      (EducationIndustryBlueprint.permissions ?? []).map((p) => p.id)
    ),
    disableReportIds: Object.freeze(
      (EducationIndustryBlueprint.reports ?? []).map((r) => r.id)
    ),
    disableTerminologyIds: Object.freeze([
      ...(EducationIndustryBlueprint.terminology ?? []).map((t) => t.id),
      ...(studio.terminology ?? []).map((t) => t.id),
    ]),
    disableIntegrationIds: Object.freeze(
      (EducationIndustryBlueprint.integrations ?? []).map((i) => i.id)
    ),
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(studio.configuration?.keys ?? {}),
        organization: "academy",
        brand: "The Academy Way",
        educationCatalogs: educationIndustryCatalogPayload(),
        compositionSource: "education-blueprint-v2",
      }),
    }),
  });
}
