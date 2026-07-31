import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_SUBJECT_ENTITY_TYPE = "Subject" as const;

export const AcademySchedulingSubjectEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_SUBJECT_ENTITY_TYPE,
    label: "Subject",
    metadataKeys: Object.freeze([
      "displayName",
      "code",
      "department",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Subject",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "code",
        label: "Code",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("create", ACADEMY_SCHEDULING_PERMISSIONS.createClass),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
