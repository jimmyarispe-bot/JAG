import { createFinanceApplicationService } from "@/applications/academyos/application/finance/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";

export function registerFinanceProvider(input: {
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createFinanceApplicationService({
    financeRepo: input.repositories.finance,
    workflows: input.workflowAdapters.finance,
    entities: input.platformAdapters.entity,
  });
}
