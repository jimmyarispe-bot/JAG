import type {
  ApplicationDto,
  CreateApplicationCommand,
  CreateInquiryCommand,
  DecideApplicationCommand,
  InquiryDto,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { AdmissionsDomainService } from "@/applications/academyos/domain/admissions/service";
import type { AdmissionsRepository } from "@/applications/academyos/domain/repositories";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";
import { AdmissionsWorkflowAdapter } from "@/applications/academyos/workflow-adapters";

export type AdmissionsApplicationServiceDeps = {
  admissionsRepo: AdmissionsRepository;
  workflows?: typeof AdmissionsWorkflowAdapter;
  entities?: typeof EntityPlatformAdapter;
};

function toInquiryDto(row: {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  schoolId?: string | null;
  source?: string | null;
  status: string;
}): InquiryDto {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone ?? null,
    schoolId: row.schoolId ?? null,
    source: row.source ?? null,
    status: row.status,
  };
}

function toApplicationDto(row: {
  id: string;
  displayName: string;
  inquiryId?: string | null;
  studentId?: string | null;
  schoolId: string;
  submittedOn?: string | null;
  status: string;
}): ApplicationDto {
  return {
    id: row.id,
    displayName: row.displayName,
    inquiryId: row.inquiryId ?? null,
    studentId: row.studentId ?? null,
    schoolId: row.schoolId,
    submittedOn: row.submittedOn ?? null,
    status: row.status,
  };
}

export type AdmissionsApplicationService = {
  createInquiry(
    ctx: ApplicationContext,
    command: CreateInquiryCommand
  ): Promise<ApplicationResult<InquiryDto>>;
  createApplication(
    ctx: ApplicationContext,
    command: CreateApplicationCommand
  ): Promise<ApplicationResult<ApplicationDto>>;
  decideApplication(
    ctx: ApplicationContext,
    command: DecideApplicationCommand
  ): Promise<ApplicationResult<ApplicationDto>>;
};

export function createAdmissionsApplicationService(
  deps: AdmissionsApplicationServiceDeps
): AdmissionsApplicationService {
  const workflows = deps.workflows ?? AdmissionsWorkflowAdapter;
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createInquiry(ctx, command) {
      const gate = requirePermission(ctx, "academyos.admissions.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AdmissionsDomainService.createInquiry(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.admissionsRepo.saveInquiry(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Inquiry",
        displayName: saved.displayName,
        status: "draft",
        organizationId: ctx.organizationId,
        metadata: { email: saved.email, status: saved.status },
      });
      workflows.startInquiry({
        inquiryId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toInquiryDto(saved));
    },

    async createApplication(ctx, command) {
      const gate = requirePermission(ctx, "academyos.admissions.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AdmissionsDomainService.createApplication(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.admissionsRepo.saveApplication(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Application",
        displayName: saved.displayName,
        status: "pending",
        organizationId: ctx.organizationId,
        metadata: { schoolId: saved.schoolId, status: saved.status },
      });
      workflows.startApplication({
        applicationId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toApplicationDto(saved));
    },

    async decideApplication(ctx, command) {
      const gate = requirePermission(ctx, "academyos.admissions.approve");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const existing = await deps.admissionsRepo.getApplication(
        command.applicationId
      );
      if (!existing) {
        return appFail({
          code: "not_found",
          message: "Application not found",
          path: "applicationId",
        });
      }

      const decided = AdmissionsDomainService.decideApplication(
        existing,
        command.decision
      );
      if (!decided.ok) return fromDomain(decided);

      const saved = await deps.admissionsRepo.saveApplication(decided.value);
      return appOk(toApplicationDto(saved));
    },
  };
}
