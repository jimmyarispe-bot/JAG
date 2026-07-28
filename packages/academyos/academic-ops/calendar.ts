import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitAcademicOpsEvent } from "./events";
import { DEFAULT_TIMEZONE } from "./rules";
import {
  getCalendar,
  listCalendars,
  upsertCalendar,
} from "./store";
import type {
  AcademicBreak,
  AcademicCalendar,
  AcademicTerm,
  CalendarKind,
} from "./types";
import { CALENDAR_KINDS } from "./types";

export function createAcademicCalendarService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      kind: CalendarKind;
      campusId?: string | null;
      timezone?: string;
      terms?: readonly Omit<AcademicTerm, "id">[];
      breaks?: readonly Omit<AcademicBreak, "id">[];
      createdBy: string;
    }): AcademicCalendar | { error: string } {
      if (!input.name.trim()) return { error: "Calendar name is required." };
      if (!(CALENDAR_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid calendar kind." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Campus",
        twinEntityType: "Organization",
        id,
        label: input.name.trim(),
        kind: "academic_calendar",
        actor: input.createdBy,
        metadata: { calendarKind: input.kind },
      });
      const calendar = upsertCalendar({
        id,
        organizationId: input.organizationId,
        campusId: input.campusId ?? null,
        name: input.name.trim(),
        kind: input.kind,
        timezone: input.timezone ?? DEFAULT_TIMEZONE,
        terms: Object.freeze(
          (input.terms ?? []).map((t) => ({
            id: randomUUID(),
            name: t.name,
            kind: t.kind,
            startsOn: t.startsOn.slice(0, 10),
            endsOn: t.endsOn.slice(0, 10),
          }))
        ),
        breaks: Object.freeze(
          (input.breaks ?? []).map((b) => ({
            id: randomUUID(),
            name: b.name,
            kind: b.kind,
            startsOn: b.startsOn.slice(0, 10),
            endsOn: b.endsOn.slice(0, 10),
          }))
        ),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AcademicCalendar",
        entityId: id,
        eventType: "calendar_created",
        actor: input.createdBy,
        metadata: { kind: input.kind },
      });
      return calendar;
    },

    get: getCalendar,
    list: listCalendars,

    patch(input: {
      organizationId: string;
      calendarId: string;
      name?: string;
      terms?: readonly AcademicTerm[];
      breaks?: readonly AcademicBreak[];
      actor: string;
    }): AcademicCalendar | null {
      const current = getCalendar(input.organizationId, input.calendarId);
      if (!current) return null;
      const next = upsertCalendar({
        ...current,
        name: input.name?.trim() || current.name,
        terms: input.terms ?? current.terms,
        breaks: input.breaks ?? current.breaks,
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AcademicCalendar",
        entityId: next.id,
        eventType: "calendar_updated",
        actor: input.actor,
      });
      return next;
    },
  };
}
