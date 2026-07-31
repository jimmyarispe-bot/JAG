import { createAdmissionsApplicationService } from "@/applications/academyos/application/admissions/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";

export function registerAdmissionsProvider(input: {
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createAdmissionsApplicationService({
    admissionsRepo: input.repositories.admissions,
    workflows: input.workflowAdapters.admissions,
    entities: input.platformAdapters.entity,
  });
}
