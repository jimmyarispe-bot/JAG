import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  fromSnakeStudent,
  toSnakeStudent,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  StudentRecord,
  StudentRepository,
} from "@/applications/academyos/domain/repositories";

export function createSupabaseStudentRepository(
  db: DatabaseProvider
): StudentRepository {
  const table = db.from(ACADEMYOS_TABLES.students);
  return {
    async getById(id) {
      const row = await table.findById(id);
      return row ? fromSnakeStudent(row) : null;
    },
    async listBySchool(schoolId) {
      const rows = await table.findMany({ school_id: schoolId });
      return rows.map(fromSnakeStudent);
    },
    async save(record) {
      const saved = await table.upsert(toSnakeStudent(record));
      return fromSnakeStudent(saved);
    },
    async archive(id) {
      const updated = await table.update(id, {
        status: "archived",
        updated_at: new Date().toISOString(),
      });
      return updated ? fromSnakeStudent(updated) : null;
    },
  };
}

export type SupabaseStudentRepository = StudentRepository;
