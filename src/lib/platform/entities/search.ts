import { listPlatformEntities } from "@/lib/platform/entities/entity";
import {
  assertEntityTypeRegistered,
  entityHasCapability,
  getEntityType,
} from "@/lib/platform/entities/registry";
import type {
  EntitySearchHit,
  EntitySearchQuery,
  EntityTypeDefinition,
} from "@/lib/platform/entities/types";

/** Universal search contract accessor — no UI. */
export function getEntitySearchContract(
  entityType: string
): EntityTypeDefinition["searchable"] {
  const def = assertEntityTypeRegistered(entityType);
  return {
    fields: def.searchable.fields.map((f) => ({ ...f })),
    defaultSort: def.searchable.defaultSort
      ? { ...def.searchable.defaultSort }
      : undefined,
  };
}

function fieldValue(
  entity: ReturnType<typeof listPlatformEntities>[number],
  key: string
): unknown {
  if (key === "displayName") return entity.displayName;
  if (key === "status") return entity.status;
  if (key === "organizationId") return entity.organizationId;
  if (key === "applicationId") return entity.applicationId;
  if (key in entity.metadata) return entity.metadata[key];
  return undefined;
}

/**
 * Search registered entities in the framework working set.
 * Applications supply searchable fields via registry; platform executes the contract.
 */
export function searchEntities(query: EntitySearchQuery): EntitySearchHit[] {
  if (query.entityType) {
    assertEntityTypeRegistered(query.entityType);
    if (!entityHasCapability(query.entityType, "search")) {
      throw new Error(
        `Entity type "${query.entityType}" does not enable search`
      );
    }
  }

  const candidates = listPlatformEntities({
    entityType: query.entityType,
    organizationId: query.organizationId,
    applicationId: query.applicationId,
  });

  const text = query.text?.trim().toLowerCase() ?? "";
  const hits: EntitySearchHit[] = [];

  for (const entity of candidates) {
    const def = getEntityType(entity.entityType);
    if (!def?.capabilities.includes("search")) continue;

    const matchedFields: string[] = [];
    let score = 0;

    if (text) {
      for (const field of def.searchable.fields) {
        const value = fieldValue(entity, field.key);
        if (value == null) continue;
        const asText = String(value).toLowerCase();
        if (asText.includes(text)) {
          matchedFields.push(field.key);
          score += field.key === "displayName" ? 3 : 1;
        }
      }
      if (matchedFields.length === 0) continue;
    } else {
      score = 1;
    }

    if (query.filters) {
      let ok = true;
      for (const [key, expected] of Object.entries(query.filters)) {
        const actual = fieldValue(entity, key);
        if (actual !== expected) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      score += 1;
    }

    hits.push({ entity, score, matchedFields });
  }

  const sortField =
    query.sort?.field ??
    (query.entityType
      ? getEntityType(query.entityType)?.searchable.defaultSort?.field
      : undefined) ??
    "displayName";
  const sortDir =
    query.sort?.direction ??
    (query.entityType
      ? getEntityType(query.entityType)?.searchable.defaultSort?.direction
      : undefined) ??
    "asc";

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const av = String(fieldValue(a.entity, sortField) ?? "");
    const bv = String(fieldValue(b.entity, sortField) ?? "");
    return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
  });

  return hits.slice(0, query.limit ?? 50);
}
