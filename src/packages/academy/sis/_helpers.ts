/**
 * SIS package helpers — build declarative entity contributions (definitions only).
 */

import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";
import type {
  SisEntityPermissionRule,
  SisEntityTypeDefinition,
  SisSearchableField,
} from "@/packages/academy/sis/types";

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
]);

export function sisEntity(input: {
  entityType: string;
  label: string;
  metadataKeys: readonly string[];
  permissions: readonly SisEntityPermissionRule[];
  searchableFields?: readonly SisSearchableField[];
  capabilities?: readonly string[];
}): SisEntityTypeDefinition {
  return Object.freeze({
    entityType: input.entityType,
    label: input.label,
    applicationId: ACADEMY_APPLICATION_ID,
    capabilities: Object.freeze([
      ...(input.capabilities ?? DEFAULT_CAPABILITIES),
    ]),
    searchable: Object.freeze({
      fields: Object.freeze([...(input.searchableFields ?? [])]),
      defaultSort: Object.freeze({
        field: "displayName",
        direction: "asc" as const,
      }),
    }),
    permissions: Object.freeze(
      input.permissions.map((p) => Object.freeze({ ...p }))
    ),
    metadataKeys: Object.freeze([...input.metadataKeys]),
  });
}

export function sisPerm(
  action: string,
  permission: string,
  description?: string
): SisEntityPermissionRule {
  return Object.freeze({ action, permission, description });
}
