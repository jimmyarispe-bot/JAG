/**
 * Build Regional Health Organization Blueprint via Organization Studio,
 * then attach Healthcare foundation Capability Packs only.
 *
 * No handwritten industry registrations. No healthcare.core vertical pack.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  HealthcareIndustryBlueprint,
  healthcareIndustryCatalogPayload,
} from "@/jag/blueprints";
import { produceOrganizationBlueprint } from "@/jag/studio";
import { buildHealthcareFoundationCapabilityPacks } from "@/packages/healthcare/composition";
import { describeRegionalHealthOrganization } from "@/packages/healthcare/studio/describe-regional-health";

/**
 * Studio answers → Organization Blueprint + foundation packs.
 * Runtime Generation expands packs into the Runtime Specification.
 */
export function buildRegionalHealthOrganizationBlueprintFromStudio(): OrganizationBlueprint {
  const answers = describeRegionalHealthOrganization();
  const produced = produceOrganizationBlueprint(
    HealthcareIndustryBlueprint,
    answers
  );
  if (!produced.ok || !produced.organization) {
    throw new Error(
      produced.error?.message ??
        "Failed to produce Regional Health organization blueprint from Studio"
    );
  }

  const foundationPacks = buildHealthcareFoundationCapabilityPacks();
  const studio = produced.organization;

  return Object.freeze({
    ...studio,
    displayName: "Regional Health System",
    description:
      "Reference healthcare organization — branding and answers over Healthcare Blueprint + foundation Capability Packs.",
    publisher: "JAG",
    capabilityPacks: foundationPacks,
    integrations: Object.freeze([]),
    // Industry entity/permission/report/terminology catalogs stay as industry
    // definitions in generation; org does not duplicate them as pack contributions.
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(studio.configuration?.keys ?? {}),
        organization: "regional-health",
        brand: "Regional Health",
        healthcareCatalogs: healthcareIndustryCatalogPayload(),
        compositionSource: "healthcare-blueprint-v1",
      }),
    }),
  });
}
