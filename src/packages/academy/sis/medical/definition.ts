/**
 * Academy SIS — Medical profile metadata.
 * No document storage. Optional Documents Engine definition id references only.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_MEDICAL_RECORD_ENTITY_TYPE = "MedicalRecord" as const;
export const ACADEMY_SIS_MEDICATION_AUTH_ENTITY_TYPE =
  "MedicationAuthorization" as const;

export const ACADEMY_SIS_MEDICAL_METADATA_KEYS = Object.freeze([
  "studentId",
  "displayName",
  "recordType",
  "allergies",
  "medications",
  "emergencyMedicalNotes",
  "recordedOn",
  "status",
  /** Optional Documents Engine definition ids (references only). */
  "supportingDocumentDefinitionIds",
] as const);

export const ACADEMY_SIS_MEDICATION_METADATA_KEYS = Object.freeze([
  "studentId",
  "medicationName",
  "dosageNote",
  "startDate",
  "endDate",
  "status",
  "supportingDocumentDefinitionIds",
] as const);

export const AcademySisMedicalRecordEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_MEDICAL_RECORD_ENTITY_TYPE,
  label: "Medical Record",
  metadataKeys: ACADEMY_SIS_MEDICAL_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "studentId",
      label: "Student",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "recordType",
      label: "Type",
      type: "enum" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "allergies",
      label: "Allergies",
      type: "string" as const,
      filterable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewMedical, "View Medical"),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editMedical, "Edit Medical"),
    sisPerm("read", "academyos.medical.read"),
    sisPerm("create", "academyos.medical.create"),
    sisPerm("update", "academyos.medical.update"),
    sisPerm("export", "academyos.medical.export"),
  ]),
});

export const AcademySisMedicationAuthorizationEntity: SisEntityTypeDefinition =
  sisEntity({
    entityType: ACADEMY_SIS_MEDICATION_AUTH_ENTITY_TYPE,
    label: "Medication Authorization",
    metadataKeys: ACADEMY_SIS_MEDICATION_METADATA_KEYS,
    searchableFields: Object.freeze([
      Object.freeze({
        key: "medicationName",
        label: "Medication",
        type: "string" as const,
        filterable: true,
        sortable: true,
      }),
      Object.freeze({
        key: "studentId",
        label: "Student",
        type: "string" as const,
        filterable: true,
      }),
    ]),
    permissions: Object.freeze([
      sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewMedical, "View Medical"),
      sisPerm("update", ACADEMY_SIS_PERMISSIONS.editMedical, "Edit Medical"),
      sisPerm("read", "academyos.medical.read"),
      sisPerm("create", "academyos.medical.create"),
      sisPerm("update", "academyos.medical.update"),
      sisPerm("approve", "academyos.medical.approve"),
    ]),
  });
