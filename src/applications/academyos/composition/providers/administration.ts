import { createAdministrationApplicationService } from "@/applications/academyos/application/administration/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
} from "@/applications/academyos/composition/types";

export function registerAdministrationProvider(input: {
  repositories: AcademyRepositories;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createAdministrationApplicationService({
    administrationRepo: input.repositories.administration,
    entities: input.platformAdapters.entity,
  });
}
