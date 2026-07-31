/**
 * Government industry — common entity templates (data only).
 * Organizations compose foundation packs for shared behavior.
 * These templates represent industry vocabulary — not legislative engines.
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

function governmentEntity(input: {
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
        permission: `government.${input.entityType.toLowerCase()}.read`,
      }),
    ]),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}

/** Core government identity / civic entity templates. */
export const GOVERNMENT_INDUSTRY_ENTITIES: readonly EntityModel[] = Object.freeze(
  [
    governmentEntity({
      entityType: "Citizen",
      label: "Citizen",
      metadataKeys: Object.freeze([
        "displayName",
        "citizenId",
        "ward",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "Resident",
      label: "Resident",
      metadataKeys: Object.freeze([
        "displayName",
        "address",
        "ward",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "ElectedOfficial",
      label: "Elected Official",
      metadataKeys: Object.freeze([
        "displayName",
        "office",
        "termStart",
        "termEnd",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "AppointedOfficial",
      label: "Appointed Official",
      metadataKeys: Object.freeze([
        "displayName",
        "office",
        "appointedBy",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "DepartmentDirector",
      label: "Department Director",
      metadataKeys: Object.freeze([
        "displayName",
        "departmentId",
        "employeeId",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "AgencyEmployee",
      label: "Agency Employee",
      metadataKeys: Object.freeze([
        "displayName",
        "departmentId",
        "employeeId",
        "status",
      ]),
    }),
    governmentEntity({
      entityType: "Contractor",
      label: "Contractor",
      metadataKeys: Object.freeze([
        "displayName",
        "vendorCode",
        "contractId",
        "status",
      ]),
    }),
  ]
);
