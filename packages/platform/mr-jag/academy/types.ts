/**
 * P-003 — Academy engine types (additive to P-001 AcademyLesson).
 */

import type { MrJagPersona, TutorialDifficulty } from "../types";

export type AcademyLessonModel = {
  readonly lessonId: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly difficulty: TutorialDifficulty;
  readonly persona: MrJagPersona;
  readonly prerequisites: readonly string[];
  readonly learningObjectives: readonly string[];
  readonly relatedPages: readonly string[];
  readonly relatedWorkflows: readonly string[];
  readonly completionCriteria: readonly string[];
  readonly recommendedNextLessons: readonly string[];
  readonly pageId: string | null;
  readonly productId: string;
  readonly walkthroughId: string | null;
  readonly quizId: string | null;
  readonly certificationId: string | null;
};

export type LessonScriptSection =
  | "opening"
  | "overview"
  | "steps"
  | "best_practices"
  | "common_mistakes"
  | "summary"
  | "cta";

export type LessonScriptBlock = {
  readonly section: LessonScriptSection;
  readonly narration: string;
  readonly estimatedSeconds: number;
};

export type LessonNarrationScript = {
  readonly lessonId: string;
  readonly title: string;
  readonly locale: string;
  readonly targetMinutes: number;
  readonly blocks: readonly LessonScriptBlock[];
  readonly totalEstimatedSeconds: number;
};

export type CurriculumPathLesson = {
  readonly lessonId: string;
  readonly required: boolean;
  readonly order: number;
};

export type CurriculumLearningPath = {
  readonly id: string;
  readonly title: string;
  readonly persona: MrJagPersona;
  readonly productId: string;
  readonly lessons: readonly CurriculumPathLesson[];
  readonly certificationId: string | null;
  readonly description: string;
};

export type QuizQuestionKind = "multiple_choice" | "true_false" | "scenario";

export type QuizQuestion = {
  readonly id: string;
  readonly kind: QuizQuestionKind;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
};

export type QuizDefinition = {
  readonly id: string;
  readonly title: string;
  readonly lessonId: string;
  readonly persona: MrJagPersona;
  readonly passingScore: number;
  readonly questions: readonly QuizQuestion[];
};

export type QuizAttempt = {
  readonly id: string;
  readonly quizId: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly answers: readonly number[];
  readonly score: number;
  readonly passed: boolean;
  readonly createdAt: string;
};

export type CertificationKind =
  | "course"
  | "persona"
  | "role"
  | "platform";

export type CertificationAward = {
  readonly id: string;
  readonly kind: CertificationKind;
  readonly title: string;
  readonly persona: MrJagPersona | null;
  readonly userId: string;
  readonly organizationId: string;
  readonly lessonIds: readonly string[];
  readonly version: string;
  readonly completedAt: string;
  readonly expiresAt: string | null;
};

export type AcademyLearnerProgress = {
  readonly userId: string;
  readonly organizationId: string;
  readonly persona: MrJagPersona;
  readonly completedLessonIds: readonly string[];
  readonly pathId: string | null;
  readonly pathCompletionPercent: number;
  readonly quizAttemptIds: readonly string[];
  readonly certificationIds: readonly string[];
  readonly timeSpentSeconds: number;
  readonly learningStreakDays: number;
  readonly lastActivityAt: string;
  readonly recentlyCompletedLessonIds: readonly string[];
};

export type AcademyDashboard = {
  readonly generatedAt: string;
  readonly continueLearning: {
    readonly lessonId: string | null;
    readonly pathId: string | null;
    readonly label: string | null;
  };
  readonly recommendedLessons: readonly AcademyLessonModel[];
  readonly learningPaths: readonly CurriculumLearningPath[];
  readonly certificates: readonly CertificationAward[];
  readonly recentlyCompleted: readonly string[];
  readonly quizResults: readonly QuizAttempt[];
  readonly timeSpentLearningSeconds: number;
  readonly learningStreakDays: number;
};

export type AcademyAnalyticsSnapshot = {
  readonly generatedAt: string;
  readonly lessonCompletions: Readonly<Record<string, number>>;
  readonly averageCompletionSeconds: Readonly<Record<string, number>>;
  readonly quizScores: Readonly<Record<string, number>>;
  readonly dropOffLessonIds: readonly string[];
  readonly mostViewedLessonIds: readonly string[];
  readonly leastUnderstoodWorkflows: readonly string[];
};
