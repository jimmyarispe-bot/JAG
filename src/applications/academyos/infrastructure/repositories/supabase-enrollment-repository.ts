import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  EnrollmentRecord,
  EnrollmentRepository,
} from "@/applications/academyos/domain/repositories";

function toRow(record: EnrollmentRecord) {
  return {
    id: record.id,
    student_id: record.studentId,
    section_id: record.sectionId ?? null,
    class_id: record.classId ?? null,
    program_id: record.programId ?? null,
    start_date: record.startDate,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): EnrollmentRecord {
  return {
    id: pickString(row, "id"),
    studentId: pickString(row, "student_id"),
    sectionId: pickNullableString(row, "section_id"),
    classId: pickNullableString(row, "class_id"),
    programId: pickNullableString(row, "program_id"),
    startDate: pickString(row, "start_date"),
    status: pickString(row, "status"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseEnrollmentRepository(
  db: DatabaseProvider
): EnrollmentRepository {
  const table = db.from(ACADEMYOS_TABLES.enrollments);
  return {
    async getById(id) {
      const row = await table.findById(id);
      return row ? fromRow(row) : null;
    },
    async listByStudent(studentId) {
      const rows = await table.findMany({ student_id: studentId });
      return rows.map(fromRow);
    },
    async save(record) {
      return fromRow(await table.upsert(toRow(record)));
    },
  };
}
