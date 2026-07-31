import { createHRApplicationService } from "@/applications/academyos/application/hr/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";

export function registerHRProvider(input: {
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createHRApplicationService({
    employeeRepo: input.repositories.employee,
    workflows: input.workflowAdapters.hr,
    entities: input.platformAdapters.entity,
  });
}
