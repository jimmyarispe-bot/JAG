import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_ACADEMIC_YEAR_ENTITY_TYPE =
  "AcademicYear" as const;
export const ACADEMY_SCHEDULING_ACADEMIC_TERM_ENTITY_TYPE =
  "AcademicTerm" as const;

export const AcademySchedulingAcademicYearEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_ACADEMIC_YEAR_ENTITY_TYPE,
    label: "Academic Year",
    metadataKeys: Object.freeze([
      "displayName",
      "schoolId",
      "startDate",
      "endDate",
      "isCurrent",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Year label",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "isCurrent",
        label: "Current year",
        type: "boolean" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewCalendar),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.manageCalendar),
      schedulingPerm("read", "academyos.academics.read"),
      schedulingPerm("update", "academyos.academics.update"),
    ]),
  });

export const AcademySchedulingAcademicTermEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_ACADEMIC_TERM_ENTITY_TYPE,
    label: "Academic Term",
    metadataKeys: Object.freeze([
      "displayName",
      "academicYearId",
      "termKind",
      "startDate",
      "endDate",
      "status",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Term name",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "termKind",
        label: "Term kind",
        type: "enum" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewCalendar),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.manageCalendar),
      schedulingPerm("read", "academyos.academics.read"),
      schedulingPerm("update", "academyos.academics.update"),
    ]),
  });
