/**
 * Seed curriculum from registered tutorial pages + persona path catalogs.
 */

import { bootstrapMrJagCatalog } from "../../tutorials/bootstrap";
import { listLearningPaths, listTutorials } from "../../store";
import type { MrJagPersona } from "../../types";
import { lessonFromPageMetadata } from "../lessons/model";
import { registerAcademyContent } from "../registry";
import {
  getQuiz,
  listLessons,
  listPaths,
  upsertLesson,
  upsertPath,
  upsertQuiz,
} from "../store";
import type { CurriculumLearningPath, QuizDefinition } from "../types";

function quizForLesson(
  lessonId: string,
  persona: MrJagPersona,
  title: string
): QuizDefinition {
  return {
    id: `quiz:${lessonId}`,
    title: `${title} Check`,
    lessonId,
    persona,
    passingScore: 70,
    questions: Object.freeze([
      {
        id: `${lessonId}.q1`,
        kind: "multiple_choice",
        prompt: `What is the primary goal of ${title}?`,
        choices: Object.freeze([
          "Complete the core workflow correctly",
          "Ignore permissions",
          "Skip prerequisites",
          "Disable notifications",
        ]),
        correctIndex: 0,
        explanation: "Lessons teach the core workflow safely and correctly.",
      },
      {
        id: `${lessonId}.q2`,
        kind: "true_false",
        prompt: "You should verify organization context before acting.",
        choices: Object.freeze(["True", "False"]),
        correctIndex: 0,
        explanation: "Wrong org context is a common failure mode.",
      },
      {
        id: `${lessonId}.q3`,
        kind: "scenario",
        prompt: "A control is unclear. What should you do first?",
        choices: Object.freeze([
          "Launch the related walkthrough or ask Mr. JAG",
          "Hard-refresh until it works",
          "Delete the record",
          "Share admin credentials",
        ]),
        correctIndex: 0,
        explanation: "Use guided help before improvising.",
      },
    ]),
  };
}

function ensurePersonaPath(persona: MrJagPersona): void {
  const existing = listPaths().find((p) => p.persona === persona);
  if (existing) return;
  const lessons = listLessons().filter((l) => l.persona === persona);
  if (lessons.length === 0) return;
  const path: CurriculumLearningPath = {
    id: `curriculum.${persona.toLowerCase().replace(/\s+/g, "-")}`,
    title: `${persona} Mastery Path`,
    persona,
    productId: lessons[0]!.productId,
    description: `Required and optional lessons for ${persona}.`,
    certificationId: `cert.${persona.toLowerCase().replace(/\s+/g, "-")}.persona`,
    lessons: Object.freeze(
      lessons.map((l, order) =>
        Object.freeze({
          lessonId: l.lessonId,
          required: order < Math.max(2, Math.ceil(lessons.length * 0.7)),
          order,
        })
      )
    ),
  };
  upsertPath(path);
}

export function bootstrapAcademyCurriculum(): {
  readonly lessons: number;
  readonly paths: number;
  readonly quizzes: number;
} {
  if (listTutorials().length === 0) bootstrapMrJagCatalog();

  // Sync page metadata → lesson models
  for (const page of listTutorials()) {
    const lesson = lessonFromPageMetadata(page);
    upsertLesson(lesson);
    if (!lesson.quizId) {
      upsertQuiz(quizForLesson(lesson.lessonId, lesson.persona, lesson.title));
      upsertLesson({ ...lesson, quizId: `quiz:${lesson.lessonId}` });
    } else {
      upsertQuiz(
        quizForLesson(lesson.lessonId, lesson.persona, lesson.title)
      );
    }
  }

  // Map tutorial learning paths into curriculum paths
  for (const tp of listLearningPaths()) {
    const lessonIds = tp.steps.map((s) => `lesson:${s.pageId}`);
    upsertPath({
      id: `curriculum.${tp.id}`,
      title: tp.title,
      persona: tp.persona,
      productId: tp.productId,
      description: `${tp.title} structured learning path.`,
      certificationId: tp.certificationId ?? null,
      lessons: Object.freeze(
        lessonIds.map((lessonId, order) =>
          Object.freeze({
            lessonId,
            required: true,
            order,
          })
        )
      ),
    });
  }

  // Extra personas Support / Developer
  registerAcademyContent({
    pages: [
      {
        pageId: "platform.support.desk",
        productId: "jag-platform",
        title: "Support Desk Essentials",
        estimatedMinutes: 3,
        prerequisites: [],
        difficulty: "Beginner",
        learningObjectives: Object.freeze([
          "Triage an incident",
          "Use diagnostics",
          "Capture resolution knowledge",
        ]),
        relatedPages: Object.freeze([]),
        relatedWorkflows: Object.freeze(["support", "diagnostics"]),
        personas: Object.freeze(["Support"]),
        overview: "Resolve user issues with Mr. JAG intelligent help.",
        lessonId: "lesson:platform.support.desk",
        walkthroughId: null,
      },
      {
        pageId: "platform.dev.apis",
        productId: "jag-platform",
        title: "Developer API Orientation",
        estimatedMinutes: 3,
        prerequisites: [],
        difficulty: "Intermediate",
        learningObjectives: Object.freeze([
          "Locate API docs",
          "Register an extension",
          "Validate with Studio evidence",
        ]),
        relatedPages: Object.freeze([]),
        relatedWorkflows: Object.freeze(["api", "sdk"]),
        personas: Object.freeze(["Developer"]),
        overview: "Build on JAG without breaking platform contracts.",
        lessonId: "lesson:platform.dev.apis",
        walkthroughId: null,
      },
    ],
  });

  for (const lesson of listLessons()) {
    const quizId = lesson.quizId ?? `quiz:${lesson.lessonId}`;
    if (!getQuiz(quizId)) {
      upsertQuiz(quizForLesson(lesson.lessonId, lesson.persona, lesson.title));
      upsertLesson({ ...lesson, quizId });
    }
  }

  for (const persona of [
    "Founder",
    "Executive",
    "School Leader",
    "Teacher",
    "Admissions",
    "Finance",
    "HR",
    "Parent",
    "Student",
    "Support",
    "Developer",
  ] as const) {
    ensurePersonaPath(persona);
  }

  return {
    lessons: listLessons().length,
    paths: listPaths().length,
    quizzes: listLessons().length,
  };
}
