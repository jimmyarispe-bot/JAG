import type {
  ApplicationRecord,
  AssessmentRecord,
  AttendanceRecordRow,
  CourseRecord,
  InquiryRecord,
  InvoiceRecord,
  PaymentRecord,
  ProgramRecord,
  ScholarshipRecord,
  SchoolRecord,
  SectionRecord,
  AnnouncementRecord,
  MessageRecord,
} from "@/applications/academyos/domain/repositories";
import type { DatabaseRow } from "@/applications/academyos/infrastructure/database";
import {
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
} from "@/applications/academyos/infrastructure/persistence/mapping/common";

export const AttendanceMapper = {
  rowToDomain(row: DatabaseRow): AttendanceRecordRow {
    return {
      id: asString(row.id),
      studentId: asString(row.student_id),
      sectionId: asNullableString(row.section_id),
      classId: asNullableString(row.class_id),
      attendanceDate: asString(row.attendance_date),
      attendanceCodeId: asNullableString(row.attendance_code_id),
      status: asString(row.status),
      notes: asNullableString(row.notes),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: AttendanceRecordRow): DatabaseRow {
    return {
      id: record.id,
      student_id: record.studentId,
      section_id: record.sectionId ?? null,
      class_id: record.classId ?? null,
      attendance_date: record.attendanceDate,
      attendance_code_id: record.attendanceCodeId ?? null,
      status: record.status,
      notes: record.notes ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const CourseMapper = {
  rowToDomain(row: DatabaseRow): CourseRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      code: asString(row.code),
      programId: asNullableString(row.program_id),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: CourseRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      code: record.code,
      program_id: record.programId ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const SectionMapper = {
  rowToDomain(row: DatabaseRow): SectionRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      courseId: asString(row.course_id),
      termId: asNullableString(row.term_id),
      teacherId: asNullableString(row.teacher_id),
      classroomId: asNullableString(row.classroom_id),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: SectionRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      course_id: record.courseId,
      term_id: record.termId ?? null,
      teacher_id: record.teacherId ?? null,
      classroom_id: record.classroomId ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const AssessmentMapper = {
  rowToDomain(row: DatabaseRow): AssessmentRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      studentId: asNullableString(row.student_id),
      sectionId: asNullableString(row.section_id),
      administeredOn: asNullableString(row.administered_on),
      score: asNullableNumber(row.score),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: AssessmentRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      student_id: record.studentId ?? null,
      section_id: record.sectionId ?? null,
      administered_on: record.administeredOn ?? null,
      score: record.score ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const InvoiceMapper = {
  rowToDomain(row: DatabaseRow): InvoiceRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      studentId: asNullableString(row.student_id),
      familyId: asNullableString(row.family_id),
      amount: asNumber(row.amount),
      dueDate: asNullableString(row.due_date),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: InvoiceRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      student_id: record.studentId ?? null,
      family_id: record.familyId ?? null,
      amount: record.amount,
      due_date: record.dueDate ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const PaymentMapper = {
  rowToDomain(row: DatabaseRow): PaymentRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      invoiceId: asNullableString(row.invoice_id),
      amount: asNumber(row.amount),
      paidOn: asString(row.paid_on),
      method: asNullableString(row.method),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: PaymentRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      invoice_id: record.invoiceId ?? null,
      amount: record.amount,
      paid_on: record.paidOn,
      method: record.method ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const ScholarshipMapper = {
  rowToDomain(row: DatabaseRow): ScholarshipRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      studentId: asString(row.student_id),
      awardAmount: asNumber(row.award_amount),
      status: asString(row.status),
      awardedOn: asNullableString(row.awarded_on),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: ScholarshipRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      student_id: record.studentId,
      award_amount: record.awardAmount,
      status: record.status,
      awarded_on: record.awardedOn ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const InquiryMapper = {
  rowToDomain(row: DatabaseRow): InquiryRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      email: asString(row.email),
      phone: asNullableString(row.phone),
      schoolId: asNullableString(row.school_id),
      source: asNullableString(row.source),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: InquiryRecord): DatabaseRow {
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
  },
};

export const ApplicationMapper = {
  rowToDomain(row: DatabaseRow): ApplicationRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      inquiryId: asNullableString(row.inquiry_id),
      studentId: asNullableString(row.student_id),
      schoolId: asString(row.school_id),
      submittedOn: asNullableString(row.submitted_on),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: ApplicationRecord): DatabaseRow {
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
  },
};

export const MessageMapper = {
  rowToDomain(row: DatabaseRow): MessageRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      body: asNullableString(row.body),
      studentId: asNullableString(row.student_id),
      familyId: asNullableString(row.family_id),
      channel: asString(row.channel),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: MessageRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      body: record.body ?? null,
      student_id: record.studentId ?? null,
      family_id: record.familyId ?? null,
      channel: record.channel,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const AnnouncementMapper = {
  rowToDomain(row: DatabaseRow): AnnouncementRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      body: asNullableString(row.body),
      schoolId: asNullableString(row.school_id),
      audience: asString(row.audience),
      status: asString(row.status),
      publishOn: asNullableString(row.publish_on),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: AnnouncementRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      body: record.body ?? null,
      school_id: record.schoolId ?? null,
      audience: record.audience,
      status: record.status,
      publish_on: record.publishOn ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const SchoolMapper = {
  rowToDomain(row: DatabaseRow): SchoolRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      code: asString(row.code),
      organizationId: asString(row.organization_id),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: SchoolRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      code: record.code,
      organization_id: record.organizationId,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};

export const ProgramMapper = {
  rowToDomain(row: DatabaseRow): ProgramRecord {
    return {
      id: asString(row.id),
      displayName: asString(row.display_name),
      schoolId: asNullableString(row.school_id),
      code: asNullableString(row.code),
      status: asString(row.status),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  },
  domainToRow(record: ProgramRecord): DatabaseRow {
    return {
      id: record.id,
      display_name: record.displayName,
      school_id: record.schoolId ?? null,
      code: record.code ?? null,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  },
};
