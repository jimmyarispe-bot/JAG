/**
 * Scheduling package helpers — declarative entity contributions only.
 */

import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";
import type {
  SchedulingEntityPermissionRule,
  SchedulingEntityTypeDefinition,
  SchedulingSearchableField,
} from "@/packages/academy/scheduling/types";

const DEFAULT_CAPABILITIES = Object.freeze([
  "timeline",
  "notes",
  "tags",
  "relationships",
  "search",
  "ownership",
  "permissions",
]);

export function schedulingEntity(input: {
  entityType: string;
  label: string;
  metadataKeys: readonly string[];
  permissions: readonly SchedulingEntityPermissionRule[];
  searchableFields?: readonly SchedulingSearchableField[];
  capabilities?: readonly string[];
}): SchedulingEntityTypeDefinition {
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

export function schedulingPerm(
  action: string,
  permission: string,
  description?: string
): SchedulingEntityPermissionRule {
  return Object.freeze({ action, permission, description });
}
