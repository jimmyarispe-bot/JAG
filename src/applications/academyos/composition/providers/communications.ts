import { createCommunicationsApplicationService } from "@/applications/academyos/application/communications/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
} from "@/applications/academyos/composition/types";

export function registerCommunicationsProvider(input: {
  repositories: AcademyRepositories;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createCommunicationsApplicationService({
    communicationsRepo: input.repositories.communications,
    entities: input.platformAdapters.entity,
  });
}
