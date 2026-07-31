import type {
  AssessmentDto,
  CourseDto,
  CreateCourseCommand,
  CreateSectionCommand,
  RecordAssessmentCommand,
  SectionDto,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { AcademicDomainService } from "@/applications/academyos/domain/academics/service";
import type { AcademicRepository } from "@/applications/academyos/domain/repositories";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";

export type AcademicApplicationServiceDeps = {
  academicRepo: AcademicRepository;
  entities?: typeof EntityPlatformAdapter;
};

export type AcademicApplicationService = {
  createCourse(
    ctx: ApplicationContext,
    command: CreateCourseCommand
  ): Promise<ApplicationResult<CourseDto>>;
  createSection(
    ctx: ApplicationContext,
    command: CreateSectionCommand
  ): Promise<ApplicationResult<SectionDto>>;
  recordAssessment(
    ctx: ApplicationContext,
    command: RecordAssessmentCommand
  ): Promise<ApplicationResult<AssessmentDto>>;
};

export function createAcademicApplicationService(
  deps: AcademicApplicationServiceDeps
): AcademicApplicationService {
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createCourse(ctx, command) {
      const gate = requirePermission(ctx, "academyos.learning.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AcademicDomainService.createCourse(command);
      if (!drafted.ok) return fromDomain(drafted);
      const saved = await deps.academicRepo.saveCourse(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Course",
        displayName: saved.displayName,
        organizationId: ctx.organizationId,
        metadata: { code: saved.code },
      });
      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        code: saved.code,
        programId: saved.programId ?? null,
        status: saved.status,
      });
    },

    async createSection(ctx, command) {
      const gate = requirePermission(ctx, "academyos.learning.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AcademicDomainService.createSection(command);
      if (!drafted.ok) return fromDomain(drafted);
      const saved = await deps.academicRepo.saveSection(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Section",
        displayName: saved.displayName,
        organizationId: ctx.organizationId,
        metadata: { courseId: saved.courseId },
      });
      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        courseId: saved.courseId,
        termId: saved.termId ?? null,
        teacherId: saved.teacherId ?? null,
        classroomId: saved.classroomId ?? null,
        status: saved.status,
      });
    },

    async recordAssessment(ctx, command) {
      const gate = requirePermission(ctx, "academyos.assessments.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AcademicDomainService.recordAssessment(command);
      if (!drafted.ok) return fromDomain(drafted);
      const saved = await deps.academicRepo.saveAssessment(drafted.value);
      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        studentId: saved.studentId ?? null,
        sectionId: saved.sectionId ?? null,
        administeredOn: saved.administeredOn ?? null,
        score: saved.score ?? null,
        masteryBand: AcademicDomainService.masteryBand(saved.score),
        status: saved.status,
      });
    },
  };
}
