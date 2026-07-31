import type {
  AttendanceRecordRow,
  AttendanceRepository,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import { AttendanceMapper } from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseAttendanceRepository implements AttendanceRepository {
  constructor(private readonly db: DatabaseProvider) {}

  private table() {
    return this.db.from(ACADEMYOS_TABLES.attendance);
  }

  async getById(id: string) {
    const row = await this.table().findById(id);
    return row ? AttendanceMapper.rowToDomain(row) : null;
  }

  async listByStudent(studentId: string) {
    const rows = await this.table().findMany({ student_id: studentId });
    return rows.map((row) => AttendanceMapper.rowToDomain(row));
  }

  async listByDate(attendanceDate: string) {
    const rows = await this.table().findMany({ attendance_date: attendanceDate });
    return rows.map((row) => AttendanceMapper.rowToDomain(row));
  }

  async save(record: AttendanceRecordRow) {
    return AttendanceMapper.rowToDomain(
      await this.table().upsert(AttendanceMapper.domainToRow(record))
    );
  }
}
