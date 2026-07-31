/**
 * Academy registry — pages register lessons / quizzes / certifications.
 */

import { upsertTutorial } from "../../store";
import type { TutorialPageMetadata } from "../../types";
import { lessonFromPageMetadata } from "../lessons/model";
import { upsertLesson, upsertPath, upsertQuiz } from "../store";
import type {
  AcademyLessonModel,
  CurriculumLearningPath,
  QuizDefinition,
} from "../types";

export type AcademyRegistrationBundle = {
  readonly pages?: readonly TutorialPageMetadata[];
  readonly lessons?: readonly AcademyLessonModel[];
  readonly paths?: readonly CurriculumLearningPath[];
  readonly quizzes?: readonly QuizDefinition[];
};

export function registerAcademyContent(bundle: AcademyRegistrationBundle): {
  readonly pages: number;
  readonly lessons: number;
  readonly paths: number;
  readonly quizzes: number;
} {
  let pages = 0;
  let lessons = 0;
  let paths = 0;
  let quizzes = 0;

  for (const page of bundle.pages ?? []) {
    upsertTutorial(page);
    upsertLesson(lessonFromPageMetadata(page));
    pages += 1;
    lessons += 1;
  }
  for (const lesson of bundle.lessons ?? []) {
    upsertLesson(lesson);
    lessons += 1;
  }
  for (const path of bundle.paths ?? []) {
    upsertPath(path);
    paths += 1;
  }
  for (const quiz of bundle.quizzes ?? []) {
    upsertQuiz(quiz);
    quizzes += 1;
  }
  return { pages, lessons, paths, quizzes };
}
