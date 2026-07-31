/**
 * Academy Organization Blueprint — The Academy Way overlays on Education industry.
 *
 * Preferred path: Organization Studio answers → Organization Blueprint
 * (`buildAcademyOrganizationBlueprintFromStudio`). This entry remains the
 * package public builder and delegates to Studio.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import { buildAcademyOrganizationBlueprintFromStudio } from "@/packages/academy/studio/build-from-studio";

/**
 * Build the Academy organization blueprint via Organization Studio.
 */
export function buildAcademyOrganizationBlueprint(): OrganizationBlueprint {
  return buildAcademyOrganizationBlueprintFromStudio();
}
