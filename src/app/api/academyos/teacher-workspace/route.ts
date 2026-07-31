import {
  createClassroomNotesService,
  createSessionsService,
  createTeacherWorkspaceService,
  type ClassroomNoteKind,
  type SisAttendanceStatus,
} from "@academyos";
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
  const teacherId = searchParams.get("teacherId");
  if (!teacherId) {
    return jsonError(JagErrors.validation("teacherId is required."));
  }

  const workspace = createTeacherWorkspaceService().get({
    organizationId: gate.organizationId,
    teacherId,
    includeMedicalAlerts:
      searchParams.get("includeMedicalAlerts") !== "false",
  });
  if ("error" in workspace) {
    return jsonError(JagErrors.notFound(workspace.error));
  }
  return jsonOk(
    { workspace },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "attendance" | "note";
    teacherId?: string;
    sessionId?: string;
    studentId?: string;
    status?: SisAttendanceStatus;
    noteKind?: ClassroomNoteKind;
    body?: string;
    notes?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "attendance") {
    if (!body.sessionId || !body.studentId || !body.status) {
      return jsonError(
        JagErrors.validation("sessionId, studentId, and status are required.")
      );
    }
    const result = createSessionsService().recordAttendance({
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

  return jsonError(JagErrors.validation("action must be attendance or note."));
}
