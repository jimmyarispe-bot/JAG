/**
 * Slides domain — presentation metadata (created / updated / shared).
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const SLIDES_OBJECT_TYPES = ["slide"] as const satisfies readonly GoogleWorkspaceObjectType[];

export function slidesEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true) return "DOCUMENT_SHARED";
  if (Number(payload.version ?? 1) > 1) return "DOCUMENT_CHANGED";
  return "DOCUMENT_CREATED";
}

export function normalizeSlideAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.title,
    ownerEmail: payload.ownerEmail ?? null,
    slideCount: payload.slideCount ?? 0,
    shared: Boolean(payload.shared),
    collaborators: payload.collaborators ?? [],
    lastModifiedAt: payload.lastModifiedAt ?? null,
    createdAt: payload.createdAt ?? null,
  };
}
