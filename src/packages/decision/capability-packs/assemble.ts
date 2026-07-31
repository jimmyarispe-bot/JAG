import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  DECISION_CATEGORY_EXAMPLES,
  DECISION_EVIDENCE_ROLES,
  DECISION_OUTCOMES,
  DECISION_PARTICIPANT_ROLES,
  DECISION_STATUS_STATES,
} from "@/packages/decision/catalogs";
import { DECISION_ENTITY_DEFINITIONS } from "@/packages/decision/entities";
import { DECISION_NAVIGATION } from "@/packages/decision/navigation";
import { DECISION_PERMISSION_PACKS } from "@/packages/decision/permissions";

export function assembleDecisionContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: DECISION_ENTITY_DEFINITIONS,
    permissions: DECISION_PERMISSION_PACKS,
    navigation: Object.freeze([DECISION_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "decision.terminology.default",
        label: "Decision default terminology",
        terms: Object.freeze({
          decision: "Decision",
          option: "Option",
          rationale: "Rationale",
          evidence: "Evidence",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function decisionPackCatalogPayload() {
  return Object.freeze({
    categoryExamples: DECISION_CATEGORY_EXAMPLES,
    statusStates: DECISION_STATUS_STATES,
    outcomes: DECISION_OUTCOMES,
    participantRoles: DECISION_PARTICIPANT_ROLES,
    evidenceRoles: DECISION_EVIDENCE_ROLES,
  });
}
