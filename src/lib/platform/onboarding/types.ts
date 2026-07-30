/**
 * Sprint 212 — Executive onboarding & organization provisioning types.
 */

export const ONBOARDING_STEP_IDS = [
  "welcome",
  "organization",
  "brand",
  "executive_profile",
  "mission_strategy",
  "capabilities",
  "connect_systems",
  "review",
  "generate_workspace",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed";

export type OnboardingExecutiveMember = {
  readonly name: string;
  readonly role: "founder" | "ceo" | "executive" | "other";
  readonly email: string;
  readonly title?: string;
};

export type OnboardingOrganizationDraft = {
  readonly organizationName: string;
  readonly subdomain: string;
  readonly industry: string;
  readonly timezone: string;
  readonly logoUrl: string;
  readonly country: string;
};

export type OnboardingBrandDraft = {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly headingFont: string;
  readonly bodyFont: string;
  readonly lightLogoUrl: string;
  readonly darkLogoUrl: string;
};

export type OnboardingMissionDraft = {
  readonly mission: string;
  readonly vision: string;
  readonly coreValues: readonly string[];
  readonly strategicPillars: readonly string[];
  readonly goals: readonly string[];
};

export type OnboardingConnectorSelection = {
  readonly connectorId: string;
  readonly label: string;
  readonly category: string;
  readonly selected: boolean;
  readonly connected: boolean;
};

export type OnboardingTaskId =
  | "complete_integrations"
  | "invite_executives"
  | "configure_branding"
  | "review_strategy"
  | "generate_first_decision";

export type OnboardingTask = {
  readonly id: OnboardingTaskId;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly completed: boolean;
  readonly createdAt: string;
};

export type OnboardingSession = {
  readonly id: string;
  readonly ownerUserId: string;
  readonly ownerEmail: string;
  readonly status: OnboardingStatus;
  readonly currentStep: OnboardingStepId;
  readonly completedSteps: readonly OnboardingStepId[];
  readonly organization: OnboardingOrganizationDraft;
  readonly brand: OnboardingBrandDraft;
  readonly executives: readonly OnboardingExecutiveMember[];
  readonly mission: OnboardingMissionDraft;
  readonly enabledCapabilityIds: readonly string[];
  readonly connectors: readonly OnboardingConnectorSelection[];
  readonly organizationId: string | null;
  readonly briefingId: string | null;
  readonly readinessScore: number;
  readonly estimatedMinutesRemaining: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly lastError: string | null;
};

export type OnboardingObservationKind =
  | "provisioning"
  | "step_entered"
  | "step_completed"
  | "paused"
  | "resumed"
  | "validation_failure"
  | "connector_success"
  | "connector_failure"
  | "workspace_generated"
  | "brief_generated"
  | "completed"
  | "drop_off";

export type OnboardingObservation = {
  readonly id: string;
  readonly kind: OnboardingObservationKind;
  readonly at: string;
  readonly sessionId: string;
  readonly stepId?: OnboardingStepId;
  readonly detail: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

export type ProvisionWorkspaceResult =
  | {
      readonly ok: true;
      readonly organizationId: string;
      readonly briefingId: string;
      readonly session: OnboardingSession;
    }
  | { readonly ok: false; readonly error: string; readonly session: OnboardingSession };
