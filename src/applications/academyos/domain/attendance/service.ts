import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type { AttendanceRecordRow } from "@/applications/academyos/domain/repositories";

const VALID_STATUSES = new Set([
  "present",
  "absent",
  "tardy",
  "excused",
  "remote",
]);

export const AttendanceDomainService = {
  recordAttendance(input: {
    studentId: string;
    attendanceDate: string;
    status: string;
    sectionId?: string | null;
    classId?: string | null;
    attendanceCodeId?: string | null;
    notes?: string | null;
    now?: string;
  }): DomainResult<AttendanceRecordRow> {
    const issues = [];
    if (!input.studentId?.trim()) {
      issues.push(issue("required", "Student is required", "studentId"));
    }
    if (!input.attendanceDate?.trim()) {
      issues.push(issue("required", "Date is required", "attendanceDate"));
    }
    if (!VALID_STATUSES.has(input.status)) {
      issues.push(
        issue(
          "invalid_status",
          `Attendance status must be one of: ${[...VALID_STATUSES].join(", ")}`,
          "status"
        )
      );
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("att"),
      studentId: input.studentId,
      sectionId: input.sectionId ?? null,
      classId: input.classId ?? null,
      attendanceDate: input.attendanceDate,
      attendanceCodeId: input.attendanceCodeId ?? null,
      status: input.status,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  },

  attendanceRate(rows: AttendanceRecordRow[]): number {
    if (!rows.length) return 0;
    const presentLike = rows.filter((r) =>
      ["present", "tardy", "remote", "excused"].includes(r.status)
    ).length;
    return Number(((presentLike / rows.length) * 100).toFixed(2));
  },

  isChronicallyAbsent(rows: AttendanceRecordRow[], threshold = 0.1): boolean {
    if (rows.length < 10) return false;
    const absences = rows.filter((r) => r.status === "absent").length;
    return absences / rows.length >= threshold;
  },
};
