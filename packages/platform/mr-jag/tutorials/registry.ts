/**
 * Tutorial registry — products register page metadata; no hardcoded lesson bodies.
 */

import {
  getTutorial,
  listLearningPaths,
  listTutorials,
  listWalkthroughs,
  upsertLearningPath,
  upsertTutorial,
  upsertWalkthrough,
} from "../store";
import type {
  LearningPath,
  TutorialPageMetadata,
  WalkthroughDefinition,
} from "../types";

export type MrJagContentBundle = {
  readonly tutorials?: readonly TutorialPageMetadata[];
  readonly paths?: readonly LearningPath[];
  readonly walkthroughs?: readonly WalkthroughDefinition[];
};

export function registerMrJagContent(bundle: MrJagContentBundle): {
  readonly tutorials: number;
  readonly paths: number;
  readonly walkthroughs: number;
} {
  let tutorials = 0;
  let paths = 0;
  let walkthroughs = 0;
  for (const t of bundle.tutorials ?? []) {
    upsertTutorial(t);
    tutorials += 1;
  }
  for (const p of bundle.paths ?? []) {
    upsertLearningPath(p);
    paths += 1;
  }
  for (const w of bundle.walkthroughs ?? []) {
    upsertWalkthrough(w);
    walkthroughs += 1;
  }
  return { tutorials, paths, walkthroughs };
}

export function getPageLearningMetadata(
  pageId: string
): TutorialPageMetadata | null {
  return getTutorial(pageId);
}

export function listPageLearningMetadata(filter?: {
  productId?: string;
  persona?: string;
}): readonly TutorialPageMetadata[] {
  return Object.freeze(
    listTutorials().filter((t) => {
      if (filter?.productId && t.productId !== filter.productId) return false;
      if (
        filter?.persona &&
        !t.personas.some(
          (p) => p.toLowerCase() === filter.persona!.toLowerCase()
        )
      )
        return false;
      return true;
    })
  );
}

export function listRegisteredLearningPaths(filter?: {
  persona?: string;
  productId?: string;
}): readonly LearningPath[] {
  return Object.freeze(
    listLearningPaths().filter((p) => {
      if (filter?.productId && p.productId !== filter.productId) return false;
      if (
        filter?.persona &&
        p.persona.toLowerCase() !== filter.persona.toLowerCase()
      )
        return false;
      return true;
    })
  );
}

export function listRegisteredWalkthroughs(filter?: {
  pageId?: string;
  persona?: string;
}): readonly WalkthroughDefinition[] {
  return Object.freeze(
    listWalkthroughs().filter((w) => {
      if (filter?.pageId && w.pageId !== filter.pageId) return false;
      if (
        filter?.persona &&
        !w.personas.some(
          (p) => p.toLowerCase() === filter.persona!.toLowerCase()
        )
      )
        return false;
      return true;
    })
  );
}
