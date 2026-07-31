/**
 * Regional Health System Organization Blueprint entry.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import { buildRegionalHealthOrganizationBlueprintFromStudio } from "@/packages/healthcare/studio/build-from-studio";

export function buildRegionalHealthOrganizationBlueprint(): OrganizationBlueprint {
  return buildRegionalHealthOrganizationBlueprintFromStudio();
}
