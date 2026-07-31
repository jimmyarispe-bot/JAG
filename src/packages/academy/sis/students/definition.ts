/**
 * Academy SIS — Student entity definition (package metadata only).
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_STUDENT_ENTITY_TYPE = "Student" as const;

/** Package-level Student metadata keys (no persistence). */
export const ACADEMY_SIS_STUDENT_METADATA_KEYS = Object.freeze([
  "legalName",
  "preferredName",
  "studentId",
  "dateOfBirth",
  "grade",
  "program",
  "campus",
  "status",
  "enrollmentDate",
  "enrollmentEndDate",
  "graduationTarget",
  "stateReportingId",
  "displayName",
  "firstName",
  "lastName",
  "email",
  "schoolId",
  "familyId",
] as const);

export const AcademySisStudentEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_STUDENT_ENTITY_TYPE,
  label: "Student",
  metadataKeys: ACADEMY_SIS_STUDENT_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "legalName",
      label: "Legal name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "preferredName",
      label: "Preferred name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "studentId",
      label: "Student ID",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "grade",
      label: "Grade",
      type: "enum" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "status",
      label: "Status",
      type: "enum" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "campus",
      label: "Campus",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "program",
      label: "Program",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "stateReportingId",
      label: "State reporting ID",
      type: "string" as const,
      filterable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewStudent, "View Student"),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editStudent, "Edit Student"),
    sisPerm("read", "academyos.students.read"),
    sisPerm("create", "academyos.students.create"),
    sisPerm("update", "academyos.students.update"),
    sisPerm("export", "academyos.students.export"),
  ]),
});
