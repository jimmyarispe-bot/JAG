/**
 * Academy SIS — Academic profile definitions.
 * Uses Academy academic / Structured Literacy terminology.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_ACADEMIC_PROFILE_ENTITY_TYPE =
  "AcademicProfile" as const;

/** Terminology-aligned academic field keys. */
export const ACADEMY_SIS_ACADEMIC_METADATA_KEYS = Object.freeze([
  "studentId",
  "academicLevel",
  "readingLevel",
  "mathLevel",
  "writingLevel",
  "structuredLiteracyLevel",
  "structuredLiteracyStep",
  "grade",
  "effectiveOn",
  "status",
] as const);

/** Declarative value vocabularies (labels only — no runtime evaluation). */
export const ACADEMY_SIS_ACADEMIC_TERMINOLOGY = Object.freeze({
  academicLevel: "Academic Level",
  readingLevel: "Reading Level",
  mathLevel: "Math Level",
  writingLevel: "Writing Level",
  structuredLiteracyLevel: "Structured Literacy Level",
  structuredLiteracyStep: "Structured Literacy Step",
} as const);

export const AcademySisAcademicProfileEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_ACADEMIC_PROFILE_ENTITY_TYPE,
  label: "Academic Profile",
  metadataKeys: ACADEMY_SIS_ACADEMIC_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "studentId",
      label: "Student",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "academicLevel",
      label: ACADEMY_SIS_ACADEMIC_TERMINOLOGY.academicLevel,
      type: "enum" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "readingLevel",
      label: ACADEMY_SIS_ACADEMIC_TERMINOLOGY.readingLevel,
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "structuredLiteracyLevel",
      label: ACADEMY_SIS_ACADEMIC_TERMINOLOGY.structuredLiteracyLevel,
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "structuredLiteracyStep",
      label: ACADEMY_SIS_ACADEMIC_TERMINOLOGY.structuredLiteracyStep,
      type: "number" as const,
      sortable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm(
      "read",
      ACADEMY_SIS_PERMISSIONS.viewAcademicProfile,
      "View Academic Profile"
    ),
    sisPerm(
      "update",
      ACADEMY_SIS_PERMISSIONS.editAcademicProfile,
      "Edit Academic Profile"
    ),
    sisPerm("read", "academyos.learning.read"),
    sisPerm("update", "academyos.learning.update"),
  ]),
});
