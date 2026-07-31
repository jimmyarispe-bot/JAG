/**
 * MrJagAcademyService — learning experiences from registered page metadata.
 */

import { normalizePersona } from "../personas";
import {
  getPageLearningMetadata,
  listPageLearningMetadata,
  listRegisteredLearningPaths,
  listRegisteredWalkthroughs,
} from "../tutorials/registry";
import type { AcademyLesson, MrJagPersona } from "../types";

function toLesson(pageId: string): AcademyLesson | null {
  const meta = getPageLearningMetadata(pageId);
  if (!meta) return null;
  const walk =
    listRegisteredWalkthroughs({ pageId }).find((w) => w.pageId === pageId) ??
    null;
  return {
    pageId: meta.pageId,
    title: meta.title,
    overview: meta.overview ?? meta.learningObjectives.join(" "),
    videoLessonUrl: meta.videoLessonUrl ?? null,
    walkthroughId: walk?.id ?? null,
    bestPractices: meta.bestPractices ?? Object.freeze([]),
    quizId: meta.quizId ?? null,
    certificationId: meta.certificationId ?? null,
    estimatedMinutes: meta.estimatedMinutes,
    difficulty: meta.difficulty,
    learningObjectives: meta.learningObjectives,
  };
}

export class MrJagAcademyService {
  lessonForPage(pageId: string): AcademyLesson | null {
    return toLesson(pageId);
  }

  lessonsForPersona(personaInput?: string | null): readonly AcademyLesson[] {
    const persona: MrJagPersona = normalizePersona(personaInput);
    return Object.freeze(
      listPageLearningMetadata({ persona })
        .map((t) => toLesson(t.pageId))
        .filter((l): l is AcademyLesson => l != null)
    );
  }

  learningPaths(personaInput?: string | null) {
    return listRegisteredLearningPaths({
      persona: normalizePersona(personaInput),
    });
  }

  pathLessons(pathId: string): readonly AcademyLesson[] {
    const path = listRegisteredLearningPaths().find((p) => p.id === pathId);
    if (!path) return Object.freeze([]);
    return Object.freeze(
      path.steps
        .map((s) => toLesson(s.pageId))
        .filter((l): l is AcademyLesson => l != null)
    );
  }
}

export function createMrJagAcademyService(): MrJagAcademyService {
  return new MrJagAcademyService();
}
