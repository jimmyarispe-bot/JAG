import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  AssessmentRecord,
  CourseRecord,
  SectionRecord,
} from "@/applications/academyos/domain/repositories";

export const AcademicDomainService = {
  createCourse(input: {
    displayName: string;
    code: string;
    programId?: string | null;
    now?: string;
  }): DomainResult<CourseRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Course name is required", "displayName"));
    }
    if (!input.code?.trim()) {
      return fail(issue("required", "Course code is required", "code"));
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("crs"),
      displayName: input.displayName.trim(),
      code: input.code.trim().toUpperCase(),
      programId: input.programId ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },

  createSection(input: {
    displayName: string;
    courseId: string;
    termId?: string | null;
    teacherId?: string | null;
    classroomId?: string | null;
    now?: string;
  }): DomainResult<SectionRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Section name is required", "displayName"));
    }
    if (!input.courseId?.trim()) {
      return fail(issue("required", "Course is required", "courseId"));
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("sec"),
      displayName: input.displayName.trim(),
      courseId: input.courseId,
      termId: input.termId ?? null,
      teacherId: input.teacherId ?? null,
      classroomId: input.classroomId ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },

  recordAssessment(input: {
    displayName: string;
    studentId?: string | null;
    sectionId?: string | null;
    administeredOn?: string | null;
    score?: number | null;
    now?: string;
  }): DomainResult<AssessmentRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Assessment name is required", "displayName"));
    }
    if (input.score != null && (input.score < 0 || input.score > 100)) {
      return fail(issue("invalid_score", "Score must be between 0 and 100", "score"));
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("asm"),
      displayName: input.displayName.trim(),
      studentId: input.studentId ?? null,
      sectionId: input.sectionId ?? null,
      administeredOn: input.administeredOn ?? now.slice(0, 10),
      score: input.score ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },

  masteryBand(score: number | null | undefined): "below" | "approaching" | "mastery" | "unknown" {
    if (score == null || Number.isNaN(score)) return "unknown";
    if (score >= 80) return "mastery";
    if (score >= 60) return "approaching";
    return "below";
  },
};
