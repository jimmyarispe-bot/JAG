/**
 * Mr. JAG™ — public platform capability entry.
 */

export {
  MR_JAG_DESCRIPTOR,
  MR_JAG_ID,
  MR_JAG_MODULES,
  MR_JAG_VERSION,
} from "./manifest";
export {
  MR_JAG_PERSONAS,
  type AcademyLesson,
  type CoachTip,
  type CoachTrigger,
  type HelpEvidence,
  type HelpResponse,
  type KnowledgeHit,
  type LearningPath,
  type LearningProgress,
  type MrJagDashboard,
  type MrJagPersona,
  type TutorialDifficulty,
  type TutorialPageMetadata,
  type WalkthroughDefinition,
  type WalkthroughProgress,
  type WalkthroughStep,
} from "./types";
export {
  resetMrJagStoreForTests,
  listTutorials,
  listLearningPaths,
  listWalkthroughs,
} from "./store";
export { installMrJag, type MrJagInstallResult } from "./install";
export {
  listPersonas,
  normalizePersona,
  personaFocus,
  adaptAnswerTone,
} from "./personas";
export {
  buildMrJagKnowledgeIndex,
  searchMrJagKnowledge,
} from "./knowledge";
export {
  registerMrJagContent,
  getPageLearningMetadata,
  listPageLearningMetadata,
  listRegisteredLearningPaths,
  listRegisteredWalkthroughs,
  type MrJagContentBundle,
} from "./tutorials/registry";
export { bootstrapMrJagCatalog } from "./tutorials/bootstrap";
export {
  MrJagHelpService,
  createMrJagHelpService,
} from "./help/service";
export {
  MrJagIntelligentHelpService,
  createMrJagIntelligentHelpService,
  gatherDiagnostics,
  analyzeRootCause,
  buildRecommendations,
  captureResolution,
  listKnowledgeBase,
  listIncidents,
  resetIntelligentHelpStoreForTests,
  type CapturedKnowledgeEntry,
  type DiagnosisConfidence,
  type DiagnosticBundle,
  type DiagnosticSignal,
  type HelpIncident,
  type IncidentStatus,
  type IntelligentHelpDashboard,
  type IntelligentHelpResult,
  type RootCauseDiagnosis,
} from "./help/intelligence";
export {
  MrJagAcademyService,
  createMrJagAcademyService,
} from "./academy/service";
export {
  MrJagAcademyEngine,
  createMrJagAcademyEngine,
  bootstrapAcademyCurriculum,
  registerAcademyContent,
  generateLessonScript,
  lessonFromPageMetadata,
  resetAcademyEngineStoreForTests,
  type AcademyAnalyticsSnapshot,
  type AcademyDashboard,
  type AcademyLearnerProgress,
  type AcademyLessonModel,
  type AcademyRegistrationBundle,
  type CertificationAward,
  type CertificationKind,
  type CurriculumLearningPath,
  type LessonNarrationScript,
  type QuizAttempt,
  type QuizDefinition,
} from "./academy";
export {
  MrJagCoachService,
  createMrJagCoachService,
} from "./coach/service";
export {
  MrJagCoachEngine,
  createMrJagCoachEngine,
  resetCoachEngineStoreForTests,
  observeCoachEvent,
  registerCoachEvent,
  generateCoachRecommendations,
  detectCoachRisks,
  syncHelpIncidentsIntoCoach,
  scoreRecommendation,
  type CoachAnalyticsSnapshot,
  type CoachDashboard,
  type CoachEventKind,
  type CoachGoal,
  type CoachObservationEvent,
  type CoachRecommendation,
  type CoachRisk,
  type CoachTimelineEntry,
  type CoachingType,
  type CustomEventRegistration,
} from "./coach";
export {
  MrJagWalkthroughEngine,
  createMrJagWalkthroughEngine,
  type WalkthroughSession,
} from "./walkthroughs/engine";
export {
  MrJagProgressService,
  createMrJagProgressService,
} from "./progress/service";
export { buildMrJagDashboard } from "./dashboard";
export {
  createMrJagVoiceService,
  synthesizeMrJagVoice,
} from "./voice";
export {
  createMrJagAvatarService,
  resolveMrJagAvatar,
} from "./avatar";
