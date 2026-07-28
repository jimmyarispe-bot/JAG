import { randomUUID } from "node:crypto";
import { recordStudentTimeline } from "../sis/audit";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitAcademicOpsEvent } from "./events";
import { getSession, listNotes, upsertNote } from "./store";
import type { ClassroomNote, ClassroomNoteKind } from "./types";
import { CLASSROOM_NOTE_KINDS } from "./types";

export function createClassroomNotesService() {
  return {
    create(input: {
      organizationId: string;
      sessionId: string;
      kind: ClassroomNoteKind;
      body: string;
      studentId?: string | null;
      createdBy: string;
    }): ClassroomNote | { error: string } {
      const session = getSession(input.organizationId, input.sessionId);
      if (!session) return { error: "Session not found." };
      if (!(CLASSROOM_NOTE_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid note kind." };
      }
      if (!input.body.trim()) return { error: "Note body is required." };
      if (
        input.studentId &&
        !session.studentIds.includes(input.studentId)
      ) {
        return { error: "Student is not on this session roster." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Lesson Notes",
        twinEntityType: "Document",
        id,
        label: `${input.kind} — ${session.date}`,
        kind: "lesson_note",
        actor: input.createdBy,
        metadata: {
          sessionId: session.id,
          classId: session.classId,
          studentId: input.studentId ?? "",
        },
      });

      const note = upsertNote({
        id,
        organizationId: input.organizationId,
        sessionId: session.id,
        classId: session.classId,
        studentId: input.studentId ?? null,
        kind: input.kind,
        body: input.body.trim(),
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });

      if (input.studentId) {
        recordStudentTimeline({
          organizationId: input.organizationId,
          studentId: input.studentId,
          kind: "parent_meeting",
          message: `${input.kind}: ${input.body.trim().slice(0, 120)}`,
          actor: input.createdBy,
        });
      }

      emitAcademicOpsEvent({
        organizationId: input.organizationId,
        entityType: "ClassroomNote",
        entityId: id,
        eventType: "lesson_note_created",
        actor: input.createdBy,
        metadata: { sessionId: session.id, kind: input.kind },
      });
      return note;
    },

    list: listNotes,
  };
}
