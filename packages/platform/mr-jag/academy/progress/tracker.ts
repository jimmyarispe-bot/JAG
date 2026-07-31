/**
 * Academy learner progress — persistent in-process progress + streak.
 */

import { normalizePersona } from "../../personas";
import type { MrJagPersona } from "../../types";
import {
  getAcademyProgress,
  getPath,
  listPaths,
  recordLessonCompletionSeconds,
  recordLessonView,
  setAcademyProgress,
} from "../store";
import type { AcademyLearnerProgress } from "../types";
import { awardPathCertification } from "../certifications/service";

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function ensureAcademyProgress(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
}): AcademyLearnerProgress {
  const existing = getAcademyProgress(input.organizationId, input.userId);
  if (existing) return existing;
  const persona: MrJagPersona = normalizePersona(input.persona);
  const path = listPaths().find((p) => p.persona === persona) ?? null;
  return setAcademyProgress({
    userId: input.userId,
    organizationId: input.organizationId,
    persona,
    completedLessonIds: Object.freeze([]),
    pathId: path?.id ?? null,
    pathCompletionPercent: 0,
    quizAttemptIds: Object.freeze([]),
    certificationIds: Object.freeze([]),
    timeSpentSeconds: 0,
    learningStreakDays: 1,
    lastActivityAt: new Date().toISOString(),
    recentlyCompletedLessonIds: Object.freeze([]),
  });
}

export function completeAcademyLesson(input: {
  organizationId: string;
  userId: string;
  lessonId: string;
  persona?: string | null;
  secondsSpent?: number;
}): AcademyLearnerProgress {
  const current = ensureAcademyProgress(input);
  recordLessonView(input.lessonId);
  const seconds = input.secondsSpent ?? 120;
  recordLessonCompletionSeconds(input.lessonId, seconds);

  const completed = new Set(current.completedLessonIds);
  completed.add(input.lessonId);
  const path = current.pathId ? getPath(current.pathId) : null;
  const required = path?.lessons.filter((l) => l.required) ?? [];
  const doneRequired = required.filter((l) => completed.has(l.lessonId)).length;
  const percent =
    required.length === 0
      ? 100
      : Math.round((doneRequired / required.length) * 100);

  const now = new Date().toISOString();
  const streak =
    dayKey(current.lastActivityAt) === dayKey(now)
      ? current.learningStreakDays
      : current.learningStreakDays + 1;

  let certificationIds = [...current.certificationIds];
  if (path && percent >= 100) {
    const award = awardPathCertification({
      pathId: path.id,
      userId: input.userId,
      organizationId: input.organizationId,
      completedLessonIds: [...completed],
    });
    if (!("error" in award) && !certificationIds.includes(award.id)) {
      certificationIds.push(award.id);
    }
  }

  const recent = [
    input.lessonId,
    ...current.recentlyCompletedLessonIds.filter((id) => id !== input.lessonId),
  ].slice(0, 8);

  return setAcademyProgress({
    ...current,
    completedLessonIds: Object.freeze([...completed]),
    pathCompletionPercent: percent,
    certificationIds: Object.freeze(certificationIds),
    timeSpentSeconds: current.timeSpentSeconds + seconds,
    learningStreakDays: streak,
    lastActivityAt: now,
    recentlyCompletedLessonIds: Object.freeze(recent),
  });
}
