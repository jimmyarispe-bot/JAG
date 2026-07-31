import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  GuardianRecord,
  GuardianRepository,
} from "@/applications/academyos/domain/repositories";

function toRow(record: GuardianRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    email: record.email,
    phone: record.phone ?? null,
    family_id: record.familyId ?? null,
    relationship: record.relationship,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function fromRow(row: Record<string, unknown>): GuardianRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    email: pickString(row, "email"),
    phone: pickNullableString(row, "phone"),
    familyId: pickNullableString(row, "family_id"),
    relationship: pickString(row, "relationship"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseGuardianRepository(
  db: DatabaseProvider
): GuardianRepository {
  const table = db.from(ACADEMYOS_TABLES.guardians);
  return {
    async getById(id) {
      const row = await table.findById(id);
      return row ? fromRow(row) : null;
    },
    async listByFamily(familyId) {
      const rows = await table.findMany({ family_id: familyId });
      return rows.map(fromRow);
    },
    async save(record) {
      return fromRow(await table.upsert(toRow(record)));
    },
  };
}
