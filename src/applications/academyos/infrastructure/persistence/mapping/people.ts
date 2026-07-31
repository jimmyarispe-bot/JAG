import type {
  EmployeeRecord,
  EnrollmentRecord,
  GuardianRecord,
} from "@/applications/academyos/domain/repositories";
import type { DatabaseRow } from "@/applications/academyos/infrastructure/database";
import {
  asNullableString,
  asString,
} from "@/applications/academyos/infrastructure/persistence/mapping/common";

export const GuardianMapper = {
  rowToDomain(row: DatabaseRow): GuardianRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      email: asString(row.email),
      phone: asNullableString(row.phone),
      familyId: asNullableString(row.family_id),
      relationship: asString(row.relationship),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: GuardianRecord): DatabaseRow {
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
  },
};

export const EnrollmentMapper = {
  rowToDomain(row: DatabaseRow): EnrollmentRecord {
    return {
      id: asString(row.id),
      studentId: asString(row.student_id),
      sectionId: asNullableString(row.section_id),
      classId: asNullableString(row.class_id),
      programId: asNullableString(row.program_id),
      startDate: asString(row.start_date),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: EnrollmentRecord): DatabaseRow {
    return {
      id: record.id,
      student_id: record.studentId,
      section_id: record.sectionId ?? null,
      class_id: record.classId ?? null,
      program_id: record.programId ?? null,
      start_date: record.startDate,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const EmployeeMapper = {
  rowToDomain(row: DatabaseRow): EmployeeRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      email: asString(row.email),
      jobTitle: asNullableString(row.job_title),
      schoolId: asNullableString(row.school_id),
      status: asString(row.status),
      hireDate: asNullableString(row.hire_date),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: EmployeeRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      email: record.email,
      job_title: record.jobTitle ?? null,
      school_id: record.schoolId ?? null,
      status: record.status,
      hire_date: record.hireDate ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};
