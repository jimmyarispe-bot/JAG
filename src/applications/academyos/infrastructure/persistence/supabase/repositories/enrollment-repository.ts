import type {
  EnrollmentRecord,
  EnrollmentRepository,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import { EnrollmentMapper } from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly db: DatabaseProvider) {}

  private table() {
    return this.db.from(ACADEMYOS_TABLES.enrollments);
  }

  async getById(id: string) {
    const row = await this.table().findById(id);
    return row ? EnrollmentMapper.rowToDomain(row) : null;
  }

  async listByStudent(studentId: string) {
    const rows = await this.table().findMany({ student_id: studentId });
    return rows.map((row) => EnrollmentMapper.rowToDomain(row));
  }

  async save(record: EnrollmentRecord) {
    return EnrollmentMapper.rowToDomain(
      await this.table().upsert(EnrollmentMapper.domainToRow(record))
    );
  }
}
