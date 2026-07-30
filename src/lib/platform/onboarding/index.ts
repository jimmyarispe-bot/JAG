/**
 * Sprint 212 — Organization provisioning & executive onboarding.
 * Import via `@/lib/platform/onboarding` or `…/onboarding/index`.
 */

export {
  ONBOARDING_STEP_IDS,
  type OnboardingStepId,
  type OnboardingStatus,
  type OnboardingSession,
  type OnboardingOrganizationDraft,
  type OnboardingBrandDraft,
  type OnboardingMissionDraft,
  type OnboardingExecutiveMember,
  type OnboardingConnectorSelection,
  type OnboardingTask,
  type OnboardingTaskId,
  type OnboardingObservation,
  type OnboardingObservationKind,
  type ProvisionWorkspaceResult,
} from "./types";

export {
  ONBOARDING_STEPS,
  TOTAL_ONBOARDING_MINUTES,
  DEFAULT_ONBOARDING_CAPABILITY_IDS,
  getStepDefinition,
  nextStepId,
  previousStepId,
  type OnboardingStepDefinition,
} from "./steps";

export { OrganizationProvisioningService } from "./OrganizationProvisioningService";
export { TenantProvisioner } from "./TenantProvisioner";
export { ExecutiveOnboardingService } from "./ExecutiveOnboardingService";
export { OnboardingStateMachine } from "./OnboardingStateMachine";
export { ProgressTracker, type ProgressSnapshot } from "./ProgressTracker";
export { ChecklistService } from "./ChecklistService";
export { WelcomeService, type WelcomeContent, type WelcomeBriefPayload } from "./WelcomeService";
export {
  recordOnboardingObservation,
  listOnboardingObservations,
  summarizeDropOffPoints,
  clearOnboardingObservationsForTests,
} from "./OnboardingObservability";
export { generateWelcomeExecutiveBrief } from "./welcome-brief";
