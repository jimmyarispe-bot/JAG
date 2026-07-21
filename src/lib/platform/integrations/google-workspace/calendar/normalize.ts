/**
 * Normalize Calendar / Meet SoR payloads into canonical attribute bags.
 * Downstream never sees raw Google Calendar API shapes.
 */

import type { CalendarObjectType } from "@/lib/platform/integrations/google-workspace/calendar/object-types";
import type { CalendarAttendeeRef } from "@/lib/platform/integrations/google-workspace/calendar/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

export function parseCalendarAttendees(
  payload: Record<string, unknown>,
  workspaceDomain: string
): CalendarAttendeeRef[] {
  const internalDomain = workspaceDomain.toLowerCase();
  const out: CalendarAttendeeRef[] = [];
  const seen = new Set<string>();

  const raw = payload.attendees;
  if (!Array.isArray(raw)) {
    // Demo payloads often store attendees as email strings.
    for (const emailRaw of asStringArray(raw)) {
      const email = emailRaw.trim().toLowerCase();
      if (!email.includes("@") || seen.has(email)) continue;
      seen.add(email);
      const domain = domainOf(email);
      out.push({
        email,
        displayName: null,
        responseStatus: null,
        optional: false,
        organizer: false,
        domain,
        isInternal: Boolean(domain && domain === internalDomain),
      });
    }
    return out;
  }

  for (const entry of raw) {
    if (typeof entry === "string") {
      const email = entry.trim().toLowerCase();
      if (!email.includes("@") || seen.has(email)) continue;
      seen.add(email);
      const domain = domainOf(email);
      out.push({
        email,
        displayName: null,
        responseStatus: null,
        optional: false,
        organizer: false,
        domain,
        isInternal: Boolean(domain && domain === internalDomain),
      });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    const domain = domainOf(email);
    out.push({
      email,
      displayName: row.displayName ? String(row.displayName) : null,
      responseStatus: row.responseStatus ? String(row.responseStatus) : null,
      optional: Boolean(row.optional),
      organizer: Boolean(row.organizer),
      domain,
      isInternal: Boolean(domain && domain === internalDomain),
    });
  }
  return out;
}

export function normalizeCalendarEventAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const workspaceDomain = String(payload.workspaceDomain ?? "");
  const attendees = parseCalendarAttendees(payload, workspaceDomain);
  const rooms = asStringArray(payload.rooms);
  const title = String(payload.title ?? payload.name ?? "Calendar event");
  const meetingLink =
    payload.meetingLink ?? payload.hangoutLink ?? payload.conferenceLink ?? null;

  return {
    kind: "CalendarEvent",
    title,
    name: title,
    startAt: payload.startAt ?? null,
    endAt: payload.endAt ?? null,
    durationMinutes:
      payload.durationMinutes ??
      (payload.startAt && payload.endAt
        ? Math.max(
            0,
            Math.round(
              (new Date(String(payload.endAt)).getTime() -
                new Date(String(payload.startAt)).getTime()) /
                60_000
            )
          )
        : null),
    attendees,
    attendeeEmails: attendees.map((a) => a.email),
    attendeeCount: Number(payload.attendeeCount ?? attendees.length),
    rooms,
    roomCount: rooms.length,
    recurrence: payload.recurrence ?? (payload.recurring ? "RRULE" : null),
    recurring: Boolean(payload.recurring),
    meetingLink: meetingLink ? String(meetingLink) : null,
    location: payload.location ?? null,
    status: payload.status ?? "confirmed",
    allDay: Boolean(payload.allDay),
    correlationKey: payload.correlationKey ?? null,
    conflictHint: Boolean(payload.conflictHint),
    updated: Boolean(payload.updated),
    version: Number(payload.version ?? 1),
  };
}

export function normalizeMeetSessionAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const participants = asStringArray(payload.participants);
  const name = String(payload.name ?? payload.title ?? "Meet session");
  return {
    kind: "Meeting",
    name,
    title: name,
    calendarEventId: payload.calendarEventId ?? null,
    participants,
    participantCount: Number(
      payload.participantCount ?? participants.length
    ),
    durationMinutes: payload.durationMinutes ?? null,
    startAt: payload.startedAt ?? payload.startAt ?? null,
    endAt: payload.endedAt ?? payload.endAt ?? null,
    meetingLink: payload.meetingLink ?? payload.hangoutLink ?? null,
    version: Number(payload.version ?? 1),
  };
}

export function normalizeCalendarAttributes(
  objectType: CalendarObjectType | string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  switch (objectType) {
    case "calendar_event":
      return normalizeCalendarEventAttributes(payload);
    case "meet":
      return normalizeMeetSessionAttributes(payload);
    default:
      // Backward-compatible: bare payload path used by legacy calendar stub
      return normalizeCalendarEventAttributes(payload);
  }
}
