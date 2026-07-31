import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  AttendanceRecordRow,
  AttendanceRepository,
} from "@/applications/academyos/domain/repositories";

function toRow(record: AttendanceRecordRow) {
  return {
    id: record.id,
    student_id: record.studentId,
    section_id: record.sectionId ?? null,
    class_id: record.classId ?? null,
    attendance_date: record.attendanceDate,
    attendance_code_id: record.attendanceCodeId ?? null,
    status: record.status,
    notes: record.notes ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): AttendanceRecordRow {
  return {
    id: pickString(row, "id"),
    studentId: pickString(row, "student_id"),
    sectionId: pickNullableString(row, "section_id"),
    classId: pickNullableString(row, "class_id"),
    attendanceDate: pickString(row, "attendance_date"),
    attendanceCodeId: pickNullableString(row, "attendance_code_id"),
    status: pickString(row, "status"),
    notes: pickNullableString(row, "notes"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseAttendanceRepository(
  db: DatabaseProvider
): AttendanceRepository {
  const table = db.from(ACADEMYOS_TABLES.attendance);
  return {
    async getById(id) {
      const row = await table.findById(id);
      return row ? fromRow(row) : null;
    },
    async listByStudent(studentId) {
      const rows = await table.findMany({ student_id: studentId });
      return rows.map(fromRow);
    },
    async listByDate(attendanceDate) {
      const rows = await table.findMany({ attendance_date: attendanceDate });
      return rows.map(fromRow);
    },
    async save(record) {
      return fromRow(await table.upsert(toRow(record)));
    },
  };
}
