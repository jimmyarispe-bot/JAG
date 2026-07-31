/**
 * Lesson model builders from page metadata / explicit registration.
 */

import type { TutorialPageMetadata } from "../../types";
import type { AcademyLessonModel } from "../types";

export function lessonFromPageMetadata(
  meta: TutorialPageMetadata,
  persona = meta.personas[0] ?? ("Executive" as const)
): AcademyLessonModel {
  const lessonId = meta.lessonId ?? `lesson:${meta.pageId}`;
  return {
    lessonId,
    title: meta.title,
    description: meta.overview ?? meta.learningObjectives.join(" "),
    estimatedMinutes: Math.min(3, Math.max(2, meta.estimatedMinutes || 3)),
    difficulty: meta.difficulty,
    persona,
    prerequisites: meta.prerequisites,
    learningObjectives: meta.learningObjectives,
    relatedPages: meta.relatedPages,
    relatedWorkflows: meta.relatedWorkflows,
    completionCriteria: Object.freeze([
      "View lesson script",
      "Complete walkthrough if present",
      meta.quizId ? "Pass quiz" : "Acknowledge summary",
    ]),
    recommendedNextLessons: Object.freeze([
      ...(meta.relatedLessonIds ?? []),
      ...meta.relatedPages.map((p) => `lesson:${p}`),
    ]),
    pageId: meta.pageId,
    productId: meta.productId,
    walkthroughId: meta.walkthroughId ?? null,
    quizId: meta.quizId ?? null,
    certificationId: meta.certificationId ?? null,
  };
}
