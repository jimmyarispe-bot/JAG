import {
  createClassroomNotesService,
  createSessionsService,
  type ClassroomNoteKind,
  type LessonStatus,
  type SessionStatus,
  type SisAttendanceStatus,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const service = createSessionsService();
  const sessionId = searchParams.get("sessionId");
  if (sessionId) {
    return jsonOk(
      { session: service.get(gate.organizationId, sessionId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.list(gate.organizationId, {
    classId: searchParams.get("classId") ?? undefined,
    teacherId: searchParams.get("teacherId") ?? undefined,
    date: searchParams.get("date") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "generate"
      | "cancel"
      | "reschedule"
      | "substitute"
      | "makeup"
      | "complete"
      | "attendance"
      | "note";
    classId?: string;
    sessionId?: string;
    startsOn?: string;
    endsOn?: string;
    date?: string;
    startsAt?: string;
    endsAt?: string;
    substituteTeacherId?: string;
    studentId?: string;
    status?: SisAttendanceStatus;
    lessonStatus?: LessonStatus;
    notes?: string;
    noteKind?: ClassroomNoteKind;
    body?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const sessions = createSessionsService();

  if (body.action === "generate") {
    if (!body.classId || !body.startsOn || !body.endsOn) {
      return jsonError(
        JagErrors.validation("classId, startsOn, and endsOn are required.")
      );
    }
    const result = sessions.generate({
      organizationId: gate.organizationId,
      classId: body.classId,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      createdBy: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
  }

  if (body.action === "attendance") {
    if (!body.sessionId || !body.studentId || !body.status) {
      return jsonError(
        JagErrors.validation("sessionId, studentId, and status are required.")
      );
    }
    const result = sessions.recordAttendance({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      studentId: body.studentId,
      status: body.status,
      actor: gate.session.userId,
      notes: body.notes,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
  }

  if (body.action === "note") {
    if (!body.sessionId || !body.noteKind || !body.body) {
      return jsonError(
        JagErrors.validation("sessionId, noteKind, and body are required.")
      );
    }
    const note = createClassroomNotesService().create({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      kind: body.noteKind,
      body: body.body,
      studentId: body.studentId,
      createdBy: gate.session.userId,
    });
    if ("error" in note) return jsonError(JagErrors.validation(note.error));
    return jsonOk(
      { note },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.sessionId) {
    return jsonError(JagErrors.validation("sessionId is required."));
  }

  if (body.action === "cancel") {
    const cancelled = sessions.cancel({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      actor: gate.session.userId,
      notes: body.notes,
    });
    if (!cancelled) return jsonError(JagErrors.notFound("Session not found."));
    return jsonOk({ session: cancelled }, { correlationId: gate.correlationId });
  }

  if (body.action === "reschedule") {
    if (!body.date || !body.startsAt || !body.endsAt) {
      return jsonError(
        JagErrors.validation("date, startsAt, and endsAt are required.")
      );
    }
    const rescheduled = sessions.reschedule({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      date: body.date,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      actor: gate.session.userId,
    });
    if (!rescheduled) {
      return jsonError(JagErrors.notFound("Session not found."));
    }
    return jsonOk(
      { session: rescheduled },
      { correlationId: gate.correlationId }
    );
  }

  if (body.action === "substitute") {
    if (!body.substituteTeacherId) {
      return jsonError(
        JagErrors.validation("substituteTeacherId is required.")
      );
    }
    const result = sessions.substitute({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      substituteTeacherId: body.substituteTeacherId,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Session not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ session: result }, { correlationId: gate.correlationId });
  }

  if (body.action === "makeup") {
    if (!body.date || !body.startsAt || !body.endsAt) {
      return jsonError(
        JagErrors.validation("date, startsAt, and endsAt are required.")
      );
    }
    const makeup = sessions.makeUp({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      date: body.date,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      actor: gate.session.userId,
    });
    if ("error" in makeup) {
      return jsonError(JagErrors.validation(makeup.error));
    }
    return jsonOk(
      { session: makeup },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "complete") {
    const completed = sessions.complete({
      organizationId: gate.organizationId,
      sessionId: body.sessionId,
      lessonStatus: body.lessonStatus,
      notes: body.notes,
      actor: gate.session.userId,
    });
    if (!completed) return jsonError(JagErrors.notFound("Session not found."));
    return jsonOk({ session: completed }, { correlationId: gate.correlationId });
  }

  return jsonError(JagErrors.validation("Unknown or missing action."));
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    sessionId?: string;
    status?: SessionStatus;
    lessonStatus?: LessonStatus;
    notes?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.sessionId) {
    return jsonError(JagErrors.validation("sessionId is required."));
  }
  const patched = createSessionsService().patch({
    organizationId: gate.organizationId,
    sessionId: body.sessionId,
    status: body.status,
    lessonStatus: body.lessonStatus,
    notes: body.notes,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Session not found."));
  return jsonOk({ session: patched }, { correlationId: gate.correlationId });
}
