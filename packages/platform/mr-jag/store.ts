/**
 * In-process Mr. JAG registry + progress (tests / single-process).
 */

import type {
  LearningPath,
  LearningProgress,
  TutorialPageMetadata,
  WalkthroughDefinition,
  WalkthroughProgress,
} from "./types";

type MrJagStore = {
  tutorials: Map<string, TutorialPageMetadata>;
  paths: Map<string, LearningPath>;
  walkthroughs: Map<string, WalkthroughDefinition>;
  progress: Map<string, LearningProgress>;
  walkProgress: Map<string, WalkthroughProgress>;
  questions: { id: string; question: string; at: string; userId: string }[];
};

const g = globalThis as typeof globalThis & {
  __jagMrJagStore?: MrJagStore;
};

function empty(): MrJagStore {
  return {
    tutorials: new Map(),
    paths: new Map(),
    walkthroughs: new Map(),
    progress: new Map(),
    walkProgress: new Map(),
    questions: [],
  };
}

function store(): MrJagStore {
  if (!g.__jagMrJagStore) g.__jagMrJagStore = empty();
  return g.__jagMrJagStore;
}

export function resetMrJagStoreForTests(): void {
  g.__jagMrJagStore = empty();
  // Clear P-002 intelligence store without coupling call sites to intel APIs.
  const intel = globalThis as typeof globalThis & {
    __jagMrJagIntelStore?: unknown;
  };
  intel.__jagMrJagIntelStore = undefined;
  // Clear P-003 academy engine store.
  const academy = globalThis as typeof globalThis & {
    __jagMrJagAcademyStore?: unknown;
  };
  academy.__jagMrJagAcademyStore = undefined;
  // Clear P-004 coach engine store.
  const coach = globalThis as typeof globalThis & {
    __jagMrJagCoachStore?: unknown;
  };
  coach.__jagMrJagCoachStore = undefined;
}

export function upsertTutorial(meta: TutorialPageMetadata): TutorialPageMetadata {
  store().tutorials.set(meta.pageId, meta);
  return meta;
}

export function listTutorials(): readonly TutorialPageMetadata[] {
  return Object.freeze([...store().tutorials.values()]);
}

export function getTutorial(pageId: string): TutorialPageMetadata | null {
  return store().tutorials.get(pageId) ?? null;
}

export function upsertLearningPath(path: LearningPath): LearningPath {
  store().paths.set(path.id, path);
  return path;
}

export function listLearningPaths(): readonly LearningPath[] {
  return Object.freeze([...store().paths.values()]);
}

export function upsertWalkthrough(
  walk: WalkthroughDefinition
): WalkthroughDefinition {
  store().walkthroughs.set(walk.id, walk);
  return walk;
}

export function listWalkthroughs(): readonly WalkthroughDefinition[] {
  return Object.freeze([...store().walkthroughs.values()]);
}

export function getWalkthrough(id: string): WalkthroughDefinition | null {
  return store().walkthroughs.get(id) ?? null;
}

function progressKey(organizationId: string, userId: string): string {
  return `${organizationId}::${userId}`;
}

export function getLearningProgress(
  organizationId: string,
  userId: string
): LearningProgress | null {
  return store().progress.get(progressKey(organizationId, userId)) ?? null;
}

export function setLearningProgress(
  progress: LearningProgress
): LearningProgress {
  store().progress.set(
    progressKey(progress.organizationId, progress.userId),
    progress
  );
  return progress;
}

function walkKey(
  organizationId: string,
  userId: string,
  walkthroughId: string
): string {
  return `${organizationId}::${userId}::${walkthroughId}`;
}

export function getWalkthroughProgress(
  organizationId: string,
  userId: string,
  walkthroughId: string
): WalkthroughProgress | null {
  return (
    store().walkProgress.get(
      walkKey(organizationId, userId, walkthroughId)
    ) ?? null
  );
}

export function setWalkthroughProgress(
  progress: WalkthroughProgress
): WalkthroughProgress {
  store().walkProgress.set(
    walkKey(
      progress.organizationId,
      progress.userId,
      progress.walkthroughId
    ),
    progress
  );
  return progress;
}

export function recordQuestion(input: {
  userId: string;
  question: string;
}): string {
  const id = `q:${Date.now()}:${store().questions.length}`;
  store().questions.unshift({
    id,
    question: input.question,
    at: new Date().toISOString(),
    userId: input.userId,
  });
  if (store().questions.length > 100) store().questions.length = 100;
  return id;
}

export function listRecentQuestions(
  userId: string,
  limit = 8
): readonly string[] {
  return Object.freeze(
    store()
      .questions.filter((q) => q.userId === userId)
      .slice(0, limit)
      .map((q) => q.question)
  );
}
