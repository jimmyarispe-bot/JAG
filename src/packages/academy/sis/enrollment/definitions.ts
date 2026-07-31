/**
 * Academy SIS — Enrollment model definitions (no workflows).
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export type SisEnrollmentKind =
  | "enrollment"
  | "withdrawal"
  | "transfer"
  | "graduation"
  | "re_enrollment";

export type SisEnrollmentDefinition = {
  readonly id: string;
  readonly kind: SisEnrollmentKind;
  readonly label: string;
  readonly description: string;
  readonly metadataKeys: readonly string[];
};

export const ACADEMY_SIS_ENROLLMENT_ENTITY_TYPE = "Enrollment" as const;

export const ACADEMY_SIS_ENROLLMENT_METADATA_KEYS = Object.freeze([
  "studentId",
  "programId",
  "campusId",
  "sectionId",
  "classId",
  "grade",
  "startDate",
  "endDate",
  "status",
  "enrollmentKind",
  "withdrawalReason",
  "transferToCampusId",
  "graduationDate",
  "reEnrollmentOfId",
] as const);

export const ACADEMY_SIS_ENROLLMENT_DEFINITIONS: readonly SisEnrollmentDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "academy.sis.enrollment.enroll",
      kind: "enrollment" as const,
      label: "Enrollment",
      description: "Initial or continuing program enrollment",
      metadataKeys: Object.freeze([
        "studentId",
        "programId",
        "campusId",
        "grade",
        "startDate",
        "status",
      ]),
    }),
    Object.freeze({
      id: "academy.sis.enrollment.withdrawal",
      kind: "withdrawal" as const,
      label: "Withdrawal",
      description: "Student withdrawal from program/campus",
      metadataKeys: Object.freeze([
        "studentId",
        "endDate",
        "withdrawalReason",
        "status",
      ]),
    }),
    Object.freeze({
      id: "academy.sis.enrollment.transfer",
      kind: "transfer" as const,
      label: "Transfer",
      description: "Transfer between campuses or programs",
      metadataKeys: Object.freeze([
        "studentId",
        "programId",
        "campusId",
        "transferToCampusId",
        "startDate",
        "endDate",
        "status",
      ]),
    }),
    Object.freeze({
      id: "academy.sis.enrollment.graduation",
      kind: "graduation" as const,
      label: "Graduation",
      description: "Graduation / completion of program",
      metadataKeys: Object.freeze([
        "studentId",
        "graduationDate",
        "status",
      ]),
    }),
    Object.freeze({
      id: "academy.sis.enrollment.re_enrollment",
      kind: "re_enrollment" as const,
      label: "Re-enrollment",
      description: "Return enrollment after withdrawal",
      metadataKeys: Object.freeze([
        "studentId",
        "programId",
        "campusId",
        "startDate",
        "reEnrollmentOfId",
        "status",
      ]),
    }),
  ]);

export const ACADEMY_SIS_ENROLLMENT_DEFINITION_IDS = Object.freeze(
  ACADEMY_SIS_ENROLLMENT_DEFINITIONS.map((d) => d.id)
);

export const AcademySisEnrollmentEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_ENROLLMENT_ENTITY_TYPE,
  label: "Enrollment",
  metadataKeys: ACADEMY_SIS_ENROLLMENT_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "studentId",
      label: "Student",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "status",
      label: "Status",
      type: "enum" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "enrollmentKind",
      label: "Enrollment kind",
      type: "enum" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "startDate",
      label: "Start date",
      type: "date" as const,
      sortable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm(
      "read",
      ACADEMY_SIS_PERMISSIONS.viewEnrollment,
      "View Enrollment"
    ),
    sisPerm(
      "administer",
      ACADEMY_SIS_PERMISSIONS.manageEnrollment,
      "Manage Enrollment"
    ),
    sisPerm("read", "academyos.enrollment.read"),
    sisPerm("create", "academyos.enrollment.create"),
    sisPerm("update", "academyos.enrollment.update"),
    sisPerm("approve", "academyos.enrollment.approve"),
    sisPerm("export", "academyos.enrollment.export"),
  ]),
});
