/**
 * Mr. JAG™ — shared types for the platform intelligence guide.
 */

export const MR_JAG_PERSONAS = [
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
] as const;

export type MrJagPersona = (typeof MR_JAG_PERSONAS)[number];

export type TutorialDifficulty = "Beginner" | "Intermediate" | "Advanced";

/** Page-level learning metadata — products register; Mr. JAG does not hardcode lessons. */
export type TutorialPageMetadata = {
  readonly pageId: string;
  readonly productId: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly prerequisites: readonly string[];
  readonly difficulty: TutorialDifficulty;
  readonly learningObjectives: readonly string[];
  readonly relatedPages: readonly string[];
  readonly relatedWorkflows: readonly string[];
  readonly personas: readonly MrJagPersona[];
  readonly overview?: string;
  readonly bestPractices?: readonly string[];
  readonly videoLessonUrl?: string | null;
  readonly quizId?: string | null;
  readonly certificationId?: string | null;
  /** P-003 — optional page→academy bindings */
  readonly lessonId?: string | null;
  readonly walkthroughId?: string | null;
  readonly relatedLessonIds?: readonly string[];
};

export type LearningPathStep = {
  readonly pageId: string;
  readonly label: string;
  readonly order: number;
};

export type LearningPath = {
  readonly id: string;
  readonly title: string;
  readonly persona: MrJagPersona;
  readonly productId: string;
  readonly steps: readonly LearningPathStep[];
  readonly certificationId?: string | null;
};

export type WalkthroughStep = {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly body: string;
  readonly targetSelector?: string | null;
  readonly pageId: string;
};

export type WalkthroughDefinition = {
  readonly id: string;
  readonly title: string;
  readonly pageId: string;
  readonly productId: string;
  readonly personas: readonly MrJagPersona[];
  readonly steps: readonly WalkthroughStep[];
  readonly estimatedMinutes: number;
};

export type HelpEvidence = {
  readonly source: "documentation" | "knowledge_graph" | "per" | "release" | "operations" | "tutorial";
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly path?: string;
};

export type HelpResponse = {
  readonly question: string;
  readonly persona: MrJagPersona | null;
  readonly answer: string;
  readonly intent: string;
  readonly evidence: readonly HelpEvidence[];
  readonly recommendedWalkthroughIds: readonly string[];
  readonly recommendedPageIds: readonly string[];
  readonly fixRecommendations: readonly string[];
  readonly generatedAt: string;
};

export type AcademyLesson = {
  readonly pageId: string;
  readonly title: string;
  readonly overview: string;
  readonly videoLessonUrl: string | null;
  readonly walkthroughId: string | null;
  readonly bestPractices: readonly string[];
  readonly quizId: string | null;
  readonly certificationId: string | null;
  readonly estimatedMinutes: number;
  readonly difficulty: TutorialDifficulty;
  readonly learningObjectives: readonly string[];
};

export type CoachTrigger =
  | "first_login"
  | "first_invoice"
  | "first_payroll"
  | "first_student"
  | "first_intervention"
  | "first_attendance"
  | "first_invite";

export type CoachTip = {
  readonly id: string;
  readonly trigger: CoachTrigger;
  readonly persona: MrJagPersona;
  readonly title: string;
  readonly body: string;
  readonly pageId?: string;
  readonly walkthroughId?: string;
  readonly priority: number;
};

export type WalkthroughProgressStatus =
  | "active"
  | "paused"
  | "skipped"
  | "completed";

export type WalkthroughProgress = {
  readonly walkthroughId: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly currentStepIndex: number;
  readonly completed: boolean;
  readonly resumedAt: string | null;
  readonly completedAt: string | null;
  readonly updatedAt: string;
  /** P-003 — pause/skip lifecycle (optional for backward compatibility) */
  readonly status?: WalkthroughProgressStatus;
  readonly autoAdvance?: boolean;
};

export type LearningProgress = {
  readonly userId: string;
  readonly organizationId: string;
  readonly persona: MrJagPersona;
  readonly completedPageIds: readonly string[];
  readonly completedWalkthroughIds: readonly string[];
  readonly pathId: string | null;
  readonly pathStepIndex: number;
  readonly certifications: readonly string[];
  readonly recentQuestionIds: readonly string[];
  readonly updatedAt: string;
};

export type MrJagDashboard = {
  readonly generatedAt: string;
  readonly persona: MrJagPersona;
  readonly recommendedLessons: readonly AcademyLesson[];
  readonly continueLearning: {
    readonly pathId: string | null;
    readonly nextPageId: string | null;
    readonly label: string | null;
  };
  readonly recentQuestions: readonly string[];
  readonly suggestedWalkthroughs: readonly WalkthroughDefinition[];
  readonly learningProgress: LearningProgress | null;
  readonly certifications: readonly string[];
  readonly coachingTips: readonly CoachTip[];
};

export type KnowledgeHit = {
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly kind: HelpEvidence["source"];
  readonly path?: string;
  readonly score: number;
};
