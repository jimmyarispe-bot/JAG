import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  EmployeeRecord,
  EmployeeRepository,
} from "@/applications/academyos/domain/repositories";

function toRow(record: EmployeeRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    email: record.email,
    job_title: record.jobTitle ?? null,
    school_id: record.schoolId ?? null,
    status: record.status,
    hire_date: record.hireDate ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): EmployeeRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    email: pickString(row, "email"),
    jobTitle: pickNullableString(row, "job_title"),
    schoolId: pickNullableString(row, "school_id"),
    status: pickString(row, "status"),
    hireDate: pickNullableString(row, "hire_date"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseEmployeeRepository(
  db: DatabaseProvider
): EmployeeRepository {
  const table = db.from(ACADEMYOS_TABLES.employees);
  return {
    async getById(id) {
      const row = await table.findById(id);
      return row ? fromRow(row) : null;
    },
    async listBySchool(schoolId) {
      const rows = await table.findMany({ school_id: schoolId });
      return rows.map(fromRow);
    },
    async save(record) {
      return fromRow(await table.upsert(toRow(record)));
    },
    async archive(id) {
      const updated = await table.update(id, {
        status: "archived",
        updated_at: new Date().toISOString(),
      });
      return updated ? fromRow(updated) : null;
    },
  };
}
