/**
 * Academy-bound compiler ports for contribution kinds without JAG registries.
 * Industry wiring lives here — never inside src/jag/modeling/compiler.
 */

import { registerAcademyPermissions } from "@/applications/academyos/permissions";
import { registerAcademyReports } from "@/applications/academyos/reports";
import type { ApplicationModelCompilerPorts } from "@/jag/modeling";
import { registerAcademyPackageLocalization } from "@/packages/academy/registration/localization/register";
import { registerAcademyPackageTerminology } from "@/packages/academy/registration/terminology/register";
import { ACADEMY_SIS_PERMISSION_PACK } from "@/packages/academy/sis/permissions";
import {
  registerAcademySisPermissionPack,
  registerAcademySisReports,
} from "@/packages/academy/sis/reports";
import { ACADEMY_SCHEDULING_PERMISSION_PACK } from "@/packages/academy/scheduling/permissions";
import {
  registerAcademySchedulingPermissionPack,
  registerAcademySchedulingReports,
} from "@/packages/academy/scheduling/reports";
import { WorkflowService } from "@/jag/workflows";

/**
 * Build ports that materialize Academy package-local catalogs from compiled models.
 */
export function createAcademyModelCompilerPorts(): ApplicationModelCompilerPorts {
  let reportsSeen = false;
  let sisReportsSeen = false;
  let schedulingReportsSeen = false;
  let rolePermissionsSeen = false;

  return {
    registerPermissionPack: (pack) => {
      if (pack.id === ACADEMY_SIS_PERMISSION_PACK.id) {
        registerAcademySisPermissionPack(ACADEMY_SIS_PERMISSION_PACK);
        return;
      }
      if (pack.id === ACADEMY_SCHEDULING_PERMISSION_PACK.id) {
        registerAcademySchedulingPermissionPack(
          ACADEMY_SCHEDULING_PERMISSION_PACK
        );
        return;
      }
      if (pack.id.startsWith("academy.permission.") && !rolePermissionsSeen) {
        registerAcademyPermissions();
        rolePermissionsSeen = true;
      }
    },
    registerReport: (report) => {
      reportsSeen = true;
      if (report.id.startsWith("academy.sis.report.")) sisReportsSeen = true;
      if (report.id.startsWith("academy.scheduling.report.")) {
        schedulingReportsSeen = true;
      }
      // Catalogs are flushed via finalizeAcademyModelCompilePorts(flags)
      void reportsSeen;
      void sisReportsSeen;
      void schedulingReportsSeen;
    },
    registerTerminology: () => {
      registerAcademyPackageTerminology();
    },
    registerLocalization: () => {
      registerAcademyPackageLocalization();
    },
    registerWorkflow: (workflow) => {
      if (!WorkflowService.listDefinitions().some((w) => w.id === workflow.id)) {
        WorkflowService.register(workflow as never);
      }
    },
  };
}

/** Register Academy report catalogs after model compile (idempotent with handwritten). */
export function finalizeAcademyModelCompilePorts(): void {
  registerAcademyReports();
  registerAcademySisReports();
  registerAcademySchedulingReports();
}
