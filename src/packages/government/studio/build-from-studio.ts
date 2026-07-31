/**
 * Build City Government Organization Blueprint via Organization Studio,
 * then attach Government foundation Capability Packs only.
 *
 * No handwritten industry registrations. No government.core vertical pack.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  GovernmentIndustryBlueprint,
  governmentIndustryCatalogPayload,
} from "@/jag/blueprints";
import { produceOrganizationBlueprint } from "@/jag/studio";
import { buildGovernmentFoundationCapabilityPacks } from "@/packages/government/composition";
import { describeCityGovernmentOrganization } from "@/packages/government/studio/describe-city-government";

/**
 * Studio answers → Organization Blueprint + foundation packs.
 * Runtime Generation expands packs into the Runtime Specification.
 */
export function buildCityGovernmentOrganizationBlueprintFromStudio(): OrganizationBlueprint {
  const answers = describeCityGovernmentOrganization();
  const produced = produceOrganizationBlueprint(
    GovernmentIndustryBlueprint,
    answers
  );
  if (!produced.ok || !produced.organization) {
    throw new Error(
      produced.error?.message ??
        "Failed to produce City Government organization blueprint from Studio"
    );
  }

  const foundationPacks = buildGovernmentFoundationCapabilityPacks();
  const studio = produced.organization;

  return Object.freeze({
    ...studio,
    displayName: "City Government",
    description:
      "Reference government organization — branding and answers over Government Blueprint + foundation Capability Packs.",
    publisher: "JAG",
    capabilityPacks: foundationPacks,
    integrations: Object.freeze([]),
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(studio.configuration?.keys ?? {}),
        organization: "city-government",
        brand: "City of Progress",
        governmentCatalogs: governmentIndustryCatalogPayload(),
        compositionSource: "government-blueprint-v1",
      }),
    }),
  });
}
