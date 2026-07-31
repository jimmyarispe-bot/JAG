import {
  createSisAttendanceService,
  createSisReportingService,
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
  const service = createSisAttendanceService();
  if (searchParams.get("view") === "dashboard") {
    return jsonOk(
      { dashboard: service.dashboard(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("view") === "report") {
    const report = createSisReportingService().generate(
      gate.organizationId,
      (searchParams.get("kind") as "attendance_summary") || "attendance_summary"
    );
    const format = searchParams.get("format");
    if (format === "csv") {
      return new Response(report.csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${report.kind}.csv"`,
        },
      });
    }
    if (format === "pdf") {
      return new Response(report.pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${report.kind}.pdf"`,
        },
      });
    }
    return jsonOk({ report }, { correlationId: gate.correlationId });
  }

  const items = service.list(
    gate.organizationId,
    searchParams.get("studentId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    date?: string;
    status?: string;
    classId?: string | null;
    teacherId?: string | null;
    campusId?: string | null;
    notes?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId || !body.date || !body.status) {
    return jsonError(
      JagErrors.validation("studentId, date, and status are required.")
    );
  }
  const result = createSisAttendanceService().record({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    date: body.date,
    status: body.status as SisAttendanceStatus,
    classId: body.classId,
    teacherId: body.teacherId,
    campusId: body.campusId,
    notes: body.notes,
    createdBy: gate.session.userId,
  });
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk(
    { attendance: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
