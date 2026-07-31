/**
 * Mr. JAG Dashboard — lessons, progress, coaching, questions.
 */

import { createMrJagAcademyService } from "./academy/service";
import { createMrJagCoachService } from "./coach/service";
import { normalizePersona } from "./personas";
import { createMrJagProgressService } from "./progress/service";
import { listRecentQuestions } from "./store";
import { listRegisteredWalkthroughs } from "./tutorials/registry";
import type { CoachTrigger, MrJagDashboard } from "./types";

export function buildMrJagDashboard(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
  recentTriggers?: readonly CoachTrigger[];
}): MrJagDashboard {
  const persona = normalizePersona(input.persona);
  const academy = createMrJagAcademyService();
  const progressSvc = createMrJagProgressService();
  const progress = progressSvc.ensure({
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
  });
  const paths = academy.learningPaths(persona);
  const path = paths.find((p) => p.id === progress.pathId) ?? paths[0] ?? null;
  const nextStep = path?.steps[progress.pathStepIndex] ?? null;
  const lessons = academy.lessonsForPersona(persona).slice(0, 6);
  const walks = listRegisteredWalkthroughs({ persona }).slice(0, 5);
  const tips = createMrJagCoachService().observe({
    events: input.recentTriggers?.length
      ? input.recentTriggers
      : ["first_login"],
    persona,
  });

  return {
    generatedAt: new Date().toISOString(),
    persona,
    recommendedLessons: Object.freeze(lessons),
    continueLearning: {
      pathId: path?.id ?? null,
      nextPageId: nextStep?.pageId ?? null,
      label: nextStep?.label ?? null,
    },
    recentQuestions: Object.freeze([
      ...listRecentQuestions(input.userId, 8),
    ]),
    suggestedWalkthroughs: Object.freeze(walks),
    learningProgress: progress,
    certifications: progress.certifications,
    coachingTips: tips,
  };
}
