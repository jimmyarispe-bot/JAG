/**
 * Learning progress — pages, paths, certifications, questions.
 */

import { normalizePersona } from "../personas";
import {
  getLearningProgress,
  listRecentQuestions,
  setLearningProgress,
} from "../store";
import { listRegisteredLearningPaths } from "../tutorials/registry";
import type { LearningProgress, MrJagPersona } from "../types";

export class MrJagProgressService {
  get(organizationId: string, userId: string): LearningProgress | null {
    return getLearningProgress(organizationId, userId);
  }

  ensure(input: {
    organizationId: string;
    userId: string;
    persona?: string | null;
  }): LearningProgress {
    const existing = getLearningProgress(input.organizationId, input.userId);
    if (existing) return existing;
    const persona: MrJagPersona = normalizePersona(input.persona);
    const path =
      listRegisteredLearningPaths({ persona })[0] ?? null;
    return setLearningProgress({
      userId: input.userId,
      organizationId: input.organizationId,
      persona,
      completedPageIds: Object.freeze([]),
      completedWalkthroughIds: Object.freeze([]),
      pathId: path?.id ?? null,
      pathStepIndex: 0,
      certifications: Object.freeze([]),
      recentQuestionIds: Object.freeze([]),
      updatedAt: new Date().toISOString(),
    });
  }

  completePage(input: {
    organizationId: string;
    userId: string;
    pageId: string;
    persona?: string | null;
  }): LearningProgress {
    const current = this.ensure(input);
    const pages = new Set(current.completedPageIds);
    pages.add(input.pageId);
    const path = listRegisteredLearningPaths({
      persona: current.persona,
    }).find((p) => p.id === current.pathId);
    let pathStepIndex = current.pathStepIndex;
    let certifications = [...current.certifications];
    if (path) {
      const idx = path.steps.findIndex((s) => s.pageId === input.pageId);
      if (idx >= 0) pathStepIndex = Math.max(pathStepIndex, idx + 1);
      if (
        path.certificationId &&
        pathStepIndex >= path.steps.length &&
        !certifications.includes(path.certificationId)
      ) {
        certifications.push(path.certificationId);
      }
    }
    return setLearningProgress({
      ...current,
      completedPageIds: Object.freeze([...pages]),
      pathStepIndex,
      certifications: Object.freeze(certifications),
      recentQuestionIds: Object.freeze([
        ...listRecentQuestions(input.userId, 5),
      ]),
      updatedAt: new Date().toISOString(),
    });
  }

  completeWalkthrough(input: {
    organizationId: string;
    userId: string;
    walkthroughId: string;
    persona?: string | null;
  }): LearningProgress {
    const current = this.ensure(input);
    const set = new Set(current.completedWalkthroughIds);
    set.add(input.walkthroughId);
    return setLearningProgress({
      ...current,
      completedWalkthroughIds: Object.freeze([...set]),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function createMrJagProgressService(): MrJagProgressService {
  return new MrJagProgressService();
}
