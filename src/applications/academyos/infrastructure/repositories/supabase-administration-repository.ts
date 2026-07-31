import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  AdministrationRepository,
  ProgramRecord,
  SchoolRecord,
} from "@/applications/academyos/domain/repositories";

export function createSupabaseAdministrationRepository(
  db: DatabaseProvider
): AdministrationRepository {
  const schools = db.from(ACADEMYOS_TABLES.schools);
  const programs = db.from(ACADEMYOS_TABLES.programs);

  return {
    async getSchool(id) {
      const row = await schools.findById(id);
      return row
        ? {
            id: pickString(row, "id"),
            displayName: pickString(row, "display_name"),
            code: pickString(row, "code"),
            organizationId: pickString(row, "organization_id"),
            status: pickString(row, "status"),
            createdAt: pickString(row, "created_at"),
            updatedAt: pickString(row, "updated_at"),
          }
        : null;
    },
    async saveSchool(record: SchoolRecord) {
      const saved = await schools.upsert({
        id: record.id,
        display_name: record.displayName,
        code: record.code,
        organization_id: record.organizationId,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        code: pickString(saved, "code"),
        organizationId: pickString(saved, "organization_id"),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    async getProgram(id) {
      const row = await programs.findById(id);
      return row
        ? {
            id: pickString(row, "id"),
            displayName: pickString(row, "display_name"),
            schoolId: pickNullableString(row, "school_id"),
            code: pickNullableString(row, "code"),
            status: pickString(row, "status"),
            createdAt: pickString(row, "created_at"),
            updatedAt: pickString(row, "updated_at"),
          }
        : null;
    },
    async saveProgram(record: ProgramRecord) {
      const saved = await programs.upsert({
        id: record.id,
        display_name: record.displayName,
        school_id: record.schoolId ?? null,
        code: record.code ?? null,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        schoolId: pickNullableString(saved, "school_id"),
        code: pickNullableString(saved, "code"),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    async listSchoolsByOrganization(organizationId) {
      const rows = await schools.findMany({ organization_id: organizationId });
      return rows.map((row) => ({
        id: pickString(row, "id"),
        displayName: pickString(row, "display_name"),
        code: pickString(row, "code"),
        organizationId: pickString(row, "organization_id"),
        status: pickString(row, "status"),
        createdAt: pickString(row, "created_at"),
        updatedAt: pickString(row, "updated_at"),
      }));
    },
  };
}
