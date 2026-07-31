import { registerAcademicProvider } from "@/applications/academyos/composition/providers/academics";
import { registerAdmissionsProvider } from "@/applications/academyos/composition/providers/admissions";
import { registerAdministrationProvider } from "@/applications/academyos/composition/providers/administration";
import { registerAttendanceProvider } from "@/applications/academyos/composition/providers/attendance";
import { registerCommunicationsProvider } from "@/applications/academyos/composition/providers/communications";
import { registerFinanceProvider } from "@/applications/academyos/composition/providers/finance";
import { registerHRProvider } from "@/applications/academyos/composition/providers/hr";
import { registerStudentProvider } from "@/applications/academyos/composition/providers/students";
import type {
  AcademyApplicationServices,
  AcademyPlatformAdapters,
  AcademyRepositories,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";

export type AcademyProviderContext = {
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
};

/**
 * Module providers — each domain registers its application service graph.
 * Composition root is the only caller.
 */
export function registerAcademyProviders(
  ctx: AcademyProviderContext
): AcademyApplicationServices {
  return {
    admissions: registerAdmissionsProvider(ctx),
    students: registerStudentProvider(ctx),
    academics: registerAcademicProvider(ctx),
    attendance: registerAttendanceProvider(ctx),
    finance: registerFinanceProvider(ctx),
    hr: registerHRProvider(ctx),
    communications: registerCommunicationsProvider(ctx),
    administration: registerAdministrationProvider(ctx),
  };
}

export {
  registerAdmissionsProvider,
  registerStudentProvider,
  registerAcademicProvider,
  registerAttendanceProvider,
  registerFinanceProvider,
  registerHRProvider,
  registerCommunicationsProvider,
  registerAdministrationProvider,
};
