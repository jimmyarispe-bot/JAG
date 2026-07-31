import {
  buildLearningProgressSummary,
  createLearningProfileService,
  createLearningReportingService,
  createProgressService,
  type LearningReportKind,
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
  const report = searchParams.get("report") as LearningReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createLearningReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  if (searchParams.get("view") === "summary") {
    return jsonOk(
      { summary: buildLearningProgressSummary(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }

  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return jsonError(JagErrors.validation("studentId is required."));
  }
  const profile = createLearningProfileService().get({
    organizationId: gate.organizationId,
    studentId,
  });
  if ("error" in profile) {
    return jsonError(JagErrors.notFound(profile.error));
  }
  return jsonOk({ profile }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "snapshot";
    studentId?: string;
    asOf?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId) {
    return jsonError(JagErrors.validation("studentId is required."));
  }
  const snapshot = createProgressService().snapshot({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    asOf: body.asOf,
    actor: gate.session.userId,
  });
  if ("error" in snapshot) {
    return jsonError(JagErrors.validation(snapshot.error));
  }
  return jsonOk(
    { snapshot },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  return POST(request);
}
