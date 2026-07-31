import { assertEntityTypeRegistered } from "@/lib/platform/entities/registry";
import type {
  EntityOwner,
  EntityStatus,
  PlatformEntity,
} from "@/lib/platform/entities/types";

/** Framework working set — not a replacement for application tables. */
const entityStore = new Map<string, PlatformEntity>();

function storeKey(entityType: string, id: string): string {
  return `${entityType}:${id}`;
}

export function resetEntityStoreForTests(): void {
  entityStore.clear();
}

export function createPlatformEntity(input: {
  id: string;
  entityType: string;
  applicationId?: string | null;
  organizationId?: string | null;
  displayName: string;
  status?: EntityStatus;
  owner?: EntityOwner | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}): PlatformEntity {
  assertEntityTypeRegistered(input.entityType);
  const now = input.createdAt ?? new Date().toISOString();
  const entity: PlatformEntity = {
    id: input.id,
    entityType: input.entityType,
    applicationId: input.applicationId ?? null,
    organizationId: input.organizationId ?? null,
    displayName: input.displayName,
    status: input.status ?? "active",
    owner: input.owner ?? null,
    createdAt: now,
    updatedAt: input.updatedAt ?? now,
    metadata: { ...(input.metadata ?? {}) },
  };
  entityStore.set(storeKey(entity.entityType, entity.id), entity);
  return { ...entity, metadata: { ...entity.metadata } };
}

export function upsertPlatformEntity(entity: PlatformEntity): PlatformEntity {
  assertEntityTypeRegistered(entity.entityType);
  const stored: PlatformEntity = {
    ...entity,
    metadata: { ...entity.metadata },
    owner: entity.owner ? { ...entity.owner } : null,
  };
  entityStore.set(storeKey(stored.entityType, stored.id), stored);
  return { ...stored, metadata: { ...stored.metadata } };
}

export function getPlatformEntity(
  entityType: string,
  entityId: string
): PlatformEntity | null {
  const hit = entityStore.get(storeKey(entityType, entityId));
  return hit
    ? { ...hit, metadata: { ...hit.metadata }, owner: hit.owner ? { ...hit.owner } : null }
    : null;
}

export function listPlatformEntities(filter?: {
  entityType?: string;
  organizationId?: string | null;
  applicationId?: string | null;
  status?: EntityStatus;
}): PlatformEntity[] {
  let rows = [...entityStore.values()];
  if (filter?.entityType) {
    rows = rows.filter((e) => e.entityType === filter.entityType);
  }
  if (filter?.organizationId !== undefined) {
    rows = rows.filter((e) => e.organizationId === filter.organizationId);
  }
  if (filter?.applicationId !== undefined) {
    rows = rows.filter((e) => e.applicationId === filter.applicationId);
  }
  if (filter?.status) {
    rows = rows.filter((e) => e.status === filter.status);
  }
  return rows
    .map((e) => ({
      ...e,
      metadata: { ...e.metadata },
      owner: e.owner ? { ...e.owner } : null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function toEntityRef(entity: PlatformEntity): {
  entityType: string;
  entityId: string;
} {
  return { entityType: entity.entityType, entityId: entity.id };
}
