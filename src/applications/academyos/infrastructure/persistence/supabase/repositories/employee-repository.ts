import type {
  EmployeeRecord,
  EmployeeRepository,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import { EmployeeMapper } from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseEmployeeRepository implements EmployeeRepository {
  constructor(private readonly db: DatabaseProvider) {}

  private table() {
    return this.db.from(ACADEMYOS_TABLES.employees);
  }

  async getById(id: string) {
    const row = await this.table().findById(id);
    return row ? EmployeeMapper.rowToDomain(row) : null;
  }

  async listBySchool(schoolId: string) {
    const rows = await this.table().findMany({ school_id: schoolId });
    return rows.map((row) => EmployeeMapper.rowToDomain(row));
  }

  async save(record: EmployeeRecord) {
    return EmployeeMapper.rowToDomain(
      await this.table().upsert(EmployeeMapper.domainToRow(record))
    );
  }

  async archive(id: string) {
    const updated = await this.table().update(id, {
      status: "archived",
      updated_at: new Date().toISOString(),
    });
    return updated ? EmployeeMapper.rowToDomain(updated) : null;
  }
}
