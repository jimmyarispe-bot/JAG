import {
  createClassEnrollmentService,
  createSisStudentsService,
  listStudentTimeline,
  type ClassAssignment,
  type StudentLifecycleStatus,
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
  const service = createSisStudentsService();
  const studentId = searchParams.get("studentId");

  if (studentId) {
    return jsonOk(
      {
        student: service.get(gate.organizationId, studentId),
        timeline: listStudentTimeline(gate.organizationId, studentId),
      },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as StudentLifecycleStatus) || undefined,
    campusId: searchParams.get("campusId") ?? undefined,
    program: searchParams.get("program") ?? undefined,
    gradeLevel: searchParams.get("gradeLevel") ?? undefined,
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
    studentId?: string;
    classId?: string;
    className?: string;
    kind?: ClassAssignment["kind"];
    teacherId?: string | null;
    startsOn?: string;
    preferredName?: string;
    legalFirstName?: string;
    legalLastName?: string;
    dateOfBirth?: string;
    stateStudentId?: string | null;
    gradeLevel?: string;
    campusId?: string | null;
    campusName?: string | null;
    program?: string;
    status?: string;
    graduationTarget?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "assign_class") {
    if (!body.studentId || !body.classId || !body.className) {
      return jsonError(
        JagErrors.validation("studentId, classId, and className are required.")
      );
    }
    const assigned = createClassEnrollmentService().assign({
      organizationId: gate.organizationId,
      studentId: body.studentId,
      classId: body.classId,
      className: body.className,
      kind: body.kind ?? "Class",
      teacherId: body.teacherId,
      campusId: body.campusId,
      startsOn: body.startsOn ?? new Date().toISOString().slice(0, 10),
      createdBy: gate.session.userId,
    });
    if ("error" in assigned) {
      return jsonError(JagErrors.validation(assigned.error));
    }
    return jsonOk(
      { assignment: assigned },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const result = createSisStudentsService().create({
    organizationId: gate.organizationId,
    identity: {
      preferredName: body.preferredName ?? "",
      legalFirstName: body.legalFirstName ?? "",
      legalLastName: body.legalLastName ?? "",
      dateOfBirth: body.dateOfBirth ?? "",
      stateStudentId: body.stateStudentId ?? null,
    },
    gradeLevel: body.gradeLevel ?? "K",
    campusId: body.campusId,
    campusName: body.campusName,
    program: body.program ?? "General",
    status: (body.status as StudentLifecycleStatus) ?? "Active",
    graduationTarget: body.graduationTarget,
    createdBy: gate.session.userId,
  });
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk(
    { student: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    status?: string;
    gradeLevel?: string;
    campusId?: string | null;
    campusName?: string | null;
    program?: string;
    medical?: Record<string, string>;
    academic?: {
      readingLevel?: string;
      writingLevel?: string;
      mathLevel?: string;
      structuredLiteracyLevel?: string;
      credits?: number;
      graduationRequirementsMet?: number;
      graduationRequirementsTotal?: number;
    };
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId) {
    return jsonError(JagErrors.validation("studentId is required."));
  }

  const service = createSisStudentsService();
  if (body.status) {
    const result = service.transition({
      organizationId: gate.organizationId,
      studentId: body.studentId,
      status: body.status as StudentLifecycleStatus,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Student not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ student: result }, { correlationId: gate.correlationId });
  }

  const patched = service.patch({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    actor: gate.session.userId,
    gradeLevel: body.gradeLevel,
    campusId: body.campusId,
    campusName: body.campusName,
    program: body.program,
    medical: body.medical,
    academic: body.academic,
  });
  if (!patched) return jsonError(JagErrors.notFound("Student not found."));
  return jsonOk({ student: patched }, { correlationId: gate.correlationId });
}
