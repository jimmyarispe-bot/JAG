import { randomUUID } from "node:crypto";
import { createSisAttendanceService } from "../sis/attendance";
import { recordStudentTimeline } from "../sis/audit";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitAcademicOpsEvent } from "./events";
import {
  combineDateAndTime,
  hoursBetween,
} from "./rules";
import {
  getClass,
  getSession,
  getTeacher,
  listEnrollments,
  listSessions,
  upsertSession,
} from "./store";
import type {
  InstructionalSession,
  LessonStatus,
  SessionStatus,
} from "./types";
import type { SisAttendanceStatus } from "../sis/types";

function datesInRange(startsOn: string, endsOn: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${startsOn.slice(0, 10)}T00:00:00.000Z`);
  const end = new Date(`${endsOn.slice(0, 10)}T00:00:00.000Z`);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function createSessionsService() {
  return {
    generate(input: {
      organizationId: string;
      classId: string;
      startsOn: string;
      endsOn: string;
      createdBy: string;
    }): { sessions: readonly InstructionalSession[] } | { error: string } {
      const cls = getClass(input.organizationId, input.classId);
      if (!cls) return { error: "Class not found." };
      if (cls.schedule.length === 0) {
        return { error: "Class has no schedule slots." };
      }

      const studentIds = listEnrollments(input.organizationId, {
        classId: cls.id,
      })
        .filter((e) => e.status === "Active")
        .map((e) => e.studentId);

      const created: InstructionalSession[] = [];
      const now = new Date().toISOString();

      for (const date of datesInRange(input.startsOn, input.endsOn)) {
        const dow = new Date(`${date}T12:00:00.000Z`).getUTCDay();
        for (const slot of cls.schedule) {
          if (slot.dayOfWeek !== dow) continue;
          const existing = listSessions(input.organizationId, {
            classId: cls.id,
            date,
          }).find(
            (s) =>
              s.startsAt.includes(`T${slot.startTime}`) &&
              s.status !== "Cancelled"
          );
          if (existing) continue;

          const startsAt = combineDateAndTime(date, slot.startTime);
          const endsAt = combineDateAndTime(date, slot.endTime);
          const id = randomUUID();
          const twinId = projectAcademyEntityToTwin({
            organizationId: input.organizationId,
            academyEntity: "Session",
            twinEntityType: "Event",
            id,
            label: `${cls.name} @ ${date}`,
            kind: "instructional_session",
            actor: input.createdBy,
            metadata: { classId: cls.id, teacherId: cls.teacherId },
          });
          const session = upsertSession({
            id,
            organizationId: input.organizationId,
            classId: cls.id,
            date,
            startsAt,
            endsAt,
            teacherId: cls.teacherId,
            substituteTeacherId: null,
            studentIds: Object.freeze([...studentIds]),
            status: "Scheduled",
            lessonStatus: "Planned",
            notes: "",
            makeUpForSessionId: null,
            twinEntityId: twinId,
            createdAt: now,
            updatedAt: now,
            createdBy: input.createdBy,
          });
          created.push(session);
        }
      }

      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "AoClass",
        entityId: cls.id,
        eventType: "sessions_generated",
        actor: input.createdBy,
        metadata: { count: String(created.length) },
      });
      return { sessions: Object.freeze(created) };
    },

    get: getSession,
    list: listSessions,

    cancel(input: {
      organizationId: string;
      sessionId: string;
      actor: string;
      notes?: string;
    }): InstructionalSession | null {
      const current = getSession(input.organizationId, input.sessionId);
      if (!current) return null;
      const next = upsertSession({
        ...current,
        status: "Cancelled",
        notes: input.notes ?? current.notes,
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "InstructionalSession",
        entityId: next.id,
        eventType: "session_cancelled",
        actor: input.actor,
      });
      return next;
    },

    reschedule(input: {
      organizationId: string;
      sessionId: string;
      date: string;
      startsAt: string;
      endsAt: string;
      actor: string;
    }): InstructionalSession | null {
      const current = getSession(input.organizationId, input.sessionId);
      if (!current) return null;
      const next = upsertSession({
        ...current,
        date: input.date.slice(0, 10),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: "Rescheduled",
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "InstructionalSession",
        entityId: next.id,
        eventType: "session_rescheduled",
        actor: input.actor,
      });
      return next;
    },

    substitute(input: {
      organizationId: string;
      sessionId: string;
      substituteTeacherId: string;
      actor: string;
    }): InstructionalSession | { error: string } | null {
      const current = getSession(input.organizationId, input.sessionId);
      if (!current) return null;
      if (!getTeacher(input.organizationId, input.substituteTeacherId)) {
        return { error: "Substitute teacher not found." };
      }
      const next = upsertSession({
        ...current,
        substituteTeacherId: input.substituteTeacherId,
        updatedAt: new Date().toISOString(),
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "InstructionalSession",
        entityId: next.id,
        eventType: "session_substitute",
        actor: input.actor,
        metadata: { substituteTeacherId: input.substituteTeacherId },
      });
      return next;
    },

    makeUp(input: {
      organizationId: string;
      sessionId: string;
      date: string;
      startsAt: string;
      endsAt: string;
      actor: string;
    }): InstructionalSession | { error: string } {
      const original = getSession(input.organizationId, input.sessionId);
      if (!original) return { error: "Original session not found." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Session",
        twinEntityType: "Event",
        id,
        label: `Make-up for ${original.id}`,
        kind: "makeup_session",
        actor: input.actor,
      });
      const session = upsertSession({
        id,
        organizationId: input.organizationId,
        classId: original.classId,
        date: input.date.slice(0, 10),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        teacherId: original.teacherId,
        substituteTeacherId: null,
        studentIds: original.studentIds,
        status: "Make-up",
        lessonStatus: "Planned",
        notes: `Make-up for session ${original.id}`,
        makeUpForSessionId: original.id,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.actor,
      });
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "InstructionalSession",
        entityId: id,
        eventType: "session_makeup",
        actor: input.actor,
        metadata: { originalSessionId: original.id },
      });
      return session;
    },

    complete(input: {
      organizationId: string;
      sessionId: string;
      lessonStatus?: LessonStatus;
      notes?: string;
      actor: string;
    }): InstructionalSession | null {
      const current = getSession(input.organizationId, input.sessionId);
      if (!current) return null;
      return upsertSession({
        ...current,
        status: "Completed",
        lessonStatus: input.lessonStatus ?? "Delivered",
        notes: input.notes ?? current.notes,
        updatedAt: new Date().toISOString(),
      });
    },

    recordAttendance(input: {
      organizationId: string;
      sessionId: string;
      studentId: string;
      status: SisAttendanceStatus;
      actor: string;
      notes?: string;
    }): { ok: true } | { error: string } {
      const session = getSession(input.organizationId, input.sessionId);
      if (!session) return { error: "Session not found." };
      if (!session.studentIds.includes(input.studentId)) {
        return { error: "Student is not on this session roster." };
      }
      const cls = getClass(input.organizationId, session.classId);
      const recorded = createSisAttendanceService().record({
        organizationId: input.organizationId,
        studentId: input.studentId,
        date: session.date,
        status: input.status,
        classId: session.classId,
        teacherId: session.substituteTeacherId ?? session.teacherId,
        campusId: cls?.campusId ?? null,
        notes: input.notes ?? `Session ${session.id}`,
        createdBy: input.actor,
      });
      if ("error" in recorded) return recorded;
      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "InstructionalSession",
        entityId: session.id,
        eventType: "session_attendance",
        actor: input.actor,
        metadata: { studentId: input.studentId, status: input.status },
      });
      return { ok: true };
    },

    instructionalHours(organizationId: string): number {
      return listSessions(organizationId)
        .filter((s) => s.status === "Completed" || s.lessonStatus === "Delivered")
        .reduce((sum, s) => sum + hoursBetween(s.startsAt, s.endsAt), 0);
    },

    patch(input: {
      organizationId: string;
      sessionId: string;
      status?: SessionStatus;
      lessonStatus?: LessonStatus;
      notes?: string;
      actor: string;
    }): InstructionalSession | null {
      const current = getSession(input.organizationId, input.sessionId);
      if (!current) return null;
      const next = upsertSession({
        ...current,
        status: input.status ?? current.status,
        lessonStatus: input.lessonStatus ?? current.lessonStatus,
        notes: input.notes ?? current.notes,
        updatedAt: new Date().toISOString(),
      });
      if (input.notes) {
        for (const studentId of next.studentIds) {
          recordStudentTimeline({
            organizationId: input.organizationId,
            studentId,
            kind: "assessment",
            message: `Session note updated for ${next.date}.`,
            actor: input.actor,
          });
        }
      }
      return next;
    },
  };
}
