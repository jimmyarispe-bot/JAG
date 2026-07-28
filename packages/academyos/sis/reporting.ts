import { createSisAttendanceService } from "./attendance";
import { buildStudentSuccessSummary } from "./dashboard";
import {
  listAttendance,
  listStudents,
  listSupportPlans,
} from "./store";

export type SisReportKind =
  | "student_roster"
  | "enrollment_by_campus"
  | "attendance_summary"
  | "chronic_absenteeism"
  | "support_plan_review_schedule"
  | "student_demographics"
  | "graduation_progress"
  | "program_enrollment";

export type SisReport = {
  readonly kind: SisReportKind;
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

export function createSisReportingService() {
  return {
    generate(organizationId: string, kind: SisReportKind): SisReport {
      const generatedAt = new Date().toISOString();
      const students = listStudents(organizationId);
      const success = buildStudentSuccessSummary(organizationId);
      const attendanceDash =
        createSisAttendanceService().dashboard(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title = kind;

      switch (kind) {
        case "student_roster":
          title = "Student Roster";
          rows = students.map((s) => ({
            studentId: s.id,
            name: s.identity.preferredName,
            status: s.status,
            grade: s.gradeLevel,
            program: s.program,
            campus: s.campusName ?? "",
          }));
          break;
        case "enrollment_by_campus":
          title = "Enrollment by Campus";
          rows = Object.entries(success.enrollmentByCampus).map(
            ([campus, count]) => ({ campus, count })
          );
          break;
        case "attendance_summary":
          title = "Attendance Summary";
          rows = [
            { metric: "DailyPresentRate", value: attendanceDash.dailyPresentRate },
            {
              metric: "MonthlyPresentRate",
              value: attendanceDash.monthlyPresentRate,
            },
            {
              metric: "ChronicAbsenteeism",
              value: attendanceDash.chronicAbsenteeism,
            },
          ];
          break;
        case "chronic_absenteeism": {
          title = "Chronic Absenteeism";
          const month = new Date().toISOString().slice(0, 7);
          const byStudent = new Map<string, number>();
          const totals = new Map<string, number>();
          for (const r of listAttendance(organizationId).filter((x) =>
            x.date.startsWith(month)
          )) {
            totals.set(r.studentId, (totals.get(r.studentId) ?? 0) + 1);
            if (
              r.status === "Present" ||
              r.status === "Remote Present" ||
              r.status === "Late"
            ) {
              byStudent.set(r.studentId, (byStudent.get(r.studentId) ?? 0) + 1);
            }
          }
          rows = [...totals.entries()]
            .filter(([id, total]) => {
              if (total < 5) return false;
              const present = byStudent.get(id) ?? 0;
              return present / total < 0.9;
            })
            .map(([studentId, total]) => {
              const s = students.find((x) => x.id === studentId);
              const present = byStudent.get(studentId) ?? 0;
              return {
                studentId,
                name: s?.identity.preferredName ?? studentId,
                presentRate: Math.round((present / total) * 1000) / 10,
                records: total,
              };
            });
          break;
        }
        case "support_plan_review_schedule":
          title = "Support Plan Review Schedule";
          rows = listSupportPlans(organizationId).map((p) => ({
            planId: p.id,
            studentId: p.studentId,
            kind: p.kind,
            title: p.title,
            reviewDate: p.reviewDate ?? "",
            status: p.status,
          }));
          break;
        case "student_demographics":
          title = "Student Demographics";
          rows = students.map((s) => ({
            studentId: s.id,
            grade: s.gradeLevel,
            program: s.program,
            status: s.status,
            campus: s.campusName ?? "",
          }));
          break;
        case "graduation_progress":
          title = "Graduation Progress";
          rows = students.map((s) => ({
            studentId: s.id,
            name: s.identity.preferredName,
            met: s.academic.graduationRequirementsMet,
            total: s.academic.graduationRequirementsTotal,
            credits: s.academic.credits,
            percent:
              Math.round(
                (s.academic.graduationRequirementsMet /
                  (s.academic.graduationRequirementsTotal || 1)) *
                  1000
              ) / 10,
          }));
          break;
        case "program_enrollment": {
          title = "Program Enrollment";
          const byProgram: Record<string, number> = {};
          for (const s of students.filter(
            (x) => x.status === "Active" || x.status === "Enrolled"
          )) {
            byProgram[s.program] = (byProgram[s.program] ?? 0) + 1;
          }
          rows = Object.entries(byProgram).map(([program, count]) => ({
            program,
            count,
          }));
          break;
        }
      }

      return {
        kind,
        organizationId,
        generatedAt,
        rows: Object.freeze(rows),
        csv: toCsv(rows),
        pdf: toPdf(
          title,
          rows.map((r) =>
            Object.entries(r)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          )
        ),
      };
    },
  };
}
