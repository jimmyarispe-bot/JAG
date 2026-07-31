/**
 * Register Academy Scheduling package contributions into JAG Entity Framework.
 * Allowed registration boundary for platform entity imports.
 */

import { EntityService } from "@/lib/platform/entities";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS } from "@/packages/academy/scheduling/academic-calendar";
import { AcademySchedulingBellScheduleEntity } from "@/packages/academy/scheduling/bell-schedules";
import { AcademySchedulingClassEntity } from "@/packages/academy/scheduling/classes";
import { ACADEMY_SCHEDULING_CONSTRAINTS } from "@/packages/academy/scheduling/conflicts";
import { AcademySchedulingCourseEntity } from "@/packages/academy/scheduling/courses";
import {
  ACADEMY_SCHEDULING_PERMISSION_PACK,
  ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
} from "@/packages/academy/scheduling/permissions";
import {
  ACADEMY_SCHEDULING_PROGRAMS,
  AcademySchedulingProgramEntity,
} from "@/packages/academy/scheduling/programs";
import {
  registerAcademySchedulingCalendarCatalog,
  registerAcademySchedulingConstraints,
  registerAcademySchedulingPermissionPack,
  registerAcademySchedulingProgramCatalog,
  registerAcademySchedulingReports,
} from "@/packages/academy/scheduling/reports";
import { AcademySchedulingRoomEntity } from "@/packages/academy/scheduling/rooms";
import { AcademySchedulingCampusCalendarEntity } from "@/packages/academy/scheduling/school-calendar";
import { AcademySchedulingSectionEntity } from "@/packages/academy/scheduling/sections";
import { AcademySchedulingStudentScheduleEntity } from "@/packages/academy/scheduling/student-schedules";
import { AcademySchedulingSubjectEntity } from "@/packages/academy/scheduling/subjects";
import { AcademySchedulingTeacherAssignmentEntity } from "@/packages/academy/scheduling/teachers";
import {
  AcademySchedulingAcademicTermEntity,
  AcademySchedulingAcademicYearEntity,
} from "@/packages/academy/scheduling/terms";
import { AcademySchedulingTimeSlotEntity } from "@/packages/academy/scheduling/time-slots";
import type { SchedulingEntityTypeDefinition } from "@/packages/academy/scheduling/types";

export const ACADEMY_SCHEDULING_ENTITY_DEFINITIONS: readonly SchedulingEntityTypeDefinition[] =
  Object.freeze([
    AcademySchedulingAcademicYearEntity,
    AcademySchedulingAcademicTermEntity,
    AcademySchedulingCampusCalendarEntity,
    AcademySchedulingProgramEntity,
    AcademySchedulingSubjectEntity,
    AcademySchedulingCourseEntity,
    AcademySchedulingClassEntity,
    AcademySchedulingSectionEntity,
    AcademySchedulingTimeSlotEntity,
    AcademySchedulingBellScheduleEntity,
    AcademySchedulingRoomEntity,
    AcademySchedulingTeacherAssignmentEntity,
    AcademySchedulingStudentScheduleEntity,
  ]);

export const ACADEMY_SCHEDULING_ENTITY_TYPES = Object.freeze(
  ACADEMY_SCHEDULING_ENTITY_DEFINITIONS.map((e) => e.entityType)
);

export type AcademySchedulingRegistrationResult = {
  readonly entityCount: number;
  readonly reportCount: number;
  readonly programCount: number;
  readonly calendarDefinitionCount: number;
  readonly constraintCount: number;
  readonly permissionPackId: typeof ACADEMY_SCHEDULING_PERMISSION_PACK_ID;
  readonly entityTypes: readonly string[];
};

function asEntityTypeDefinition(
  definition: SchedulingEntityTypeDefinition
): EntityTypeDefinition {
  return definition as unknown as EntityTypeDefinition;
}

export function registerAcademyPackageScheduling(): AcademySchedulingRegistrationResult {
  for (const definition of ACADEMY_SCHEDULING_ENTITY_DEFINITIONS) {
    EntityService.registerType(asEntityTypeDefinition(definition));
  }

  const reports = registerAcademySchedulingReports();
  registerAcademySchedulingPermissionPack(ACADEMY_SCHEDULING_PERMISSION_PACK);
  registerAcademySchedulingProgramCatalog(ACADEMY_SCHEDULING_PROGRAMS);
  registerAcademySchedulingCalendarCatalog(ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS);
  registerAcademySchedulingConstraints(ACADEMY_SCHEDULING_CONSTRAINTS);

  return {
    entityCount: ACADEMY_SCHEDULING_ENTITY_DEFINITIONS.length,
    reportCount: reports.length,
    programCount: ACADEMY_SCHEDULING_PROGRAMS.length,
    calendarDefinitionCount: ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS.length,
    constraintCount: ACADEMY_SCHEDULING_CONSTRAINTS.length,
    permissionPackId: ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
    entityTypes: ACADEMY_SCHEDULING_ENTITY_TYPES,
  };
}
