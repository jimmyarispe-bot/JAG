export type {
  AcademyAnalyticsSnapshot,
  AcademyDashboard,
  AcademyLearnerProgress,
  AcademyLessonModel,
  CertificationAward,
  CertificationKind,
  CurriculumLearningPath,
  CurriculumPathLesson,
  LessonNarrationScript,
  LessonScriptBlock,
  LessonScriptSection,
  QuizAttempt,
  QuizDefinition,
  QuizQuestion,
  QuizQuestionKind,
} from "./types";
export {
  resetAcademyEngineStoreForTests,
  listLessons,
  listPaths,
  listQuizzes,
} from "./store";
export { registerAcademyContent, type AcademyRegistrationBundle } from "./registry";
export { lessonFromPageMetadata } from "./lessons/model";
export { generateLessonScript } from "./scripts/generator";
export { bootstrapAcademyCurriculum } from "./curriculum/bootstrap";
export {
  scoreQuiz,
  explainQuiz,
  listQuizCatalog,
  listAttemptsForUser,
} from "./quizzes/service";
export {
  awardCertification,
  awardPathCertification,
  listUserCertifications,
} from "./certifications/service";
export {
  ensureAcademyProgress,
  completeAcademyLesson,
} from "./progress/tracker";
export { recommendLessons } from "./recommendations/engine";
export { getAcademyAnalytics } from "./analytics/service";
export {
  MrJagAcademyEngine,
  createMrJagAcademyEngine,
} from "./engine";
/** P-001 compatibility surface */
export {
  MrJagAcademyService,
  createMrJagAcademyService,
} from "./service";
