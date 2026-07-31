import {
  buildAdmissionsDashboard,
  buildAdmissionsSummary,
  createAdmissionsReportingService,
  createApplicantsService,
  listAdmissionsTimeline,
  type AdmissionsReportKind,
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
  const view = searchParams.get("view") ?? "dashboard";

  if (view === "summary") {
    return jsonOk(
      { summary: buildAdmissionsSummary(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (view === "timeline") {
    return jsonOk(
      {
        timeline: listAdmissionsTimeline(
          gate.organizationId,
          searchParams.get("applicantId") ?? undefined
        ),
      },
      { correlationId: gate.correlationId }
    );
  }
  if (view === "report") {
    const kind = (searchParams.get("kind") ??
      "admissions_funnel") as AdmissionsReportKind;
    const format = searchParams.get("format");
    const report = createAdmissionsReportingService().generate(
      gate.organizationId,
      kind
    );
    if (format === "csv") {
      return new Response(report.csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${kind}.csv"`,
          "x-correlation-id": gate.correlationId,
        },
      });
    }
    if (format === "pdf") {
      return new Response(report.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${kind}.pdf"`,
          "x-correlation-id": gate.correlationId,
        },
      });
    }
    return jsonOk({ report }, { correlationId: gate.correlationId });
  }

  const applicants = createApplicantsService().search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    stage: (searchParams.get("stage") as AdmissionsStage) || undefined,
    schoolId: searchParams.get("schoolId") ?? undefined,
    program: searchParams.get("program") ?? undefined,
  });
  const page = paginate(applicants, parsePage(searchParams));

  return jsonOk(
    {
      dashboard: buildAdmissionsDashboard(gate.organizationId),
      ...page,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    applicantId?: string;
    stage?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  if (body.action === "transition") {
    if (!body.applicantId || !body.stage) {
      return jsonError(
        JagErrors.validation("applicantId and stage are required.")
      );
    }
    const result = createApplicantsService().transition({
      organizationId: gate.organizationId,
      applicantId: body.applicantId,
      stage: body.stage as AdmissionsStage,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Applicant not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ applicant: result }, { correlationId: gate.correlationId });
  }

  return jsonError(JagErrors.validation("Unknown action."));
}
