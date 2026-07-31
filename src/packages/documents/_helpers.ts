/**
 * Documents pack helpers — third-party style entity builders (definitions only).
 */

import type { EntityModel } from "@/jag/modeling";
import { DOCUMENTS_APPLICATION_ID } from "@/packages/documents/package";

const DEFAULT_CAPABILITIES = Object.freeze([
  "timeline",
  "notes",
  "documents",
  "attachments",
  "tags",
  "relationships",
  "search",
  "ownership",
  "permissions",
] as const);

export function documentsEntity(input: {
  entityType: string;
  label: string;
  metadataKeys: readonly string[];
  searchableFields?: readonly {
    key: string;
    label: string;
    type: "string" | "number" | "date" | "enum" | "boolean";
    filterable?: boolean;
    sortable?: boolean;
  }[];
  permissionPrefix?: string;
}): EntityModel {
  const prefix = input.permissionPrefix ?? `documents.${input.entityType}`;
  const fields = input.searchableFields ?? [
    {
      key: "displayName",
      label: "Name",
      type: "string" as const,
      filterable: true,
      sortable: true,
    },
  ];

  return Object.freeze({
    entityType: input.entityType,
    label: input.label,
    applicationId: DOCUMENTS_APPLICATION_ID,
    capabilities: DEFAULT_CAPABILITIES,
    searchable: Object.freeze({
      fields: Object.freeze(fields.map((f) => Object.freeze({ ...f }))),
      defaultSort: Object.freeze({
        field: fields[0]!.key,
        direction: "asc" as const,
      }),
    }),
    permissions: Object.freeze([
      Object.freeze({
        action: "read",
        permission: `${prefix}.read`,
        description: `Read ${input.label}`,
      }),
      Object.freeze({
        action: "update",
        permission: `${prefix}.update`,
        description: `Update ${input.label}`,
      }),
    ]),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}
