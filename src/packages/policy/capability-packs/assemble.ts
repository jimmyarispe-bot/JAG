import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  POLICY_ACKNOWLEDGEMENT_STATUSES,
  POLICY_FAMILY_EXAMPLES,
  POLICY_LIFECYCLE_STATES,
  POLICY_SCOPE_KINDS,
} from "@/packages/policy/catalogs";
import { POLICY_ENTITY_DEFINITIONS } from "@/packages/policy/entities";
import { POLICY_NAVIGATION } from "@/packages/policy/navigation";
import { POLICY_PERMISSION_PACKS } from "@/packages/policy/permissions";

export function assemblePolicyContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: POLICY_ENTITY_DEFINITIONS,
    permissions: POLICY_PERMISSION_PACKS,
    navigation: Object.freeze([POLICY_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "policy.terminology.default",
        label: "Policy default terminology",
        terms: Object.freeze({
          policy: "Policy",
          obligation: "Obligation",
          exception: "Exception",
          acknowledgement: "Acknowledgement",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function policyPackCatalogPayload() {
  return Object.freeze({
    familyExamples: POLICY_FAMILY_EXAMPLES,
    lifecycleStates: POLICY_LIFECYCLE_STATES,
    scopeKinds: POLICY_SCOPE_KINDS,
    acknowledgementStatuses: POLICY_ACKNOWLEDGEMENT_STATUSES,
  });
}
