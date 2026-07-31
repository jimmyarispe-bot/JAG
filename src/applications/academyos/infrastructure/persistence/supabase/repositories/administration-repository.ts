import type {
  AdministrationRepository,
  ProgramRecord,
  SchoolRecord,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  ProgramMapper,
  SchoolMapper,
} from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseAdministrationRepository
  implements AdministrationRepository
{
  constructor(private readonly db: DatabaseProvider) {}

  async getSchool(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.schools).findById(id);
    return row ? SchoolMapper.rowToDomain(row) : null;
  }

  async saveSchool(record: SchoolRecord) {
    return SchoolMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.schools)
        .upsert(SchoolMapper.domainToRow(record))
    );
  }

  async getProgram(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.programs).findById(id);
    return row ? ProgramMapper.rowToDomain(row) : null;
  }

  async saveProgram(record: ProgramRecord) {
    return ProgramMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.programs)
        .upsert(ProgramMapper.domainToRow(record))
    );
  }

  async listSchoolsByOrganization(organizationId: string) {
    const rows = await this.db
      .from(ACADEMYOS_TABLES.schools)
      .findMany({ organization_id: organizationId });
    return rows.map((row) => SchoolMapper.rowToDomain(row));
  }
}
