import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  EnrollmentRecord,
  StudentRecord,
} from "@/applications/academyos/domain/repositories";

export type CreateStudentInput = {
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  schoolId?: string | null;
  familyId?: string | null;
  now?: string;
};

export type CreateEnrollmentInput = {
  studentId: string;
  startDate: string;
  sectionId?: string | null;
  classId?: string | null;
  programId?: string | null;
  now?: string;
};

const ACTIVE_STATUSES = new Set(["active", "enroll"]);

export const StudentDomainService = {
  createStudent(input: CreateStudentInput): DomainResult<StudentRecord> {
    const issues = [];
    if (!input.firstName?.trim()) {
      issues.push(issue("required", "First name is required", "firstName"));
    }
    if (!input.lastName?.trim()) {
      issues.push(issue("required", "Last name is required", "lastName"));
    }
    const displayName =
      input.displayName?.trim() ||
      `${input.firstName?.trim() ?? ""} ${input.lastName?.trim() ?? ""}`.trim();
    if (!displayName) {
      issues.push(issue("required", "Display name is required", "displayName"));
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("stu"),
      displayName,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim().toLowerCase() ?? null,
      schoolId: input.schoolId ?? null,
      familyId: input.familyId ?? null,
      status: "enroll",
      createdAt: now,
      updatedAt: now,
    });
  },

  activateStudent(student: StudentRecord): DomainResult<StudentRecord> {
    if (!["enroll", "leave"].includes(student.status)) {
      return fail(
        issue("invalid_state", `Cannot activate student in status "${student.status}"`)
      );
    }
    return ok({
      ...student,
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  },

  createEnrollment(
    input: CreateEnrollmentInput
  ): DomainResult<EnrollmentRecord> {
    const issues = [];
    if (!input.studentId?.trim()) {
      issues.push(issue("required", "Student is required", "studentId"));
    }
    if (!input.startDate?.trim()) {
      issues.push(issue("required", "Start date is required", "startDate"));
    }
    if (!input.sectionId && !input.classId && !input.programId) {
      issues.push(
        issue(
          "target_required",
          "Enrollment requires a section, class, or program",
          "sectionId"
        )
      );
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("enr"),
      studentId: input.studentId,
      sectionId: input.sectionId ?? null,
      classId: input.classId ?? null,
      programId: input.programId ?? null,
      startDate: input.startDate,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },

  activateEnrollment(
    enrollment: EnrollmentRecord,
    student: StudentRecord
  ): DomainResult<{ enrollment: EnrollmentRecord; student: StudentRecord }> {
    if (!ACTIVE_STATUSES.has(student.status) && student.status !== "enroll") {
      return fail(
        issue("invalid_student", "Student must be enrollable to activate enrollment")
      );
    }
    if (!["draft", "pending"].includes(enrollment.status)) {
      return fail(
        issue(
          "invalid_state",
          `Cannot activate enrollment in status "${enrollment.status}"`
        )
      );
    }
    const now = new Date().toISOString();
    return ok({
      enrollment: { ...enrollment, status: "active", updatedAt: now },
      student: { ...student, status: "active", updatedAt: now },
    });
  },
};
