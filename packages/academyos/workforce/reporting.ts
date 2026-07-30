import { buildWorkforceSummary } from "./dashboard";
import { createCertificationService } from "./certifications";
import {
  listAbsences,
  listAssignments,
  listEmployees,
  listPayroll,
  listPerformance,
  listPositions,
  listTimesheets,
} from "./store";

export type WorkforceReportKind =
  | "employee_directory"
  | "staffing_by_campus"
  | "teacher_workload"
  | "certification_expirations"
  | "payroll_preparation"
  | "timesheet_summary"
  | "substitute_usage"
  | "professional_development"
  | "performance_reviews";

export type WorkforceReport = {
  readonly kind: WorkforceReportKind;
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly rows: readonly Record<string, string | number>[];
  readonly csv: string;
  readonly pdf: string;
};

function toCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function toPdf(title: string, lines: readonly string[]): string {
  const contentLines = [title, "", ...lines].map((l) =>
    l.replace(/[()\\]/g, "")
  );
  const stream =
    "BT /F1 10 Tf 50 750 Td " +
    contentLines
      .map((l, i) => (i === 0 ? `(${l}) Tj` : `0 -14 Td (${l}) Tj`))
      .join(" ") +
    " ET";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

export function createWorkforceReportingService() {
  return {
    generate(
      organizationId: string,
      kind: WorkforceReportKind
    ): WorkforceReport {
      const generatedAt = new Date().toISOString();
      const summary = buildWorkforceSummary(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title: string = kind;

      switch (kind) {
        case "employee_directory":
          title = "Employee Directory";
          rows = listEmployees(organizationId).map((e) => ({
            employeeNumber: e.employeeNumber,
            name: e.displayName,
            type: e.employmentType,
            status: e.status,
            campus: e.campusName ?? "",
            department: e.department ?? "",
          }));
          break;
        case "staffing_by_campus":
          title = "Staffing by Campus";
          rows = Object.entries(summary.staffingByCampus).map(
            ([campus, count]) => ({ campus, count })
          );
          break;
        case "teacher_workload":
          title = "Teacher Workload";
          rows = listEmployees(organizationId).map((e) => ({
            name: e.displayName,
            assignments: listAssignments(organizationId, e.id).filter(
              (a) => a.endsOn == null
            ).length,
            openPositions: listPositions(organizationId).filter((p) => p.open)
              .length,
          }));
          break;
        case "certification_expirations":
          title = "Certification Expirations";
          rows = createCertificationService()
            .expiringSoon(organizationId)
            .map((c) => ({
              employeeId: c.employeeId,
              name: c.name,
              kind: c.kind,
              expiresOn: c.expiresOn ?? "",
              status: c.status,
            }));
          break;
        case "payroll_preparation": {
          title = "Payroll Preparation";
          const latest = listPayroll(organizationId)[0];
          rows = latest
            ? latest.lines.map((l) => ({
                employee: l.employeeName,
                base: l.baseAmount,
                virtual: l.virtualSessionAmount,
                total: l.total,
              }))
            : [];
          break;
        }
        case "timesheet_summary":
          title = "Timesheet Summary";
          rows = listTimesheets(organizationId).map((t) => ({
            employeeId: t.employeeId,
            week: t.weekStarting,
            minutes: t.totalMinutes,
            status: t.status,
            locked: t.locked ? "yes" : "no",
          }));
          break;
        case "substitute_usage":
          title = "Substitute Usage";
          rows = listAbsences(organizationId).map((a) => ({
            employeeId: a.employeeId,
            startsOn: a.startsOn,
            endsOn: a.endsOn,
            status: a.status,
            substituteId: a.substituteEmployeeId ?? "",
          }));
          break;
        case "professional_development":
          title = "Professional Development";
          rows = listPerformance(organizationId)
            .filter((p) => p.kind === "Professional Development")
            .map((p) => ({
              employeeId: p.employeeId,
              title: p.title,
              reviewedOn: p.reviewedOn,
            }));
          break;
        case "performance_reviews":
          title = "Performance Reviews";
          rows = listPerformance(organizationId).map((p) => ({
            employeeId: p.employeeId,
            kind: p.kind,
            title: p.title,
            reviewedOn: p.reviewedOn,
            memoryLinked: p.memoryLinkId ? "yes" : "no",
          }));
          break;
      }

      const lines = rows.slice(0, 40).map((r) =>
        Object.entries(r)
          .map(([k, v]) => `${k}=${v}`)
          .join(" | ")
      );
      return {
        kind,
        organizationId,
        generatedAt,
        rows: Object.freeze(rows),
        csv: toCsv(rows),
        pdf: toPdf(title, lines),
      };
    },
  };
}
