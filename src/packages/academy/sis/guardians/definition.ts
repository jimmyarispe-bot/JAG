/**
 * Academy SIS — Parent / Guardian entity + relationship definitions.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_GUARDIAN_ENTITY_TYPE = "Guardian" as const;

export const ACADEMY_SIS_GUARDIAN_METADATA_KEYS = Object.freeze([
  "displayName",
  "legalName",
  "email",
  "phone",
  "relationship",
  "familyId",
  "isPrimary",
  "custodyStatus",
  "canPickup",
  "receivesCommunications",
] as const);

/** Declarative relationship kinds (Entity Framework relationshipType values). */
export const ACADEMY_SIS_GUARDIAN_RELATIONSHIPS = Object.freeze([
  Object.freeze({
    id: "academy.sis.relationship.student_guardian",
    relationshipType: "student_guardian",
    fromEntityType: "Student",
    toEntityType: "Guardian",
    label: "Student has Parent/Guardian",
    cardinality: "many_to_many" as const,
  }),
  Object.freeze({
    id: "academy.sis.relationship.family_guardian",
    relationshipType: "family_guardian",
    fromEntityType: "Family",
    toEntityType: "Guardian",
    label: "Family includes Guardian",
    cardinality: "one_to_many" as const,
  }),
]);

export const AcademySisGuardianEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_GUARDIAN_ENTITY_TYPE,
  label: "Parent / Guardian",
  metadataKeys: ACADEMY_SIS_GUARDIAN_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "displayName",
      label: "Full name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "email",
      label: "Email",
      type: "string" as const,
      filterable: true,
    }),
    Object.freeze({
      key: "relationship",
      label: "Relationship",
      type: "enum" as const,
      filterable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewGuardian, "View Guardian"),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editGuardian, "Edit Guardian"),
    sisPerm("read", "academyos.guardians.read"),
    sisPerm("create", "academyos.guardians.create"),
    sisPerm("update", "academyos.guardians.update"),
  ]),
});
