/**
 * Query helpers over googleWorkspaceStore — prefer attributes.kind after RC-2.03–2.05 derive.
 */

import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { GoogleWorkspaceStoreSnapshot } from "@/lib/platform/integrations/connectors/google-workspace/services/store";

export function recordsByKind(
  snapshot: GoogleWorkspaceStoreSnapshot,
  kind: string
): GoogleWorkspaceCanonicalEntity[] {
  return snapshot.records.filter((r) => String(r.attributes.kind ?? "") === kind);
}

export function emailsFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  const byKind = recordsByKind(snapshot, "Email");
  if (byKind.length) return byKind;
  return snapshot.byType.message ?? [];
}

export function meetingsFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  const byKind = recordsByKind(snapshot, "Meeting");
  if (byKind.length) return byKind;
  return [
    ...(snapshot.byType.meet ?? []),
    ...(snapshot.byType.calendar_event ?? []),
  ];
}

export function calendarEventsFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  const byKind = recordsByKind(snapshot, "CalendarEvent");
  if (byKind.length) return byKind;
  return snapshot.byType.calendar_event ?? [];
}

export function documentsFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  const byKind = recordsByKind(snapshot, "Document");
  if (byKind.length) return byKind;
  return [
    ...(snapshot.byType.drive_file ?? []),
    ...(snapshot.byType.doc ?? []),
    ...(snapshot.byType.sheet ?? []),
    ...(snapshot.byType.slide ?? []),
  ];
}

export function attendeesFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  return recordsByKind(snapshot, "Attendee");
}

export function tasksFromStore(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceCanonicalEntity[] {
  return snapshot.byType.task ?? [];
}

export function parseIso(value: unknown): number | null {
  if (!value) return null;
  const t = new Date(String(value)).getTime();
  return Number.isNaN(t) ? null : t;
}
