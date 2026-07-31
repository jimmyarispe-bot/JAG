/**
 * City Government Organization Blueprint entry.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import { buildCityGovernmentOrganizationBlueprintFromStudio } from "@/packages/government/studio/build-from-studio";

export function buildCityGovernmentOrganizationBlueprint(): OrganizationBlueprint {
  return buildCityGovernmentOrganizationBlueprintFromStudio();
}
