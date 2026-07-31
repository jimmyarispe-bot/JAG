/**
 * Advanced Manufacturing Company Organization Blueprint entry.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import { buildAdvancedManufacturingOrganizationBlueprintFromStudio } from "@/packages/manufacturing/studio/build-from-studio";

export function buildAdvancedManufacturingOrganizationBlueprint(): OrganizationBlueprint {
  return buildAdvancedManufacturingOrganizationBlueprintFromStudio();
}
