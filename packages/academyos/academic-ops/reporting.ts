import { createSisAttendanceService } from "../sis/attendance";
import { buildAcademicOperationsSummary } from "./dashboard";
import { hoursBetween } from "./rules";
import {
  getClass,
  getTeacher,
  listClasses,
  listEnrollments,
  listSessions,
  listTeachers,
  listWaitlist,
} from "./store";

export type AcademicOpsReportKind =
  | "teacher_schedules"
  | "classroom_utilization"
  | "session_completion"
  | "attendance_by_class"
  | "teacher_workload"
  | "capacity_analysis"
  | "waitlists"
  | "instructional_hours";

export type AcademicOpsReport = {
  readonly kind: AcademicOpsReportKind;
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

export function createAcademicOpsReportingService() {
  return {
    generate(
      organizationId: string,
      kind: AcademicOpsReportKind
    ): AcademicOpsReport {
      const generatedAt = new Date().toISOString();
      const summary = buildAcademicOperationsSummary(organizationId);
      const classes = listClasses(organizationId);
      const sessions = listSessions(organizationId);
      const teachers = listTeachers(organizationId);
      const attendance = createSisAttendanceService().list(organizationId);
      let rows: Record<string, string | number>[] = [];
      let title: string = kind;

      switch (kind) {
        case "teacher_schedules":
          title = "Teacher Schedules";
          rows = sessions.map((s) => ({
            teacher:
              getTeacher(organizationId, s.substituteTeacherId ?? s.teacherId)
                ?.displayName ?? s.teacherId,
            className: getClass(organizationId, s.classId)?.name ?? s.classId,
            date: s.date,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            status: s.status,
          }));
          break;
        case "classroom_utilization":
          title = "Classroom Utilization";
          rows = classes.map((c) => ({
            className: c.name,
            room: c.room ?? (c.isVirtual ? "Virtual" : ""),
            capacity: c.capacity,
            enrolled: c.currentEnrollment,
            utilization:
              c.capacity === 0
                ? 0
                : Math.round((c.currentEnrollment / c.capacity) * 100),
          }));
          break;
        case "session_completion":
          title = "Session Completion";
          rows = [
            {
              total: sessions.length,
              completed: sessions.filter(
                (s) =>
                  s.status === "Completed" || s.lessonStatus === "Delivered"
              ).length,
              cancelled: sessions.filter((s) => s.status === "Cancelled")
                .length,
              completionRate: summary.sessionCompletionRate,
            },
          ];
          break;
        case "attendance_by_class": {
          title = "Attendance by Class";
          const byClass = new Map<string, { present: number; total: number }>();
          for (const r of attendance) {
            if (!r.classId) continue;
            const cur = byClass.get(r.classId) ?? { present: 0, total: 0 };
            cur.total += 1;
            if (
              r.status === "Present" ||
              r.status === "Remote Present" ||
              r.status === "Late"
            ) {
              cur.present += 1;
            }
            byClass.set(r.classId, cur);
          }
          rows = [...byClass.entries()].map(([classId, v]) => ({
            className: getClass(organizationId, classId)?.name ?? classId,
            present: v.present,
            total: v.total,
            rate:
              v.total === 0 ? 100 : Math.round((v.present / v.total) * 1000) / 10,
          }));
          break;
        }
        case "teacher_workload":
          title = "Teacher Workload";
          rows = teachers.map((t) => {
            const taught = sessions.filter(
              (s) =>
                (s.teacherId === t.id || s.substituteTeacherId === t.id) &&
                s.status !== "Cancelled"
            );
            const classCount = classes.filter((c) => c.teacherId === t.id)
              .length;
            return {
              teacher: t.displayName,
              classes: classCount,
              sessions: taught.length,
              hours: Math.round(
                taught.reduce(
                  (a, s) => a + hoursBetween(s.startsAt, s.endsAt),
                  0
                ) * 100
              ) / 100,
            };
          });
          break;
        case "capacity_analysis":
          title = "Capacity Analysis";
          rows = [
            {
              activeClasses: classes.filter((c) => c.status === "Active").length,
              totalCapacity: classes.reduce((a, c) => a + c.capacity, 0),
              totalEnrolled: classes.reduce(
                (a, c) => a + c.currentEnrollment,
                0
              ),
              utilization: summary.classCapacityUtilization,
              waitlist: summary.waitlistTotal,
            },
          ];
          break;
        case "waitlists":
          title = "Waitlists";
          rows = listWaitlist(organizationId).map((w) => ({
            className: getClass(organizationId, w.classId)?.name ?? w.classId,
            studentId: w.studentId,
            position: w.position,
            createdAt: w.createdAt,
          }));
          break;
        case "instructional_hours":
          title = "Instructional Hours";
          rows = [
            {
              hours: summary.instructionalHoursDelivered,
              completedSessions: sessions.filter(
                (s) =>
                  s.status === "Completed" || s.lessonStatus === "Delivered"
              ).length,
              enrollmentLinks: listEnrollments(organizationId).filter(
                (e) => e.status === "Active"
              ).length,
            },
          ];
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
