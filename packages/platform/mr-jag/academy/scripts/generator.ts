/**
 * Lesson script generator — 2–3 minute structured narration (no video).
 */

import type { AcademyLessonModel, LessonNarrationScript } from "../types";

export function generateLessonScript(
  lesson: AcademyLessonModel,
  locale = "en-US"
): LessonNarrationScript {
  const minutes = Math.min(3, Math.max(2, lesson.estimatedMinutes));
  const budget = minutes * 60;
  const steps = lesson.learningObjectives.slice(0, 4);
  const blocks = [
    {
      section: "opening" as const,
      narration: `Welcome. In the next ${minutes} minutes, you'll learn ${lesson.title}.`,
      estimatedSeconds: Math.round(budget * 0.1),
    },
    {
      section: "overview" as const,
      narration: `${lesson.description} This lesson targets the ${lesson.persona} persona.`,
      estimatedSeconds: Math.round(budget * 0.15),
    },
    {
      section: "steps" as const,
      narration:
        steps.length > 0
          ? `Follow these steps. ${steps
              .map((s, i) => `Step ${i + 1}: ${s}`)
              .join(" ")}`
          : `Open ${lesson.pageId ?? "the related page"} and explore the primary workflow.`,
      estimatedSeconds: Math.round(budget * 0.35),
    },
    {
      section: "best_practices" as const,
      narration:
        "Best practice: complete one focused action, confirm the result, then continue. Prefer guided walkthroughs when available.",
      estimatedSeconds: Math.round(budget * 0.12),
    },
    {
      section: "common_mistakes" as const,
      narration:
        "Common mistake: skipping prerequisites or working in the wrong organization context. Verify filters and role permissions first.",
      estimatedSeconds: Math.round(budget * 0.12),
    },
    {
      section: "summary" as const,
      narration: `Summary: you can now complete ${lesson.title}. Objectives covered: ${lesson.learningObjectives
        .slice(0, 3)
        .join("; ")}.`,
      estimatedSeconds: Math.round(budget * 0.1),
    },
    {
      section: "cta" as const,
      narration: lesson.walkthroughId
        ? `Next, launch the interactive walkthrough, then take the quiz if available.`
        : `Next, practice on the live page, then continue your learning path.`,
      estimatedSeconds: Math.round(budget * 0.06),
    },
  ];

  const totalEstimatedSeconds = blocks.reduce(
    (a, b) => a + b.estimatedSeconds,
    0
  );

  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    locale,
    targetMinutes: minutes,
    blocks: Object.freeze(blocks),
    totalEstimatedSeconds,
  };
}
