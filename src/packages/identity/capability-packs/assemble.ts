/**
 * Assemble Identity contribution bundle — pack-owned, no ApplicationModel.
 */

import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  IDENTITY_GROUP_KINDS,
  IDENTITY_LIFECYCLE_STATES,
  IDENTITY_PERMISSION_BINDING_KINDS,
  IDENTITY_ROLE_EXAMPLES,
} from "@/packages/identity/catalogs";
import { IDENTITY_ENTITY_DEFINITIONS } from "@/packages/identity/entities";
import { IDENTITY_NAVIGATION } from "@/packages/identity/navigation";
import { IDENTITY_PERMISSION_PACKS } from "@/packages/identity/permissions";

export function assembleIdentityContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: IDENTITY_ENTITY_DEFINITIONS,
    permissions: IDENTITY_PERMISSION_PACKS,
    navigation: Object.freeze([IDENTITY_NAVIGATION]),
    // Catalogs travel as configuration for generators / Studio (not engine code).
    // Contribution slots unused by Identity remain undefined (no handwritten filler).
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "identity.terminology.default",
        label: "Identity default terminology",
        terms: Object.freeze({
          person: "Person",
          member: "Member",
          organization: "Organization",
          role: "Role",
          group: "Group",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

/** Declarative catalogs attached beside contributions for proof / Studio. */
export function identityPackCatalogPayload() {
  return Object.freeze({
    lifecycleStates: IDENTITY_LIFECYCLE_STATES,
    roleExamples: IDENTITY_ROLE_EXAMPLES,
    groupKinds: IDENTITY_GROUP_KINDS,
    permissionBindingKinds: IDENTITY_PERMISSION_BINDING_KINDS,
  });
}
