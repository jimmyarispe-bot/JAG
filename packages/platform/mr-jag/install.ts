/**
 * Install / bootstrap Mr. JAG capability (in-process catalog).
 */

import { bootstrapAcademyCurriculum } from "./academy/curriculum/bootstrap";
import { listLessons } from "./academy/store";
import { MR_JAG_DESCRIPTOR } from "./manifest";
import { bootstrapMrJagCatalog } from "./tutorials/bootstrap";
import { listLearningPaths, listTutorials, listWalkthroughs } from "./store";

export type MrJagInstallResult = {
  readonly id: typeof MR_JAG_DESCRIPTOR.id;
  readonly version: typeof MR_JAG_DESCRIPTOR.version;
  readonly tutorials: number;
  readonly paths: number;
  readonly walkthroughs: number;
};

export function installMrJag(options?: {
  fresh?: boolean;
}): MrJagInstallResult {
  if (options?.fresh) {
    // fresh handled by caller via resetMrJagStoreForTests in unit tests
  }
  const seeded =
    listTutorials().length === 0
      ? bootstrapMrJagCatalog()
      : {
          tutorials: listTutorials().length,
          paths: listLearningPaths().length,
          walkthroughs: listWalkthroughs().length,
        };
  // P-003 — ensure academy curriculum mirrors page registrations.
  if (listLessons().length === 0) {
    bootstrapAcademyCurriculum();
  }
  return {
    id: MR_JAG_DESCRIPTOR.id,
    version: MR_JAG_DESCRIPTOR.version,
    tutorials: seeded.tutorials,
    paths: seeded.paths,
    walkthroughs: seeded.walkthroughs,
  };
}
