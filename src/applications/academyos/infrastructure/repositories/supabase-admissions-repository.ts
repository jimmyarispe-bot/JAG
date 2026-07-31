import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  AdmissionsRepository,
  ApplicationRecord,
  InquiryRecord,
} from "@/applications/academyos/domain/repositories";

function inquiryToRow(record: InquiryRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    email: record.email,
    phone: record.phone ?? null,
    school_id: record.schoolId ?? null,
    source: record.source ?? null,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function inquiryFromRow(row: Record<string, unknown>): InquiryRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    email: pickString(row, "email"),
    phone: pickNullableString(row, "phone"),
    schoolId: pickNullableString(row, "school_id"),
    source: pickNullableString(row, "source"),
    status: pickString(row, "status"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

function applicationToRow(record: ApplicationRecord) {
  return {
    id: record.id,
    display_name: record.displayName,
    inquiry_id: record.inquiryId ?? null,
    student_id: record.studentId ?? null,
    school_id: record.schoolId,
    submitted_on: record.submittedOn ?? null,
    status: record.status,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function applicationFromRow(row: Record<string, unknown>): ApplicationRecord {
  return {
    id: pickString(row, "id"),
    displayName: pickString(row, "display_name"),
    inquiryId: pickNullableString(row, "inquiry_id"),
    studentId: pickNullableString(row, "student_id"),
    schoolId: pickString(row, "school_id"),
    submittedOn: pickNullableString(row, "submitted_on"),
    status: pickString(row, "status"),
    createdAt: pickString(row, "created_at"),
    updatedAt: pickString(row, "updated_at"),
  };
}

export function createSupabaseAdmissionsRepository(
  db: DatabaseProvider
): AdmissionsRepository {
  const inquiries = db.from(ACADEMYOS_TABLES.inquiries);
  const applications = db.from(ACADEMYOS_TABLES.applications);
  return {
    getInquiry: async (id) => {
      const row = await inquiries.findById(id);
      return row ? inquiryFromRow(row) : null;
    },
    saveInquiry: async (record) =>
      inquiryFromRow(await inquiries.upsert(inquiryToRow(record))),
    getApplication: async (id) => {
      const row = await applications.findById(id);
      return row ? applicationFromRow(row) : null;
    },
    saveApplication: async (record) =>
      applicationFromRow(await applications.upsert(applicationToRow(record))),
    listApplicationsBySchool: async (schoolId) => {
      const rows = await applications.findMany({ school_id: schoolId });
      return rows.map(applicationFromRow);
    },
  };
}
