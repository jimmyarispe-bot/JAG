/**
 * Docs domain — created / updated / shared metadata (no body content by default).
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const DOCS_OBJECT_TYPES = ["doc"] as const satisfies readonly GoogleWorkspaceObjectType[];

export function docsEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true || (payload.collaborators as unknown[] | undefined)?.length) {
    return "DOCUMENT_SHARED";
  }
  if (Number(payload.version ?? 1) > 1) return "DOCUMENT_CHANGED";
  return "DOCUMENT_CREATED";
}

export function normalizeDocAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.title,
    ownerEmail: payload.ownerEmail ?? null,
    collaborators: payload.collaborators ?? [],
    shared: Boolean(payload.shared ?? ((payload.collaborators as unknown[] | undefined)?.length ?? 0) > 0),
    lastModifiedAt: payload.lastModifiedAt ?? null,
    createdAt: payload.createdAt ?? null,
  };
}
