/**
 * Personalized lesson recommendations.
 */

import { listIncidents } from "../../help/intelligence";
import { normalizePersona } from "../../personas";
import { getLesson, listLessons, listPaths } from "../store";
import type { AcademyLessonModel } from "../types";
import { ensureAcademyProgress } from "../progress/tracker";

export function recommendLessons(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
  recentlyVisitedPageIds?: readonly string[];
  coachPageIds?: readonly string[];
  limit?: number;
}): readonly AcademyLessonModel[] {
  const persona = normalizePersona(input.persona);
  const progress = ensureAcademyProgress({
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
  });
  const completed = new Set(progress.completedLessonIds);
  const path = listPaths().find((p) => p.id === progress.pathId);
  const scored: { lesson: AcademyLessonModel; score: number }[] = [];

  for (const lesson of listLessons()) {
    if (lesson.persona !== persona && lesson.persona !== "Executive") continue;
    if (completed.has(lesson.lessonId)) continue;
    let score = 10;
    if (path?.lessons.some((l) => l.lessonId === lesson.lessonId && l.required))
      score += 25;
    if (path?.lessons.some((l) => l.lessonId === lesson.lessonId)) score += 10;
    if (
      input.recentlyVisitedPageIds?.some(
        (p) => lesson.pageId === p || lesson.relatedPages.includes(p)
      )
    )
      score += 20;
    if (input.coachPageIds?.includes(lesson.pageId ?? "")) score += 15;
    const incidents = listIncidents({
      organizationId: input.organizationId,
      limit: 10,
    });
    if (
      incidents.some(
        (i) =>
          i.diagnosis?.relatedTutorialId &&
          (i.diagnosis.relatedTutorialId === lesson.pageId ||
            i.diagnosis.relatedTutorialId === lesson.lessonId)
      )
    )
      score += 18;
    for (const pre of lesson.prerequisites) {
      const preLesson =
        getLesson(pre) ?? getLesson(`lesson:${pre}`);
      if (preLesson && !completed.has(preLesson.lessonId)) score -= 8;
    }
    scored.push({ lesson, score });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.lesson.lessonId.localeCompare(b.lesson.lessonId)
  );
  return Object.freeze(
    scored.slice(0, input.limit ?? 8).map((s) => s.lesson)
  );
}
