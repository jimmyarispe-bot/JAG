import { assertEntityTypeRegistered } from "@/lib/platform/entities/registry";
import type { EntityRef, EntityRelationship } from "@/lib/platform/entities/types";

const relationshipStore = new Map<string, EntityRelationship>();
let relSeq = 0;

export function resetEntityRelationshipsForTests(): void {
  relationshipStore.clear();
  relSeq = 0;
}

function createId(now: string): string {
  relSeq += 1;
  return `ent-rel:${relSeq}:${now}`;
}

/**
 * Generic directional relationship. Platform does not interpret business meaning
 * (Parent→Child vs Teacher→Student are both opaque relationshipType strings).
 */
export function createEntityRelationship(input: {
  from: EntityRef;
  to: EntityRef;
  relationshipType: string;
  organizationId?: string | null;
  primary?: boolean;
  metadata?: Record<string, unknown>;
  now?: string;
}): EntityRelationship {
  assertEntityTypeRegistered(input.from.entityType);
  assertEntityTypeRegistered(input.to.entityType);
  if (!input.relationshipType.trim()) {
    throw new Error("relationshipType is required");
  }
  const now = input.now ?? new Date().toISOString();
  const row: EntityRelationship = {
    id: createId(now),
    from: { ...input.from },
    to: { ...input.to },
    relationshipType: input.relationshipType.trim(),
    organizationId: input.organizationId ?? null,
    primary: Boolean(input.primary),
    status: "active",
    createdAt: now,
    endedAt: null,
    metadata: { ...(input.metadata ?? {}) },
  };
  relationshipStore.set(row.id, row);
  return { ...row, metadata: { ...row.metadata } };
}

export function endEntityRelationship(input: {
  relationshipId: string;
  now?: string;
}): EntityRelationship {
  const existing = relationshipStore.get(input.relationshipId);
  if (!existing) {
    throw new Error(`Relationship not found: ${input.relationshipId}`);
  }
  const now = input.now ?? new Date().toISOString();
  const updated: EntityRelationship = {
    ...existing,
    status: "ended",
    endedAt: now,
  };
  relationshipStore.set(updated.id, updated);
  return { ...updated, metadata: { ...updated.metadata } };
}

export function listRelationshipsFrom(
  from: EntityRef,
  options?: { relationshipType?: string; activeOnly?: boolean }
): EntityRelationship[] {
  return [...relationshipStore.values()]
    .filter(
      (r) =>
        r.from.entityType === from.entityType &&
        r.from.entityId === from.entityId &&
        (options?.relationshipType
          ? r.relationshipType === options.relationshipType
          : true) &&
        (options?.activeOnly === false ? true : r.status === "active")
    )
    .map((r) => ({ ...r, metadata: { ...r.metadata } }));
}

export function listRelationshipsTo(
  to: EntityRef,
  options?: { relationshipType?: string; activeOnly?: boolean }
): EntityRelationship[] {
  return [...relationshipStore.values()]
    .filter(
      (r) =>
        r.to.entityType === to.entityType &&
        r.to.entityId === to.entityId &&
        (options?.relationshipType
          ? r.relationshipType === options.relationshipType
          : true) &&
        (options?.activeOnly === false ? true : r.status === "active")
    )
    .map((r) => ({ ...r, metadata: { ...r.metadata } }));
}

export function listEntityRelationships(
  ref: EntityRef,
  options?: { relationshipType?: string; activeOnly?: boolean }
): EntityRelationship[] {
  const from = listRelationshipsFrom(ref, options);
  const to = listRelationshipsTo(ref, options);
  const byId = new Map<string, EntityRelationship>();
  for (const r of [...from, ...to]) byId.set(r.id, r);
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}
