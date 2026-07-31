/**
 * Education industry — common entity templates (data only).
 * Organizations override with concrete metadata / permissions.
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

function educationEntity(input: {
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
        permission: `education.${input.entityType.toLowerCase()}.read`,
      }),
    ]),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}

/** Core education SIS / scheduling entity templates. */
export const EDUCATION_INDUSTRY_ENTITIES: readonly EntityModel[] = Object.freeze([
  educationEntity({
    entityType: "Student",
    label: "Student",
    metadataKeys: Object.freeze([
      "legalName",
      "preferredName",
      "studentId",
      "dateOfBirth",
      "grade",
      "program",
      "campus",
      "status",
    ]),
  }),
  educationEntity({
    entityType: "Guardian",
    label: "Parent / Guardian",
    metadataKeys: Object.freeze([
      "displayName",
      "email",
      "phone",
      "relationship",
      "familyId",
    ]),
  }),
  educationEntity({
    entityType: "Enrollment",
    label: "Enrollment",
    metadataKeys: Object.freeze([
      "studentId",
      "programId",
      "campusId",
      "startDate",
      "status",
    ]),
  }),
  educationEntity({
    entityType: "Program",
    label: "Program",
    metadataKeys: Object.freeze(["displayName", "code", "modality", "status"]),
  }),
  educationEntity({
    entityType: "Course",
    label: "Course",
    metadataKeys: Object.freeze(["displayName", "code", "subjectId", "programId"]),
  }),
  educationEntity({
    entityType: "Class",
    label: "Class",
    metadataKeys: Object.freeze([
      "displayName",
      "courseId",
      "programId",
      "campusId",
      "status",
    ]),
  }),
  educationEntity({
    entityType: "Section",
    label: "Section",
    metadataKeys: Object.freeze([
      "displayName",
      "classId",
      "roomId",
      "timeSlotId",
      "status",
    ]),
  }),
  educationEntity({
    entityType: "AcademicYear",
    label: "Academic Year",
    metadataKeys: Object.freeze(["displayName", "startDate", "endDate", "isCurrent"]),
  }),
  educationEntity({
    entityType: "Inquiry",
    label: "Inquiry",
    metadataKeys: Object.freeze(["displayName", "status", "source"]),
  }),
  educationEntity({
    entityType: "Application",
    label: "Application",
    metadataKeys: Object.freeze(["displayName", "status", "studentId", "programId"]),
  }),
]);
