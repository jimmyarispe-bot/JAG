import type {
  CreateProgramCommand,
  CreateSchoolCommand,
  ProgramDto,
  SchoolDto,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { AdministrationDomainService } from "@/applications/academyos/domain/administration/service";
import type { AdministrationRepository } from "@/applications/academyos/domain/repositories";
import {
  ApiPlatformAdapter,
  EntityPlatformAdapter,
  IntelligencePlatformAdapter,
} from "@/applications/academyos/platform-adapters";

export type AdministrationApplicationServiceDeps = {
  administrationRepo: AdministrationRepository;
  entities?: typeof EntityPlatformAdapter;
};

export type AdministrationApplicationService = {
  createSchool(
    ctx: ApplicationContext,
    command: CreateSchoolCommand
  ): Promise<ApplicationResult<SchoolDto>>;
  createProgram(
    ctx: ApplicationContext,
    command: CreateProgramCommand
  ): Promise<ApplicationResult<ProgramDto>>;
  listIntelligenceSnapshots(ctx: ApplicationContext): ApplicationResult<
    ReturnType<typeof IntelligencePlatformAdapter.snapshot>
  >;
  apiInventory(ctx: ApplicationContext): ApplicationResult<{
    registered: number;
    planned: number;
  }>;
};

export function createAdministrationApplicationService(
  deps: AdministrationApplicationServiceDeps
): AdministrationApplicationService {
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createSchool(ctx, command) {
      const gate = requirePermission(ctx, "academyos.schools.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AdministrationDomainService.createSchool(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.administrationRepo.saveSchool(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "School",
        displayName: saved.displayName,
        organizationId: ctx.organizationId ?? saved.organizationId,
        metadata: { code: saved.code },
      });

      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        code: saved.code,
        organizationId: saved.organizationId,
        status: saved.status,
      });
    },

    async createProgram(ctx, command) {
      const gate = requirePermission(ctx, "academyos.programs.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AdministrationDomainService.createProgram(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.administrationRepo.saveProgram(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Program",
        displayName: saved.displayName,
        organizationId: ctx.organizationId,
        metadata: { code: saved.code },
      });

      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        schoolId: saved.schoolId ?? null,
        code: saved.code ?? null,
        status: saved.status,
      });
    },

    listIntelligenceSnapshots(ctx) {
      const gate = requirePermission(ctx, "academyos.reports.read");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });
      return appOk(IntelligencePlatformAdapter.snapshot());
    },

    apiInventory(ctx) {
      const gate = requirePermission(ctx, "academyos.admin");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });
      return appOk(ApiPlatformAdapter.inventoryCount());
    },
  };
}
