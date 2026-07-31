/**
 * Manufacturing industry — common entity templates (data only).
 * Organizations compose foundation packs for shared behavior.
 * These templates represent industry vocabulary — not MES engines.
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

function manufacturingEntity(input: {
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
        permission: `manufacturing.${input.entityType.toLowerCase()}.read`,
      }),
    ]),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}

/** Core manufacturing identity / operations entity templates. */
export const MANUFACTURING_INDUSTRY_ENTITIES: readonly EntityModel[] =
  Object.freeze([
    manufacturingEntity({
      entityType: "Employee",
      label: "Employee",
      metadataKeys: Object.freeze([
        "displayName",
        "employeeId",
        "departmentId",
        "status",
      ]),
    }),
    manufacturingEntity({
      entityType: "Operator",
      label: "Operator",
      metadataKeys: Object.freeze([
        "displayName",
        "employeeId",
        "lineId",
        "shiftId",
        "status",
      ]),
    }),
    manufacturingEntity({
      entityType: "Supervisor",
      label: "Supervisor",
      metadataKeys: Object.freeze([
        "displayName",
        "employeeId",
        "areaId",
        "status",
      ]),
    }),
    manufacturingEntity({
      entityType: "Technician",
      label: "Technician",
      metadataKeys: Object.freeze([
        "displayName",
        "employeeId",
        "specialty",
        "status",
      ]),
    }),
    manufacturingEntity({
      entityType: "Vendor",
      label: "Vendor",
      metadataKeys: Object.freeze([
        "displayName",
        "vendorCode",
        "category",
        "status",
      ]),
    }),
    manufacturingEntity({
      entityType: "Customer",
      label: "Customer",
      metadataKeys: Object.freeze([
        "displayName",
        "customerCode",
        "region",
        "status",
      ]),
    }),
  ]);
