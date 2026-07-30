/**
 * Sprint 212 — JAG Command Center onboarding adapters.
 */

export {
  loadOnboardingWorkspace,
  type JagOnboardingWorkspace,
} from "./load-onboarding";

export {
  saveOnboardingOrganizationAction,
  saveOnboardingBrandAction,
  saveOnboardingExecutivesAction,
  saveOnboardingMissionAction,
  saveOnboardingCapabilitiesAction,
  saveOnboardingConnectorsAction,
  completeOnboardingStepAction,
  goToOnboardingStepAction,
  goBackOnboardingStepAction,
  pauseOnboardingAction,
  resumeOnboardingAction,
  generateOnboardingWorkspaceAction,
  type OnboardingActionResult,
} from "./actions";
