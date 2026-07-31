import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_CAMPUS_CALENDAR_ENTITY_TYPE =
  "CampusCalendar" as const;

export const AcademySchedulingCampusCalendarEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_CAMPUS_CALENDAR_ENTITY_TYPE,
    label: "Campus Calendar",
    metadataKeys: Object.freeze([
      "displayName",
      "campusId",
      "academicYearId",
      "timezone",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Calendar name",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "campusId",
        label: "Campus",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm(
        "read",
        ACADEMY_SCHEDULING_PERMISSIONS.viewCalendar,
        "View Calendar"
      ),
      schedulingPerm(
        "administer",
        ACADEMY_SCHEDULING_PERMISSIONS.manageCalendar,
        "Manage Calendar"
      ),
      schedulingPerm("read", "academyos.scheduling.read"),
      schedulingPerm("update", "academyos.scheduling.update"),
    ]),
  });
