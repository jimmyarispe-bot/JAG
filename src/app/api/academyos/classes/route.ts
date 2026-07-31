import {
  createAcademicOpsReportingService,
  createClassesService,
  createStudentSchedulingService,
  type AcademicOpsReportKind,
  type ClassStatus,
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
  const report = searchParams.get("report") as AcademicOpsReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createAcademicOpsReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  const classId = searchParams.get("classId");
  const service = createClassesService();
  if (classId) {
    return jsonOk(
      { class: service.get(gate.organizationId, classId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    teacherId: searchParams.get("teacherId") ?? undefined,
    campusId: searchParams.get("campusId") ?? undefined,
    program: searchParams.get("program") ?? undefined,
    status: (searchParams.get("status") as ClassStatus) || undefined,
    subject: searchParams.get("subject") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    classId?: string;
    studentId?: string;
    kind?: "Core" | "Intervention" | "Therapy" | "Virtual Tutoring" | "Elective";
    name?: string;
    subject?: string;
    program?: string;
    teacherId?: string;
    teachingAssistantIds?: string[];
    schoolId?: string | null;
    campusId?: string | null;
    gradeLevels?: string[];
    room?: string | null;
    virtualMeetingUrl?: string | null;
    isVirtual?: boolean;
    capacity?: number;
    schedule?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    calendarId?: string | null;
    startsOn?: string;
    allowWaitlist?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "assign_student") {
    if (!body.classId || !body.studentId) {
      return jsonError(
        JagErrors.validation("classId and studentId are required.")
      );
    }
    const result = createStudentSchedulingService().assign({
      organizationId: gate.organizationId,
      classId: body.classId,
      studentId: body.studentId,
      kind: body.kind,
      startsOn: body.startsOn,
      allowWaitlist: body.allowWaitlist,
      createdBy: gate.session.userId,
    });
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
  }

  if (body.action === "duplicate") {
    if (!body.classId) {
      return jsonError(JagErrors.validation("classId is required."));
    }
    const dup = createClassesService().duplicate({
      organizationId: gate.organizationId,
      classId: body.classId,
      createdBy: gate.session.userId,
    });
    if ("error" in dup) return jsonError(JagErrors.validation(dup.error));
    return jsonOk(
      { class: dup },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.name || !body.subject || !body.teacherId || body.capacity == null) {
    return jsonError(
      JagErrors.validation(
        "name, subject, teacherId, and capacity are required."
      )
    );
  }

  const created = createClassesService().create({
    organizationId: gate.organizationId,
    name: body.name,
    subject: body.subject,
    program: body.program,
    teacherId: body.teacherId,
    teachingAssistantIds: body.teachingAssistantIds,
    schoolId: body.schoolId,
    campusId: body.campusId,
    gradeLevels: body.gradeLevels,
    room: body.room,
    virtualMeetingUrl: body.virtualMeetingUrl,
    isVirtual: body.isVirtual,
    capacity: body.capacity,
    schedule: body.schedule ?? [],
    calendarId: body.calendarId,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { class: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    classId?: string;
    action?: "archive" | "cancel";
    name?: string;
    teacherId?: string;
    capacity?: number;
    status?: ClassStatus;
    schedule?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.classId) {
    return jsonError(JagErrors.validation("classId is required."));
  }

  const service = createClassesService();
  if (body.action === "archive") {
    const archived = service.archive({
      organizationId: gate.organizationId,
      classId: body.classId,
      actor: gate.session.userId,
    });
    if (!archived) return jsonError(JagErrors.notFound("Class not found."));
    return jsonOk({ class: archived }, { correlationId: gate.correlationId });
  }
  if (body.action === "cancel") {
    const cancelled = service.cancel({
      organizationId: gate.organizationId,
      classId: body.classId,
      actor: gate.session.userId,
    });
    if (!cancelled) return jsonError(JagErrors.notFound("Class not found."));
    return jsonOk({ class: cancelled }, { correlationId: gate.correlationId });
  }

  const patched = service.patch({
    organizationId: gate.organizationId,
    classId: body.classId,
    name: body.name,
    teacherId: body.teacherId,
    capacity: body.capacity,
    status: body.status,
    schedule: body.schedule,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Class not found."));
  if ("error" in patched) return jsonError(JagErrors.validation(patched.error));
  return jsonOk({ class: patched }, { correlationId: gate.correlationId });
}
