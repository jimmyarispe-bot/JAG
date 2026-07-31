/**
 * Academy SIS — Emergency Contact and Authorized Pickup definitions.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_EMERGENCY_CONTACT_ENTITY_TYPE =
  "EmergencyContact" as const;
export const ACADEMY_SIS_AUTHORIZED_PICKUP_ENTITY_TYPE =
  "AuthorizedPickup" as const;

export const ACADEMY_SIS_EMERGENCY_CONTACT_METADATA_KEYS = Object.freeze([
  "displayName",
  "phone",
  "email",
  "studentId",
  "relationship",
  "priority",
  "canPickup",
] as const);

export const ACADEMY_SIS_AUTHORIZED_PICKUP_METADATA_KEYS = Object.freeze([
  "displayName",
  "phone",
  "email",
  "studentId",
  "relationship",
  "idVerificationNote",
  "effectiveFrom",
  "effectiveTo",
  "status",
] as const);

export const ACADEMY_SIS_CONTACT_RELATIONSHIPS = Object.freeze([
  Object.freeze({
    id: "academy.sis.relationship.student_emergency_contact",
    relationshipType: "student_emergency_contact",
    fromEntityType: "Student",
    toEntityType: "EmergencyContact",
    label: "Student has Emergency Contact",
    cardinality: "one_to_many" as const,
  }),
  Object.freeze({
    id: "academy.sis.relationship.student_authorized_pickup",
    relationshipType: "student_authorized_pickup",
    fromEntityType: "Student",
    toEntityType: "AuthorizedPickup",
    label: "Student has Authorized Pickup",
    cardinality: "one_to_many" as const,
  }),
]);

export const AcademySisEmergencyContactEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_EMERGENCY_CONTACT_ENTITY_TYPE,
  label: "Emergency Contact",
  metadataKeys: ACADEMY_SIS_EMERGENCY_CONTACT_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "displayName",
      label: "Full name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "phone",
      label: "Phone",
      type: "string" as const,
      filterable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewContacts),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editContacts),
    sisPerm("read", "academyos.students.read"),
    sisPerm("create", "academyos.students.create"),
    sisPerm("update", "academyos.students.update"),
  ]),
});

export const AcademySisAuthorizedPickupEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_AUTHORIZED_PICKUP_ENTITY_TYPE,
  label: "Authorized Pickup",
  metadataKeys: ACADEMY_SIS_AUTHORIZED_PICKUP_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "displayName",
      label: "Full name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    }),
    Object.freeze({
      key: "status",
      label: "Status",
      type: "enum" as const,
      filterable: true,
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewContacts),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editContacts),
    sisPerm("read", "academyos.students.read"),
    sisPerm("create", "academyos.students.create"),
    sisPerm("update", "academyos.students.update"),
  ]),
});
