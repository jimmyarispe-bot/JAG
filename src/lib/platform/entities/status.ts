import { getPlatformEntity, upsertPlatformEntity } from "@/lib/platform/entities/entity";
import type { EntityStatus, PlatformEntity } from "@/lib/platform/entities/types";

const ALLOWED: Record<EntityStatus, readonly EntityStatus[]> = {
  draft: ["active", "pending", "archived"],
  pending: ["active", "inactive", "archived", "closed"],
  active: ["inactive", "archived", "closed", "pending"],
  inactive: ["active", "archived", "closed"],
  archived: ["active", "inactive"],
  closed: ["archived"],
};

export function canTransitionEntityStatus(
  from: EntityStatus,
  to: EntityStatus
): boolean {
  if (from === to) return false;
  return ALLOWED[from].includes(to);
}

export function setEntityStatus(input: {
  entityType: string;
  entityId: string;
  status: EntityStatus;
  now?: string;
}): PlatformEntity {
  const existing = getPlatformEntity(input.entityType, input.entityId);
  if (!existing) {
    throw new Error(`Entity not found: ${input.entityType}/${input.entityId}`);
  }
  if (!canTransitionEntityStatus(existing.status, input.status)) {
    throw new Error(
      `Invalid entity status transition: ${existing.status} → ${input.status}`
    );
  }
  const now = input.now ?? new Date().toISOString();
  return upsertPlatformEntity({
    ...existing,
    status: input.status,
    updatedAt: now,
    metadata: {
      ...existing.metadata,
      previousStatus: existing.status,
    },
  });
}
