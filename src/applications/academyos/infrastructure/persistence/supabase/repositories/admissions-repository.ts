import type {
  AdmissionsRepository,
  ApplicationRecord,
  InquiryRecord,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  ApplicationMapper,
  InquiryMapper,
} from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseAdmissionsRepository implements AdmissionsRepository {
  constructor(private readonly db: DatabaseProvider) {}

  async getInquiry(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.inquiries).findById(id);
    return row ? InquiryMapper.rowToDomain(row) : null;
  }

  async saveInquiry(record: InquiryRecord) {
    return InquiryMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.inquiries)
        .upsert(InquiryMapper.domainToRow(record))
    );
  }

  async getApplication(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.applications).findById(id);
    return row ? ApplicationMapper.rowToDomain(row) : null;
  }

  async saveApplication(record: ApplicationRecord) {
    return ApplicationMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.applications)
        .upsert(ApplicationMapper.domainToRow(record))
    );
  }

  async listApplicationsBySchool(schoolId: string) {
    const rows = await this.db
      .from(ACADEMYOS_TABLES.applications)
      .findMany({ school_id: schoolId });
    return rows.map((row) => ApplicationMapper.rowToDomain(row));
  }
}
