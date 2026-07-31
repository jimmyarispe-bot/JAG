import type {
  StudentRecord,
  StudentRepository,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import { StudentMapper } from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseStudentRepository implements StudentRepository {
  constructor(private readonly db: DatabaseProvider) {}

  private table() {
    return this.db.from(ACADEMYOS_TABLES.students);
  }

  async getById(id: string): Promise<StudentRecord | null> {
    const row = await this.table().findById(id);
    return row ? StudentMapper.rowToDomain(row) : null;
  }

  async listBySchool(schoolId: string): Promise<StudentRecord[]> {
    const rows = await this.table().findMany({ school_id: schoolId });
    return rows.map((row) => StudentMapper.rowToDomain(row));
  }

  async save(record: StudentRecord): Promise<StudentRecord> {
    const saved = await this.table().upsert(StudentMapper.domainToRow(record));
    return StudentMapper.rowToDomain(saved);
  }

  async archive(id: string): Promise<StudentRecord | null> {
    const updated = await this.table().update(id, {
      status: "archived",
      updated_at: new Date().toISOString(),
    });
    return updated ? StudentMapper.rowToDomain(updated) : null;
  }
}
