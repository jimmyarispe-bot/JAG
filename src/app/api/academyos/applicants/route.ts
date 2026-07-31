import {
  createApplicantsService,
  listAdmissionsAudit,
  listAdmissionsTimeline,
  type AdmissionsStage,
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
  const applicantId = searchParams.get("applicantId");
  const service = createApplicantsService();

  if (applicantId) {
    const applicant = service.get(gate.organizationId, applicantId);
    return jsonOk(
      {
        applicant,
        timeline: listAdmissionsTimeline(gate.organizationId, applicantId),
        audit: listAdmissionsAudit(gate.organizationId, applicantId),
      },
      { correlationId: gate.correlationId }
    );
  }

  if (searchParams.get("checkDuplicates") === "1") {
    const duplicates = service.findDuplicates({
      organizationId: gate.organizationId,
      student: {
        firstName: searchParams.get("firstName") ?? "",
        lastName: searchParams.get("lastName") ?? "",
        dateOfBirth: searchParams.get("dateOfBirth") ?? "",
        gradeLevel: searchParams.get("gradeLevel") ?? "",
      },
      guardian: {
        firstName: searchParams.get("guardianFirstName") ?? "",
        lastName: searchParams.get("guardianLastName") ?? "",
        email: searchParams.get("parentEmail") ?? "",
        phone: searchParams.get("parentPhone") ?? "",
        relationship: "Parent",
      },
    });
    return jsonOk({ duplicates }, { correlationId: gate.correlationId });
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    stage: (searchParams.get("stage") as AdmissionsStage) || undefined,
    schoolId: searchParams.get("schoolId") ?? undefined,
    program: searchParams.get("program") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    student?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      gradeLevel?: string;
      email?: string;
    };
    guardian?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      relationship?: string;
    };
    schoolId?: string | null;
    schoolName?: string | null;
    program?: string;
    gradeLevel?: string;
    assignedAdvisor?: string | null;
    force?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  const result = createApplicantsService().create({
    organizationId: gate.organizationId,
    student: {
      firstName: body.student?.firstName ?? "",
      lastName: body.student?.lastName ?? "",
      dateOfBirth: body.student?.dateOfBirth ?? "",
      gradeLevel: body.gradeLevel ?? body.student?.gradeLevel ?? "",
      email: body.student?.email,
    },
    guardian: {
      firstName: body.guardian?.firstName ?? "",
      lastName: body.guardian?.lastName ?? "",
      email: body.guardian?.email ?? "",
      phone: body.guardian?.phone ?? "",
      relationship: body.guardian?.relationship ?? "Parent",
    },
    schoolId: body.schoolId,
    schoolName: body.schoolName,
    program: body.program ?? "General",
    gradeLevel: body.gradeLevel ?? body.student?.gradeLevel ?? "",
    assignedAdvisor: body.assignedAdvisor,
    createdBy: gate.session.userId,
    force: body.force,
  });

  if ("error" in result) {
    return jsonError(
      JagErrors.validation(result.error ?? "Validation failed", {
        ...(result.duplicates
          ? { duplicates: JSON.stringify(result.duplicates) }
          : {}),
      })
    );
  }

  return jsonOk(
    { applicant: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    applicantId?: string;
    stage?: string;
    assignedAdvisor?: string | null;
    scholarshipStatus?: string;
    scholarshipAmount?: number;
    assessmentScheduledAt?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.applicantId) {
    return jsonError(JagErrors.validation("applicantId is required."));
  }

  const service = createApplicantsService();
  if (body.stage) {
    const result = service.transition({
      organizationId: gate.organizationId,
      applicantId: body.applicantId,
      stage: body.stage as AdmissionsStage,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Applicant not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ applicant: result }, { correlationId: gate.correlationId });
  }

  const patched = service.patch({
    organizationId: gate.organizationId,
    applicantId: body.applicantId,
    actor: gate.session.userId,
    assignedAdvisor: body.assignedAdvisor,
    scholarshipStatus: body.scholarshipStatus as never,
    scholarshipAmount: body.scholarshipAmount,
    assessmentScheduledAt: body.assessmentScheduledAt,
  });
  if (!patched) return jsonError(JagErrors.notFound("Applicant not found."));
  return jsonOk({ applicant: patched }, { correlationId: gate.correlationId });
}
