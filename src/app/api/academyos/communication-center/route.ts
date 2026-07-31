import {
  buildCommunicationsSummary,
  createCommunicationCenterService,
  createCommunicationsReportingService,
  type CommunicationsReportKind,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  jsonOk,
  requireAcademyOsOrg,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);

  if (searchParams.get("summary") === "1") {
    return jsonOk(
      { summary: buildCommunicationsSummary(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }

  const report = searchParams.get("report") as CommunicationsReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createCommunicationsReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  const items = createCommunicationCenterService().timeline({
    organizationId: gate.organizationId,
    studentId: searchParams.get("studentId") ?? undefined,
    familyId: searchParams.get("familyId") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    campusId: searchParams.get("campusId") ?? undefined,
    programId: searchParams.get("programId") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 100) || 100,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}
