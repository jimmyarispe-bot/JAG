/**
 * Universal Organization Model™ — public platform entry (P-007).
 */

export const ORGANIZATION_MODEL_ID = "universal-organization-model" as const;
export const ORGANIZATION_MODEL_VERSION = "1.0.0" as const;

export const ORGANIZATION_MODEL_DESCRIPTOR = Object.freeze({
  id: ORGANIZATION_MODEL_ID,
  name: "Universal Organization Model™" as const,
  version: ORGANIZATION_MODEL_VERSION,
  type: "platform-capability" as const,
  description:
    "Canonical organizational model with governance profiles, Organizational Constitution™, Strategy Execution Engine™, and Organizational Performance™ — one codebase for any organization type.",
});

export type {
  ConstitutionAdvice,
  FinanceHooks,
  GoalLevel,
  GovernanceProfile,
  GovernanceProfileId,
  OrgGoal,
  OrgIdentity,
  OrganizationDashboard,
  OrganizationalConstitution,
  StrategyMode,
  UniversalOrganization,
} from "./types";
export { GOVERNANCE_PROFILE_IDS } from "./types";
export {
  resetOrganizationStoreForTests,
  getOrganization,
  listOrganizations,
  listGoals,
} from "./store";
export {
  listGovernanceProfiles,
  getGovernanceProfile,
  normalizeGovernanceProfileId,
} from "./profiles/catalog";
export { bootstrapUniversalOrganization } from "./identity/bootstrap";
export {
  getConstitution,
  updateConstitution,
} from "./governance/constitution";
export { adviseWithConstitution } from "./mr-jag/constitution-advice";
export {
  setStrategyMode,
  upsertStrategicPlan,
  createGoal,
  describeStrategyChain,
} from "./strategy/engine";
export {
  updateGoalProgress,
  createKpi,
  createMilestone,
  recordReview,
  recordOneOnOne,
  performanceAnalytics,
} from "./performance/engine";
export {
  UniversalOrganizationEngine,
  createUniversalOrganizationEngine,
  createOrganizationModelEngine,
} from "./engine";
