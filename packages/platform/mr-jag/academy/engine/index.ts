/**
 * MrJagAcademyEngine — AI learning platform orchestrator (P-003).
 */

import { normalizePersona } from "../../personas";
import { getAcademyAnalytics } from "../analytics/service";
import {
  awardCertification,
  awardPathCertification,
  listUserCertifications,
} from "../certifications/service";
import { bootstrapAcademyCurriculum } from "../curriculum/bootstrap";
import { generateLessonScript } from "../scripts/generator";
import {
  completeAcademyLesson,
  ensureAcademyProgress,
} from "../progress/tracker";
import {
  explainQuiz,
  listAttemptsForUser,
  listQuizCatalog,
  scoreQuiz,
} from "../quizzes/service";
import { recommendLessons } from "../recommendations/engine";
import { registerAcademyContent } from "../registry";
import {
  getLesson,
  getPath,
  listLessons,
  listPaths,
  listQuizzes,
  recordLessonView,
} from "../store";
import type {
  AcademyDashboard,
  AcademyLearnerProgress,
  AcademyLessonModel,
  CurriculumLearningPath,
} from "../types";

export class MrJagAcademyEngine {
  ensureCatalog(): void {
    if (listLessons().length === 0 || listPaths().length < 11) {
      bootstrapAcademyCurriculum();
    }
  }

  register = registerAcademyContent;

  listLessons(persona?: string | null): readonly AcademyLessonModel[] {
    this.ensureCatalog();
    if (!persona) return listLessons();
    const p = normalizePersona(persona);
    return Object.freeze(listLessons().filter((l) => l.persona === p));
  }

  getLesson(lessonId: string): AcademyLessonModel | null {
    this.ensureCatalog();
    return getLesson(lessonId);
  }

  lessonForPage(pageId: string): AcademyLessonModel | null {
    this.ensureCatalog();
    return (
      listLessons().find((l) => l.pageId === pageId) ??
      getLesson(`lesson:${pageId}`)
    );
  }

  scriptForLesson(lessonId: string) {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    recordLessonView(lessonId);
    return generateLessonScript(lesson);
  }

  learningPaths(persona?: string | null): readonly CurriculumLearningPath[] {
    this.ensureCatalog();
    if (!persona) return listPaths();
    const p = normalizePersona(persona);
    return Object.freeze(listPaths().filter((path) => path.persona === p));
  }

  learnerProgress(input: {
    organizationId: string;
    userId: string;
    persona?: string | null;
  }): AcademyLearnerProgress {
    this.ensureCatalog();
    return ensureAcademyProgress(input);
  }

  pathProgress(input: {
    pathId: string;
    organizationId: string;
    userId: string;
    persona?: string | null;
  }) {
    this.ensureCatalog();
    const path = getPath(input.pathId);
    const progress = ensureAcademyProgress(input);
    if (!path) return null;
    const required = path.lessons.filter((l) => l.required);
    const done = required.filter((l) =>
      progress.completedLessonIds.includes(l.lessonId)
    ).length;
    return {
      path,
      completionPercent:
        required.length === 0
          ? 100
          : Math.round((done / required.length) * 100),
      requiredCount: required.length,
      completedRequired: done,
      certificationId: path.certificationId,
      completedLessonIds: progress.completedLessonIds,
    };
  }

  completeLesson = completeAcademyLesson;

  quizzes = listQuizCatalog;
  scoreQuiz = scoreQuiz;
  explainQuiz = explainQuiz;

  awardCertification = awardCertification;
  awardPathCertification = awardPathCertification;
  listCertifications = listUserCertifications;

  recommend = recommendLessons;
  analytics = getAcademyAnalytics;

  dashboard(input: {
    organizationId: string;
    userId: string;
    persona?: string | null;
    recentlyVisitedPageIds?: readonly string[];
  }): AcademyDashboard {
    this.ensureCatalog();
    const persona = normalizePersona(input.persona);
    const progress = ensureAcademyProgress({ ...input, persona });
    const paths = this.learningPaths(persona);
    const path = paths.find((p) => p.id === progress.pathId) ?? paths[0];
    const nextLessonId =
      path?.lessons.find(
        (l) => !progress.completedLessonIds.includes(l.lessonId)
      )?.lessonId ?? null;
    const nextLesson = nextLessonId ? getLesson(nextLessonId) : null;

    return {
      generatedAt: new Date().toISOString(),
      continueLearning: {
        lessonId: nextLessonId,
        pathId: path?.id ?? null,
        label: nextLesson?.title ?? null,
      },
      recommendedLessons: this.recommend({
        organizationId: input.organizationId,
        userId: input.userId,
        persona,
        recentlyVisitedPageIds: input.recentlyVisitedPageIds,
      }),
      learningPaths: paths,
      certificates: this.listCertifications(
        input.organizationId,
        input.userId
      ),
      recentlyCompleted: progress.recentlyCompletedLessonIds,
      quizResults: listAttemptsForUser(
        input.organizationId,
        input.userId
      ).slice(0, 10),
      timeSpentLearningSeconds: progress.timeSpentSeconds,
      learningStreakDays: progress.learningStreakDays,
    };
  }

  listAllQuizzes() {
    this.ensureCatalog();
    return listQuizzes();
  }
}

export function createMrJagAcademyEngine(): MrJagAcademyEngine {
  return new MrJagAcademyEngine();
}
