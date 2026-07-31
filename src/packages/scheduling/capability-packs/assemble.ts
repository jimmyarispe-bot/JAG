import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  AVAILABILITY_STATES,
  CONFLICT_KINDS,
  RECURRENCE_FREQUENCIES,
  RESOURCE_TYPE_EXAMPLES,
  SCHEDULABLE_TYPE_EXAMPLES,
  SCHEDULE_INVITATION_KINDS,
  SCHEDULE_PARTICIPANT_KINDS,
  SCHEDULE_STATUS_STATES,
} from "@/packages/scheduling/catalogs";
import { SCHEDULING_ENTITY_DEFINITIONS } from "@/packages/scheduling/entities";
import { SCHEDULING_NAVIGATION } from "@/packages/scheduling/navigation";
import { SCHEDULING_PERMISSION_PACKS } from "@/packages/scheduling/permissions";

export function assembleSchedulingContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: SCHEDULING_ENTITY_DEFINITIONS,
    permissions: SCHEDULING_PERMISSION_PACKS,
    navigation: Object.freeze([SCHEDULING_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "scheduling.terminology.default",
        label: "Scheduling default terminology",
        terms: Object.freeze({
          scheduleItem: "Schedule Item",
          resource: "Resource",
          availability: "Availability",
          conflict: "Conflict",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function schedulingPackCatalogPayload() {
  return Object.freeze({
    schedulableTypeExamples: SCHEDULABLE_TYPE_EXAMPLES,
    resourceTypeExamples: RESOURCE_TYPE_EXAMPLES,
    availabilityStates: AVAILABILITY_STATES,
    recurrenceFrequencies: RECURRENCE_FREQUENCIES,
    conflictKinds: CONFLICT_KINDS,
    invitationKinds: SCHEDULE_INVITATION_KINDS,
    participantKinds: SCHEDULE_PARTICIPANT_KINDS,
    statusStates: SCHEDULE_STATUS_STATES,
  });
}
