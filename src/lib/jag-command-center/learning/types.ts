/**
 * JAG Learning Center — domain types (product tutorials, not AcademyOS).
 */

export type JagLearnTutorialCategory = "orientation" | "essentials" | "help";
export type JagLearnDifficulty = "beginner" | "intermediate" | "advanced";
export type JagLearnProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export type JagLearnTutorialStep = {
  readonly title: string;
  readonly body: string;
};

export type JagLearnTutorialContent = {
  readonly summary: string;
  readonly steps: readonly JagLearnTutorialStep[];
};

export type JagLearnTutorial = {
  readonly id: string;
  readonly slug: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly category: JagLearnTutorialCategory;
  readonly difficulty: JagLearnDifficulty;
  readonly estimatedMinutes: number;
  /** Capability id required; null = any authorized JAG user. */
  readonly requiredCapabilityId: string | null;
  readonly product: "jag";
  readonly content: JagLearnTutorialContent;
  /**
   * Durable Learning media path (e.g. tutorials/JAG-001/mr-jag.mp4) or null.
   * Never a temporary HeyGen CDN URL. Runtime converts paths to signed https URLs.
   */
  readonly videoUrl: string | null;
  readonly walkthroughId: string | null;
  readonly pageId: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
};

export type JagLearnUserProgress = {
  readonly id: string;
  readonly userId: string;
  readonly tutorialId: string;
  readonly status: JagLearnProgressStatus;
  readonly progressPercent: number;
  readonly currentStep: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly updatedAt: string;
};

export type JagLearnUserPreferences = {
  readonly id: string;
  readonly userId: string;
  readonly firstLoginCompleted: boolean;
  readonly onboardingStartedAt: string | null;
  readonly onboardingCompletedAt: string | null;
  readonly onboardingSkippedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type JagLearnCoachAnswer = {
  readonly answer: string;
  readonly recommendedTutorialSlugs: readonly string[];
  readonly deepLinks: readonly { readonly label: string; readonly href: string }[];
  readonly evidenceSource: "jag_learn_catalog";
};

export type JagLearnWalkthroughStep = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly targetSelector: string;
};

export type JagLearnWalkthrough = {
  readonly id: string;
  readonly pageId: string;
  readonly title: string;
  readonly steps: readonly JagLearnWalkthroughStep[];
};

/** Home page model — shape only; populated by server loaders. */
export type LearningHomeModel = {
  readonly preferences: JagLearnUserPreferences;
  readonly showFirstLoginWelcome: boolean;
  readonly continueLearning: {
    readonly tutorial: JagLearnTutorial;
    readonly progress: JagLearnUserProgress;
  } | null;
  readonly recommended: readonly JagLearnTutorial[];
  readonly essentials: readonly JagLearnTutorial[];
  readonly orientation: readonly JagLearnTutorial[];
};
