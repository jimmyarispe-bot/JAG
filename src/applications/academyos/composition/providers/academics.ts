import { createAcademicApplicationService } from "@/applications/academyos/application/academics/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
} from "@/applications/academyos/composition/types";

export function registerAcademicProvider(input: {
  repositories: AcademyRepositories;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createAcademicApplicationService({
    academicRepo: input.repositories.academic,
    entities: input.platformAdapters.entity,
  });
}
