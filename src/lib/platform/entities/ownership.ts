import { getPlatformEntity, upsertPlatformEntity } from "@/lib/platform/entities/entity";
import type { EntityOwner, PlatformEntity } from "@/lib/platform/entities/types";

export function buildEntityOwner(input: {
  userId?: string | null;
  displayName?: string | null;
  role?: string | null;
}): EntityOwner {
  return {
    userId: input.userId ?? null,
    displayName: input.displayName ?? null,
    role: input.role ?? null,
  };
}

export function assignEntityOwner(input: {
  entityType: string;
  entityId: string;
  owner: EntityOwner;
  now?: string;
}): PlatformEntity {
  const existing = getPlatformEntity(input.entityType, input.entityId);
  if (!existing) {
    throw new Error(`Entity not found: ${input.entityType}/${input.entityId}`);
  }
  const now = input.now ?? new Date().toISOString();
  return upsertPlatformEntity({
    ...existing,
    owner: { ...input.owner },
    updatedAt: now,
  });
}

export function clearEntityOwner(input: {
  entityType: string;
  entityId: string;
  now?: string;
}): PlatformEntity {
  const existing = getPlatformEntity(input.entityType, input.entityId);
  if (!existing) {
    throw new Error(`Entity not found: ${input.entityType}/${input.entityId}`);
  }
  const now = input.now ?? new Date().toISOString();
  return upsertPlatformEntity({
    ...existing,
    owner: null,
    updatedAt: now,
  });
}

export function ownerLabel(owner: EntityOwner | null): string {
  if (!owner) return "Unassigned";
  if (owner.displayName?.trim()) return owner.displayName.trim();
  if (owner.role) return owner.role;
  if (owner.userId) return owner.userId;
  return "Unassigned";
}
