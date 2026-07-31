import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  WORK_ASSIGNMENT_ROLES,
  WORK_DEPENDENCY_KINDS,
  WORK_ITEM_TYPE_EXAMPLES,
  WORK_OUTCOMES,
  WORK_PRIORITIES,
  WORK_STATUS_STATES,
} from "@/packages/work/catalogs";
import { WORK_ENTITY_DEFINITIONS } from "@/packages/work/entities";
import { WORK_NAVIGATION } from "@/packages/work/navigation";
import { WORK_PERMISSION_PACKS } from "@/packages/work/permissions";

export function assembleWorkContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: WORK_ENTITY_DEFINITIONS,
    permissions: WORK_PERMISSION_PACKS,
    navigation: Object.freeze([WORK_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "work.terminology.default",
        label: "Work default terminology",
        terms: Object.freeze({
          workItem: "Work Item",
          assignment: "Assignment",
          dependency: "Dependency",
          outcome: "Outcome",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function workPackCatalogPayload() {
  return Object.freeze({
    workItemTypeExamples: WORK_ITEM_TYPE_EXAMPLES,
    statusStates: WORK_STATUS_STATES,
    priorities: WORK_PRIORITIES,
    dependencyKinds: WORK_DEPENDENCY_KINDS,
    outcomes: WORK_OUTCOMES,
    assignmentRoles: WORK_ASSIGNMENT_ROLES,
  });
}
