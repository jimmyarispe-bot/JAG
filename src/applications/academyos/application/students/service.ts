import type {
  CreateStudentCommand,
  EnrollStudentCommand,
  EnrollmentDto,
  StudentDto,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import type {
  EnrollmentRepository,
  StudentRepository,
} from "@/applications/academyos/domain/repositories";
import { StudentDomainService } from "@/applications/academyos/domain/students/service";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";
import { StudentWorkflowAdapter } from "@/applications/academyos/workflow-adapters";

export type StudentApplicationServiceDeps = {
  studentRepo: StudentRepository;
  enrollmentRepo: EnrollmentRepository;
  workflows?: typeof StudentWorkflowAdapter;
  entities?: typeof EntityPlatformAdapter;
};

function toStudentDto(row: {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  schoolId?: string | null;
  familyId?: string | null;
  status: string;
}): StudentDto {
  return {
    id: row.id,
    displayName: row.displayName,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? null,
    schoolId: row.schoolId ?? null,
    familyId: row.familyId ?? null,
    status: row.status,
  };
}

function toEnrollmentDto(row: {
  id: string;
  studentId: string;
  sectionId?: string | null;
  classId?: string | null;
  programId?: string | null;
  startDate: string;
  status: string;
}): EnrollmentDto {
  return {
    id: row.id,
    studentId: row.studentId,
    sectionId: row.sectionId ?? null,
    classId: row.classId ?? null,
    programId: row.programId ?? null,
    startDate: row.startDate,
    status: row.status,
  };
}

export type StudentApplicationService = {
  createStudent(
    ctx: ApplicationContext,
    command: CreateStudentCommand
  ): Promise<ApplicationResult<StudentDto>>;
  enrollStudent(
    ctx: ApplicationContext,
    command: EnrollStudentCommand
  ): Promise<ApplicationResult<EnrollmentDto>>;
  activateEnrollment(
    ctx: ApplicationContext,
    enrollmentId: string
  ): Promise<ApplicationResult<{ student: StudentDto; enrollment: EnrollmentDto }>>;
};

export function createStudentApplicationService(
  deps: StudentApplicationServiceDeps
): StudentApplicationService {
  const workflows = deps.workflows ?? StudentWorkflowAdapter;
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createStudent(ctx, command) {
      const gate = requirePermission(ctx, "academyos.students.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = StudentDomainService.createStudent({
        displayName: command.displayName ?? "",
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
        schoolId: command.schoolId,
        familyId: command.familyId,
      });
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.studentRepo.save(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Student",
        displayName: saved.displayName,
        status: "pending",
        organizationId: ctx.organizationId,
        metadata: { status: saved.status },
      });
      workflows.startLifecycle({
        studentId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toStudentDto(saved));
    },

    async enrollStudent(ctx, command) {
      const gate = requirePermission(ctx, "academyos.enrollment.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const student = await deps.studentRepo.getById(command.studentId);
      if (!student) {
        return appFail({
          code: "not_found",
          message: "Student not found",
          path: "studentId",
        });
      }

      const drafted = StudentDomainService.createEnrollment(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.enrollmentRepo.save(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Enrollment",
        displayName: `Enrollment ${saved.id}`,
        status: "draft",
        organizationId: ctx.organizationId,
        metadata: { studentId: saved.studentId, status: saved.status },
      });
      workflows.startEnrollment({
        enrollmentId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toEnrollmentDto(saved));
    },

    async activateEnrollment(ctx, enrollmentId) {
      const gate = requirePermission(ctx, "academyos.enrollment.approve");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const enrollment = await deps.enrollmentRepo.getById(enrollmentId);
      if (!enrollment) {
        return appFail({
          code: "not_found",
          message: "Enrollment not found",
          path: "enrollmentId",
        });
      }
      const student = await deps.studentRepo.getById(enrollment.studentId);
      if (!student) {
        return appFail({ code: "not_found", message: "Student not found" });
      }

      const activated = StudentDomainService.activateEnrollment(
        enrollment,
        student
      );
      if (!activated.ok) return fromDomain(activated);

      const savedEnrollment = await deps.enrollmentRepo.save(
        activated.value.enrollment
      );
      const savedStudent = await deps.studentRepo.save(activated.value.student);

      return appOk({
        student: toStudentDto(savedStudent),
        enrollment: toEnrollmentDto(savedEnrollment),
      });
    },
  };
}
