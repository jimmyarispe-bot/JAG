import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  AcademicRepository,
  AssessmentRecord,
  CourseRecord,
  SectionRecord,
} from "@/applications/academyos/domain/repositories";

export function createSupabaseAcademicRepository(
  db: DatabaseProvider
): AcademicRepository {
  const courses = db.from(ACADEMYOS_TABLES.courses);
  const sections = db.from(ACADEMYOS_TABLES.sections);
  const assessments = db.from(ACADEMYOS_TABLES.assessments);

  return {
    getCourse: async (id) => {
      const row = await courses.findById(id);
      return row
        ? {
            id: pickString(row, "id"),
            displayName: pickString(row, "display_name"),
            code: pickString(row, "code"),
            programId: pickNullableString(row, "program_id"),
            status: pickString(row, "status"),
            createdAt: pickString(row, "created_at"),
            updatedAt: pickString(row, "updated_at"),
          }
        : null;
    },
    saveCourse: async (record: CourseRecord) => {
      const saved = await courses.upsert({
        id: record.id,
        display_name: record.displayName,
        code: record.code,
        program_id: record.programId ?? null,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        code: pickString(saved, "code"),
        programId: pickNullableString(saved, "program_id"),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    getSection: async (id) => {
      const row = await sections.findById(id);
      return row
        ? {
            id: pickString(row, "id"),
            displayName: pickString(row, "display_name"),
            courseId: pickString(row, "course_id"),
            termId: pickNullableString(row, "term_id"),
            teacherId: pickNullableString(row, "teacher_id"),
            classroomId: pickNullableString(row, "classroom_id"),
            status: pickString(row, "status"),
            createdAt: pickString(row, "created_at"),
            updatedAt: pickString(row, "updated_at"),
          }
        : null;
    },
    saveSection: async (record: SectionRecord) => {
      const saved = await sections.upsert({
        id: record.id,
        display_name: record.displayName,
        course_id: record.courseId,
        term_id: record.termId ?? null,
        teacher_id: record.teacherId ?? null,
        classroom_id: record.classroomId ?? null,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        courseId: pickString(saved, "course_id"),
        termId: pickNullableString(saved, "term_id"),
        teacherId: pickNullableString(saved, "teacher_id"),
        classroomId: pickNullableString(saved, "classroom_id"),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    getAssessment: async (id) => {
      const row = await assessments.findById(id);
      return row
        ? {
            id: pickString(row, "id"),
            displayName: pickString(row, "display_name"),
            studentId: pickNullableString(row, "student_id"),
            sectionId: pickNullableString(row, "section_id"),
            administeredOn: pickNullableString(row, "administered_on"),
            score: row.score == null ? null : Number(row.score),
            status: pickString(row, "status"),
            createdAt: pickString(row, "created_at"),
            updatedAt: pickString(row, "updated_at"),
          }
        : null;
    },
    saveAssessment: async (record: AssessmentRecord) => {
      const saved = await assessments.upsert({
        id: record.id,
        display_name: record.displayName,
        student_id: record.studentId ?? null,
        section_id: record.sectionId ?? null,
        administered_on: record.administeredOn ?? null,
        score: record.score ?? null,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        studentId: pickNullableString(saved, "student_id"),
        sectionId: pickNullableString(saved, "section_id"),
        administeredOn: pickNullableString(saved, "administered_on"),
        score: saved.score == null ? null : Number(saved.score),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
  };
}
