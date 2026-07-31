import {
  createAcademicCalendarService,
  createStudentSchedulingService,
  listAoEnrollments,
  listCalendars,
  type CalendarKind,
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
  const view = searchParams.get("view") ?? "enrollments";

  if (view === "calendars") {
    const items = listCalendars(
      gate.organizationId,
      searchParams.get("campusId")
    );
    return jsonOk(
      { ...paginate(items, parsePage(searchParams)) },
      { correlationId: gate.correlationId }
    );
  }

  const items = listAoEnrollments(gate.organizationId, {
    studentId: searchParams.get("studentId") ?? undefined,
    classId: searchParams.get("classId") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create_calendar" | "assign" | "drop";
    name?: string;
    kind?: CalendarKind;
    campusId?: string | null;
    timezone?: string;
    terms?: {
      name: string;
      kind: "Term" | "Quarter" | "Semester";
      startsOn: string;
      endsOn: string;
    }[];
    breaks?: {
      name: string;
      kind: "Break" | "Holiday" | "Teacher Workday" | "Assessment Window";
      startsOn: string;
      endsOn: string;
    }[];
    classId?: string;
    studentId?: string;
    scheduleKind?:
      | "Core"
      | "Intervention"
      | "Therapy"
      | "Virtual Tutoring"
      | "Elective";
    enrollmentId?: string;
    startsOn?: string;
    endsOn?: string;
    allowWaitlist?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "create_calendar") {
    if (!body.name || !body.kind) {
      return jsonError(JagErrors.validation("name and kind are required."));
    }
    const calendar = createAcademicCalendarService().create({
      organizationId: gate.organizationId,
      name: body.name,
      kind: body.kind,
      campusId: body.campusId,
      timezone: body.timezone,
      terms: body.terms,
      breaks: body.breaks,
      createdBy: gate.session.userId,
    });
    if ("error" in calendar) {
      return jsonError(JagErrors.validation(calendar.error));
    }
    return jsonOk(
      { calendar },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "drop") {
    if (!body.enrollmentId) {
      return jsonError(JagErrors.validation("enrollmentId is required."));
    }
    const dropped = createStudentSchedulingService().drop({
      organizationId: gate.organizationId,
      enrollmentId: body.enrollmentId,
      endsOn: body.endsOn,
      actor: gate.session.userId,
    });
    if (!dropped) {
      return jsonError(JagErrors.notFound("Enrollment not found."));
    }
    return jsonOk({ enrollment: dropped }, { correlationId: gate.correlationId });
  }

  if (!body.classId || !body.studentId) {
    return jsonError(
      JagErrors.validation("classId and studentId are required.")
    );
  }
  const result = createStudentSchedulingService().assign({
    organizationId: gate.organizationId,
    classId: body.classId,
    studentId: body.studentId,
    kind: body.scheduleKind,
    startsOn: body.startsOn,
    allowWaitlist: body.allowWaitlist,
    createdBy: gate.session.userId,
  });
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    calendarId?: string;
    name?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.calendarId) {
    return jsonError(JagErrors.validation("calendarId is required."));
  }
  const patched = createAcademicCalendarService().patch({
    organizationId: gate.organizationId,
    calendarId: body.calendarId,
    name: body.name,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Calendar not found."));
  return jsonOk({ calendar: patched }, { correlationId: gate.correlationId });
}
