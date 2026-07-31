import {
  createSisReportingService,
  listStudentTimeline,
  type SisReportKind,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "report") {
    const kind = (searchParams.get("kind") ??
      "student_roster") as SisReportKind;
    const report = createSisReportingService().generate(
      gate.organizationId,
      kind
    );
    const format = searchParams.get("format");
    if (format === "csv") {
      return new Response(report.csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${kind}.csv"`,
        },
      });
    }
    if (format === "pdf") {
      return new Response(report.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${kind}.pdf"`,
        },
      });
    }
    return jsonOk({ report }, { correlationId: gate.correlationId });
  }

  const studentId = searchParams.get("studentId");
  if (!studentId && searchParams.get("requireStudent") === "1") {
    return jsonError(JagErrors.validation("studentId is required."));
  }
  const items = listStudentTimeline(
    gate.organizationId,
    studentId ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}
