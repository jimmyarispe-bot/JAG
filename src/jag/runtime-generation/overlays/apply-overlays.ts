/**
 * Organization overlay application — org contribution fields win by key.
 */

import type {
  BlueprintContributionBundle,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";

/** Extract organization contribution overlays (excluding capability packs). */
export function organizationOverlayBundle(
  organization: OrganizationBlueprint
): BlueprintContributionBundle {
  return {
    entities: organization.entities,
    processes: organization.processes,
    decisions: organization.decisions,
    forms: organization.forms,
    documents: organization.documents,
    communications: organization.communications,
    permissions: organization.permissions,
    reports: organization.reports,
    navigation: organization.navigation,
    workflows: organization.workflows,
    terminology: organization.terminology,
    localization: organization.localization,
    integrations: organization.integrations,
  };
}
