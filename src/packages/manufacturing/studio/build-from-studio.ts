/**
 * Build Advanced Manufacturing Organization Blueprint via Organization Studio,
 * then attach Manufacturing foundation Capability Packs only.
 *
 * No handwritten industry registrations. No manufacturing.core vertical pack.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  ManufacturingIndustryBlueprint,
  manufacturingIndustryCatalogPayload,
} from "@/jag/blueprints";
import { produceOrganizationBlueprint } from "@/jag/studio";
import { buildManufacturingFoundationCapabilityPacks } from "@/packages/manufacturing/composition";
import { describeAdvancedManufacturingOrganization } from "@/packages/manufacturing/studio/describe-advanced-manufacturing";

/**
 * Studio answers → Organization Blueprint + foundation packs.
 * Runtime Generation expands packs into the Runtime Specification.
 */
export function buildAdvancedManufacturingOrganizationBlueprintFromStudio(): OrganizationBlueprint {
  const answers = describeAdvancedManufacturingOrganization();
  const produced = produceOrganizationBlueprint(
    ManufacturingIndustryBlueprint,
    answers
  );
  if (!produced.ok || !produced.organization) {
    throw new Error(
      produced.error?.message ??
        "Failed to produce Advanced Manufacturing organization blueprint from Studio"
    );
  }

  const foundationPacks = buildManufacturingFoundationCapabilityPacks();
  const studio = produced.organization;

  return Object.freeze({
    ...studio,
    displayName: "Advanced Manufacturing Company",
    description:
      "Reference manufacturing organization — branding and answers over Manufacturing Blueprint + foundation Capability Packs.",
    publisher: "JAG",
    capabilityPacks: foundationPacks,
    integrations: Object.freeze([]),
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(studio.configuration?.keys ?? {}),
        organization: "advanced-manufacturing",
        brand: "Advanced Manufacturing",
        manufacturingCatalogs: manufacturingIndustryCatalogPayload(),
        compositionSource: "manufacturing-blueprint-v1",
      }),
    }),
  });
}
