import { EntityService } from "@/lib/platform/entities";
import type { EntityStatus } from "@/lib/platform/entities";

function toEntityStatus(status?: string): EntityStatus {
  switch (status) {
    case "inactive":
    case "archived":
    case "draft":
    case "pending":
    case "closed":
    case "active":
      return status;
    default:
      return "active";
  }
}

export type EntityMirrorInput = {
  id: string;
  entityType: string;
  displayName: string;
  status?: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Isolates AcademyOS from Entity Framework implementation details.
 */
export const EntityPlatformAdapter = {
  mirror(input: EntityMirrorInput) {
    if (!EntityService.isRegistered(input.entityType)) {
      return null;
    }
    return EntityService.create({
      id: input.id,
      entityType: input.entityType,
      applicationId: "academyos",
      organizationId: input.organizationId ?? null,
      displayName: input.displayName,
      status: toEntityStatus(input.status),
      metadata: { ...(input.metadata ?? {}), source: "academyos.application" },
    });
  },

  get(entityType: string, id: string) {
    return EntityService.get(entityType, id);
  },

  timeline(entityType: string, id: string) {
    return EntityService.timeline({ entityType, entityId: id });
  },

  recordActivity(input: {
    entityType: string;
    entityId: string;
    title: string;
    eventType: string;
    actorUserId?: string | null;
  }) {
    return EntityService.recordActivity({
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      eventType: input.eventType,
      actorUserId: input.actorUserId ?? null,
      metadata: { application: "academyos" },
    });
  },
};
