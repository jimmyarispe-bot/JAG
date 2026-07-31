/**
 * Academy SIS — Accommodations profile (IEP / 504 / supports).
 * Declarative only — no compliance workflows.
 */

import type { SisEntityTypeDefinition } from "@/packages/academy/sis/types";
import { sisEntity, sisPerm } from "@/packages/academy/sis/_helpers";
import { ACADEMY_SIS_PERMISSIONS } from "@/packages/academy/sis/permissions";

export const ACADEMY_SIS_IEP_ENTITY_TYPE = "IEP" as const;
export const ACADEMY_SIS_PLAN_504_ENTITY_TYPE = "Plan504" as const;
export const ACADEMY_SIS_ACCOMMODATION_ENTITY_TYPE = "Accommodation" as const;

export const ACADEMY_SIS_IEP_METADATA_KEYS = Object.freeze([
  "studentId",
  "effectiveOn",
  "reviewOn",
  "status",
  "hasIep",
  "primaryDisabilityCode",
] as const);

export const ACADEMY_SIS_PLAN_504_METADATA_KEYS = Object.freeze([
  "studentId",
  "effectiveOn",
  "reviewOn",
  "status",
  "has504",
] as const);

export const ACADEMY_SIS_ACCOMMODATION_METADATA_KEYS = Object.freeze([
  "displayName",
  "studentId",
  "iepId",
  "plan504Id",
  "accommodationFlags",
  "instructionalSupports",
  "status",
] as const);

export const AcademySisIepEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_IEP_ENTITY_TYPE,
  label: "IEP",
  metadataKeys: ACADEMY_SIS_IEP_METADATA_KEYS,
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
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewAccommodations),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editAccommodations),
    sisPerm("read", "academyos.compliance.read"),
    sisPerm("create", "academyos.compliance.create"),
    sisPerm("update", "academyos.compliance.update"),
    sisPerm("approve", "academyos.compliance.approve"),
  ]),
});

export const AcademySisPlan504Entity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_PLAN_504_ENTITY_TYPE,
  label: "504 Plan",
  metadataKeys: ACADEMY_SIS_PLAN_504_METADATA_KEYS,
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
    }),
  ]),
  permissions: Object.freeze([
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewAccommodations),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editAccommodations),
    sisPerm("read", "academyos.compliance.read"),
    sisPerm("create", "academyos.compliance.create"),
    sisPerm("update", "academyos.compliance.update"),
    sisPerm("approve", "academyos.compliance.approve"),
  ]),
});

export const AcademySisAccommodationEntity: SisEntityTypeDefinition = sisEntity({
  entityType: ACADEMY_SIS_ACCOMMODATION_ENTITY_TYPE,
  label: "Accommodation",
  metadataKeys: ACADEMY_SIS_ACCOMMODATION_METADATA_KEYS,
  searchableFields: Object.freeze([
    Object.freeze({
      key: "displayName",
      label: "Accommodation",
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
    sisPerm("read", ACADEMY_SIS_PERMISSIONS.viewAccommodations),
    sisPerm("update", ACADEMY_SIS_PERMISSIONS.editAccommodations),
    sisPerm("read", "academyos.compliance.read"),
    sisPerm("create", "academyos.compliance.create"),
    sisPerm("update", "academyos.compliance.update"),
  ]),
});
