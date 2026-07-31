/**
 * Healthcare industry — common entity templates (data only).
 * Organizations compose foundation packs for shared behavior.
 * These templates represent industry vocabulary — not EHR engines.
 */

import type { EntityModel } from "@/jag/modeling/entity-model";

const caps = Object.freeze([
  "timeline",
  "notes",
  "documents",
  "tags",
  "relationships",
  "search",
  "ownership",
  "permissions",
] as const);

function healthcareEntity(input: {
  entityType: string;
  label: string;
  metadataKeys: readonly string[];
}): EntityModel {
  return Object.freeze({
    entityType: input.entityType,
    label: input.label,
    applicationId: null,
    capabilities: caps,
    searchable: Object.freeze({
      fields: Object.freeze([
        Object.freeze({
          key: "displayName",
          label: "Name",
          type: "string" as const,
          filterable: true,
          sortable: true,
        }),
      ]),
      defaultSort: Object.freeze({
        field: "displayName",
        direction: "asc" as const,
      }),
    }),
    permissions: Object.freeze([
      Object.freeze({
        action: "read",
        permission: `healthcare.${input.entityType.toLowerCase()}.read`,
      }),
    ]),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}

/** Core healthcare identity / care entity templates. */
export const HEALTHCARE_INDUSTRY_ENTITIES: readonly EntityModel[] = Object.freeze([
  healthcareEntity({
    entityType: "Patient",
    label: "Patient",
    metadataKeys: Object.freeze([
      "displayName",
      "medicalRecordNumber",
      "dateOfBirth",
      "status",
    ]),
  }),
  healthcareEntity({
    entityType: "Provider",
    label: "Provider",
    metadataKeys: Object.freeze([
      "displayName",
      "npi",
      "specialty",
      "status",
    ]),
  }),
  healthcareEntity({
    entityType: "Clinician",
    label: "Clinician",
    metadataKeys: Object.freeze([
      "displayName",
      "credential",
      "departmentId",
      "status",
    ]),
  }),
  healthcareEntity({
    entityType: "CareTeam",
    label: "Care Team",
    metadataKeys: Object.freeze([
      "displayName",
      "patientId",
      "leadProviderId",
      "status",
    ]),
  }),
  healthcareEntity({
    entityType: "FamilyContact",
    label: "Family Contact",
    metadataKeys: Object.freeze([
      "displayName",
      "patientId",
      "relationship",
      "phone",
      "email",
    ]),
  }),
]);
