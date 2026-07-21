/**
 * Sheets domain — workbook metadata only (no cell contents by default).
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const SHEETS_OBJECT_TYPES = ["sheet"] as const satisfies readonly GoogleWorkspaceObjectType[];

export function sheetsEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.shared === true) return "DOCUMENT_SHARED";
  if (Number(payload.version ?? 1) > 1) return "DOCUMENT_CHANGED";
  return "DOCUMENT_CREATED";
}

export function normalizeSheetAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.title,
    ownerEmail: payload.ownerEmail ?? null,
    tabCount: payload.tabCount ?? (payload.tabs as unknown[] | undefined)?.length ?? 0,
    tabs: payload.tabs ?? [],
    shared: Boolean(payload.shared),
    lastModifiedAt: payload.lastModifiedAt ?? null,
    activityCount: payload.activityCount ?? 0,
  };
}
