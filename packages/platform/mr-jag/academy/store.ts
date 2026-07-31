/**
 * P-003 Academy in-process store.
 */

import type {
  AcademyAnalyticsSnapshot,
  AcademyLearnerProgress,
  AcademyLessonModel,
  CertificationAward,
  CurriculumLearningPath,
  QuizAttempt,
  QuizDefinition,
} from "./types";

type AcademyStore = {
  lessons: Map<string, AcademyLessonModel>;
  paths: Map<string, CurriculumLearningPath>;
  quizzes: Map<string, QuizDefinition>;
  attempts: QuizAttempt[];
  certifications: CertificationAward[];
  progress: Map<string, AcademyLearnerProgress>;
  views: Map<string, number>;
  completionSeconds: Map<string, number[]>;
  starts: Map<string, number>;
};

const g = globalThis as typeof globalThis & {
  __jagMrJagAcademyStore?: AcademyStore;
};

function empty(): AcademyStore {
  return {
    lessons: new Map(),
    paths: new Map(),
    quizzes: new Map(),
    attempts: [],
    certifications: [],
    progress: new Map(),
    views: new Map(),
    completionSeconds: new Map(),
    starts: new Map(),
  };
}

function store(): AcademyStore {
  if (!g.__jagMrJagAcademyStore) g.__jagMrJagAcademyStore = empty();
  return g.__jagMrJagAcademyStore;
}

export function resetAcademyEngineStoreForTests(): void {
  g.__jagMrJagAcademyStore = empty();
}

export function upsertLesson(lesson: AcademyLessonModel): AcademyLessonModel {
  store().lessons.set(lesson.lessonId, lesson);
  return lesson;
}

export function getLesson(id: string): AcademyLessonModel | null {
  return store().lessons.get(id) ?? null;
}

export function listLessons(): readonly AcademyLessonModel[] {
  return Object.freeze([...store().lessons.values()]);
}

export function upsertPath(path: CurriculumLearningPath): CurriculumLearningPath {
  store().paths.set(path.id, path);
  return path;
}

export function listPaths(): readonly CurriculumLearningPath[] {
  return Object.freeze([...store().paths.values()]);
}

export function getPath(id: string): CurriculumLearningPath | null {
  return store().paths.get(id) ?? null;
}

export function upsertQuiz(quiz: QuizDefinition): QuizDefinition {
  store().quizzes.set(quiz.id, quiz);
  return quiz;
}

export function getQuiz(id: string): QuizDefinition | null {
  return store().quizzes.get(id) ?? null;
}

export function listQuizzes(): readonly QuizDefinition[] {
  return Object.freeze([...store().quizzes.values()]);
}

export function appendQuizAttempt(attempt: QuizAttempt): QuizAttempt {
  store().attempts.unshift(attempt);
  if (store().attempts.length > 200) store().attempts.length = 200;
  return attempt;
}

export function listQuizAttempts(
  organizationId: string,
  userId?: string
): readonly QuizAttempt[] {
  return Object.freeze(
    store().attempts.filter(
      (a) =>
        a.organizationId === organizationId &&
        (!userId || a.userId === userId)
    )
  );
}

export function appendCertification(
  award: CertificationAward
): CertificationAward {
  store().certifications.unshift(award);
  return award;
}

export function listCertifications(
  organizationId: string,
  userId?: string
): readonly CertificationAward[] {
  return Object.freeze(
    store().certifications.filter(
      (c) =>
        c.organizationId === organizationId &&
        (!userId || c.userId === userId)
    )
  );
}

function progressKey(organizationId: string, userId: string): string {
  return `${organizationId}::${userId}`;
}

export function getAcademyProgress(
  organizationId: string,
  userId: string
): AcademyLearnerProgress | null {
  return store().progress.get(progressKey(organizationId, userId)) ?? null;
}

export function setAcademyProgress(
  progress: AcademyLearnerProgress
): AcademyLearnerProgress {
  store().progress.set(
    progressKey(progress.organizationId, progress.userId),
    progress
  );
  return progress;
}

export function recordLessonView(lessonId: string): void {
  store().views.set(lessonId, (store().views.get(lessonId) ?? 0) + 1);
  store().starts.set(lessonId, (store().starts.get(lessonId) ?? 0) + 1);
}

export function recordLessonCompletionSeconds(
  lessonId: string,
  seconds: number
): void {
  const arr = store().completionSeconds.get(lessonId) ?? [];
  arr.push(seconds);
  store().completionSeconds.set(lessonId, arr);
}

export function buildAnalyticsSnapshot(): AcademyAnalyticsSnapshot {
  const completions: Record<string, number> = {};
  const averages: Record<string, number> = {};
  for (const [id, samples] of store().completionSeconds) {
    completions[id] = samples.length;
    averages[id] = Math.round(
      samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length)
    );
  }
  const quizScores: Record<string, number> = {};
  for (const a of store().attempts) {
    quizScores[a.quizId] = Math.round(
      ((quizScores[a.quizId] ?? a.score) + a.score) / 2
    );
  }
  const mostViewed = [...store().views.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 8);
  const dropOff = [...store().starts.entries()]
    .filter(([id, starts]) => (completions[id] ?? 0) < starts * 0.5)
    .map(([id]) => id)
    .slice(0, 8);
  const lowQuiz = Object.entries(quizScores)
    .filter(([, s]) => s < 70)
    .map(([id]) => id);

  return {
    generatedAt: new Date().toISOString(),
    lessonCompletions: Object.freeze(completions),
    averageCompletionSeconds: Object.freeze(averages),
    quizScores: Object.freeze(quizScores),
    dropOffLessonIds: Object.freeze(dropOff),
    mostViewedLessonIds: Object.freeze(mostViewed),
    leastUnderstoodWorkflows: Object.freeze(lowQuiz),
  };
}
