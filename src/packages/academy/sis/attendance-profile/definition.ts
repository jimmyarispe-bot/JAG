/**
 * Academy SIS — Attendance profile (student-level summary metadata only).
 * Not attendance tracking, scheduling, or gradebook.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_ATTENDANCE_PROFILE_ENTITY_TYPE =
  "AttendanceProfile" as const;

export const ACADEMY_SIS_ATTENDANCE_PROFILE_METADATA_KEYS = Object.freeze([
  "studentId",
  "defaultAttendanceCodePreference",
  "chronicAbsenceFlag",
  "notes",
  "status",
] as const);

export const AcademySisAttendanceProfileEntity: SisEntityTypeDefinition = sisEntity(
  {
    entityType: ACADEMY_SIS_ATTENDANCE_PROFILE_ENTITY_TYPE,
    label: "Attendance Profile",
    metadataKeys: ACADEMY_SIS_ATTENDANCE_PROFILE_METADATA_KEYS,
    searchableFields: Object.freeze([
      Object.freeze({
        key: "studentId",
        label: "Student",
        type: "string" as const,
        filterable: true,
      }),
      Object.freeze({
        key: "chronicAbsenceFlag",
        label: "Chronic absence flag",
        type: "boolean" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewStudent),
      sisPerm("update", ACADEMY_SIS_PERMISSIONS.editStudent),
      sisPerm("read", "academyos.attendance.read"),
      sisPerm("update", "academyos.attendance.update"),
    ]),
  }
);
