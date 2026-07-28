import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { recordStudentTimeline } from "./audit";
import { emitSisEvent } from "./events";
import { getStudent, listAttendance, upsertAttendance } from "./store";
import type {
  AttendanceDashboard,
  SisAttendanceRecord,
  SisAttendanceStatus,
} from "./types";
import { ATTENDANCE_STATUSES } from "./types";

const PRESENT_LIKE: readonly SisAttendanceStatus[] = [
  "Present",
  "Remote Present",
  "Late",
];

function presentRate(records: readonly SisAttendanceRecord[]): number {
  if (records.length === 0) return 100;
  const present = records.filter((r) => PRESENT_LIKE.includes(r.status)).length;
  return Math.round((present / records.length) * 1000) / 10;
}

export function createSisAttendanceService() {
  return {
    record(input: {
      organizationId: string;
      studentId: string;
      date: string;
      status: SisAttendanceStatus;
      classId?: string | null;
      teacherId?: string | null;
      campusId?: string | null;
      notes?: string;
      createdBy: string;
    }): SisAttendanceRecord | { error: string } {
      if (!getStudent(input.organizationId, input.studentId)) {
        return { error: "Student not found." };
      }
      if (!(ATTENDANCE_STATUSES as readonly string[]).includes(input.status)) {
        return { error: "Invalid attendance status." };
      }
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Attendance",
        twinEntityType: "Event",
        id,
        label: `Attendance ${input.status}`,
        kind: "sis_attendance",
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          date: input.date,
          status: input.status,
        },
      });
      const row = upsertAttendance({
        id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        date: input.date.slice(0, 10),
        status: input.status,
        classId: input.classId ?? null,
        teacherId: input.teacherId ?? null,
        campusId: input.campusId ?? null,
        notes: input.notes ?? "",
        twinEntityId: twinId,
        createdAt: now,
        createdBy: input.createdBy,
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: input.studentId,
        kind: "attendance",
        message: `${input.date.slice(0, 10)}: ${input.status}.`,
        actor: input.createdBy,
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "SisAttendanceRecord",
        entityId: id,
        eventType: "attendance_recorded",
        actor: input.createdBy,
        metadata: { studentId: input.studentId, status: input.status },
      });
      return row;
    },

    list: listAttendance,

    dashboard(organizationId: string, now = new Date()): AttendanceDashboard {
      const all = listAttendance(organizationId);
      const day = now.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const daily = all.filter((r) => r.date === day);
      const monthly = all.filter((r) => r.date.startsWith(month));

      const byCampus: Record<string, number> = {};
      const byTeacher: Record<string, number> = {};
      const byStatus = Object.fromEntries(
        ATTENDANCE_STATUSES.map((s) => [s, 0])
      ) as Record<SisAttendanceStatus, number>;

      for (const r of monthly) {
        byStatus[r.status] += 1;
        const campus = r.campusId ?? "Unassigned";
        byCampus[campus] = (byCampus[campus] ?? 0) + 1;
        const teacher = r.teacherId ?? "Unassigned";
        byTeacher[teacher] = (byTeacher[teacher] ?? 0) + 1;
      }

      // Chronic absenteeism: student with <90% present in month and >=5 records
      const byStudent = new Map<string, SisAttendanceRecord[]>();
      for (const r of monthly) {
        const list = byStudent.get(r.studentId) ?? [];
        list.push(r);
        byStudent.set(r.studentId, list);
      }
      let chronic = 0;
      for (const rows of byStudent.values()) {
        if (rows.length >= 5 && presentRate(rows) < 90) chronic += 1;
      }

      return {
        dailyPresentRate: presentRate(daily),
        monthlyPresentRate: presentRate(monthly),
        chronicAbsenteeism: chronic,
        byCampus: Object.freeze(byCampus),
        byTeacher: Object.freeze(byTeacher),
        byStatus: Object.freeze(byStatus),
      };
    },

    presentRate,
  };
}
