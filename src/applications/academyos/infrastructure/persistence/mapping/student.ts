import type { StudentRecord } from "@/applications/academyos/domain/repositories";
import type { DatabaseRow } from "@/applications/academyos/infrastructure/database";
import {
  asNullableString,
  asString,
} from "@/applications/academyos/infrastructure/persistence/serialization";

/** Persistence model — infrastructure-owned, not exposed to domain/UI. */
export type StudentPersistenceModel = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  schoolId: string | null;
  familyId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentSupabaseRow = {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  school_id: string | null;
  family_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export const StudentMapper = {
  rowToPersistence(row: DatabaseRow): StudentPersistenceModel {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      firstName: asString(row.first_name),
      lastName: asString(row.last_name),
      email: asNullableString(row.email),
      schoolId: asNullableString(row.school_id),
      familyId: asNullableString(row.family_id),
      status: asString(row.status, "active"),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },

  persistenceToDomain(model: StudentPersistenceModel): StudentRecord {
    return { ...model };
  },

  domainToPersistence(record: StudentRecord): StudentPersistenceModel {
    return {
      id: record.id,
      displayName: record.displayName,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email ?? null,
      schoolId: record.schoolId ?? null,
      familyId: record.familyId ?? null,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  persistenceToRow(model: StudentPersistenceModel): StudentSupabaseRow {
    return {
      id: model.id,
      display_name: model.displayName,
      first_name: model.firstName,
      last_name: model.lastName,
      email: model.email,
      school_id: model.schoolId,
      family_id: model.familyId,
      status: model.status,
      created_at: model.createdAt,
      updated_at: model.updatedAt,
    };
  },

  domainToRow(record: StudentRecord): StudentSupabaseRow {
    return this.persistenceToRow(this.domainToPersistence(record));
  },

  rowToDomain(row: DatabaseRow): StudentRecord {
    return this.persistenceToDomain(this.rowToPersistence(row));
  },
};
