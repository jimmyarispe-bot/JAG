import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";
import {
  schedulingEntity,
  schedulingPerm,
} from "@/packages/academy/scheduling/_helpers";
import { ACADEMY_SCHEDULING_PERMISSIONS } from "@/packages/academy/scheduling/permissions";

export const ACADEMY_SCHEDULING_PROGRAM_ENTITY_TYPE = "Program" as const;

export const AcademySchedulingProgramEntity: SchedulingEntityTypeDefinition =
  schedulingEntity({
    entityType: ACADEMY_SCHEDULING_PROGRAM_ENTITY_TYPE,
    label: "Program",
    metadataKeys: Object.freeze([
      "displayName",
      "code",
      "schoolId",
      "modality",
      "region",
      "status",
      "capacity",
    ]),
    searchableFields: Object.freeze([
      Object.freeze({
        key: "displayName",
        label: "Program name",
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
      Object.freeze({
        key: "modality",
        label: "Modality",
        type: "enum" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      schedulingPerm("read", ACADEMY_SCHEDULING_PERMISSIONS.viewSchedule),
      schedulingPerm("update", ACADEMY_SCHEDULING_PERMISSIONS.editSchedule),
      schedulingPerm("read", "academyos.programs.read"),
      schedulingPerm("create", "academyos.programs.create"),
      schedulingPerm("update", "academyos.programs.update"),
    ]),
  });
