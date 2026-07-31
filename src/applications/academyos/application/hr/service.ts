import type {
  CreateApplicantCommand,
  EmployeeDto,
  HireEmployeeCommand,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import type { EmployeeRepository } from "@/applications/academyos/domain/repositories";
import { HRDomainService } from "@/applications/academyos/domain/hr/service";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";
import { HRWorkflowAdapter } from "@/applications/academyos/workflow-adapters";

export type HRApplicationServiceDeps = {
  employeeRepo: EmployeeRepository;
  workflows?: typeof HRWorkflowAdapter;
  entities?: typeof EntityPlatformAdapter;
};

export type HRApplicationService = {
  createApplicant(
    ctx: ApplicationContext,
    command: CreateApplicantCommand
  ): Promise<ApplicationResult<EmployeeDto>>;
  hire(
    ctx: ApplicationContext,
    command: HireEmployeeCommand
  ): Promise<ApplicationResult<EmployeeDto>>;
  activate(
    ctx: ApplicationContext,
    employeeId: string
  ): Promise<ApplicationResult<EmployeeDto>>;
};

function toDto(row: {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string | null;
  schoolId?: string | null;
  status: string;
  hireDate?: string | null;
}): EmployeeDto {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    jobTitle: row.jobTitle ?? null,
    schoolId: row.schoolId ?? null,
    status: row.status,
    hireDate: row.hireDate ?? null,
  };
}

export function createHRApplicationService(
  deps: HRApplicationServiceDeps
): HRApplicationService {
  const workflows = deps.workflows ?? HRWorkflowAdapter;
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createApplicant(ctx, command) {
      const gate = requirePermission(ctx, "academyos.hr.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = HRDomainService.createApplicant(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.employeeRepo.save(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Employee",
        displayName: saved.displayName,
        status: "pending",
        organizationId: ctx.organizationId,
        metadata: { status: saved.status },
      });
      workflows.startHiring({
        employeeId: saved.id,
        actorUserId: ctx.actorUserId,
        organizationId: ctx.organizationId,
        grantedPermissions: ctx.permissions,
      });

      return appOk(toDto(saved));
    },

    async hire(ctx, command) {
      const gate = requirePermission(ctx, "academyos.hr.approve");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const existing = await deps.employeeRepo.getById(command.employeeId);
      if (!existing) {
        return appFail({
          code: "not_found",
          message: "Employee not found",
          path: "employeeId",
        });
      }

      const hired = HRDomainService.hire(existing, command.hireDate);
      if (!hired.ok) return fromDomain(hired);

      const saved = await deps.employeeRepo.save(hired.value);
      return appOk(toDto(saved));
    },

    async activate(ctx, employeeId) {
      const gate = requirePermission(ctx, "academyos.hr.update");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const existing = await deps.employeeRepo.getById(employeeId);
      if (!existing) {
        return appFail({ code: "not_found", message: "Employee not found" });
      }

      const activated = HRDomainService.activate(existing);
      if (!activated.ok) return fromDomain(activated);

      const saved = await deps.employeeRepo.save(activated.value);
      return appOk(toDto(saved));
    },
  };
}
