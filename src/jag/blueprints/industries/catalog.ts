/**
 * Industry blueprint catalog — discoverable platform industries.
 */

import type { IndustryBlueprint, IndustryId } from "@/jag/blueprints/contracts";
import { EducationIndustryBlueprint } from "@/jag/blueprints/industries/education";
import { GovernmentIndustryBlueprint } from "@/jag/blueprints/industries/government/blueprint";
import { HealthcareIndustryBlueprint } from "@/jag/blueprints/industries/healthcare/blueprint";
import { ManufacturingIndustryBlueprint } from "@/jag/blueprints/industries/manufacturing/blueprint";

export const INDUSTRY_BLUEPRINTS: readonly IndustryBlueprint[] = Object.freeze([
  EducationIndustryBlueprint,
  HealthcareIndustryBlueprint,
  ManufacturingIndustryBlueprint,
  GovernmentIndustryBlueprint,
]);

const byId = new Map<IndustryId, IndustryBlueprint>(
  INDUSTRY_BLUEPRINTS.map((b) => [b.id, b])
);

export function getIndustryBlueprint(
  id: IndustryId
): IndustryBlueprint | null {
  return byId.get(id) ?? null;
}

export function listIndustryBlueprints(): readonly IndustryBlueprint[] {
  return INDUSTRY_BLUEPRINTS;
}

export function requireIndustryBlueprint(id: IndustryId): IndustryBlueprint {
  const found = getIndustryBlueprint(id);
  if (!found) {
    throw new Error(`Unknown industry blueprint "${id}"`);
  }
  return found;
}
