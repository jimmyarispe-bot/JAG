import type {
  GuardianRecord,
  GuardianRepository,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import { GuardianMapper } from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseGuardianRepository implements GuardianRepository {
  constructor(private readonly db: DatabaseProvider) {}

  private table() {
    return this.db.from(ACADEMYOS_TABLES.guardians);
  }

  async getById(id: string) {
    const row = await this.table().findById(id);
    return row ? GuardianMapper.rowToDomain(row) : null;
  }

  async listByFamily(familyId: string) {
    const rows = await this.table().findMany({ family_id: familyId });
    return rows.map((row) => GuardianMapper.rowToDomain(row));
  }

  async save(record: GuardianRecord) {
    return GuardianMapper.rowToDomain(
      await this.table().upsert(GuardianMapper.domainToRow(record))
    );
  }
}
