export {
  canAccessHrAdmin,
  canManageHr,
  canRunPayroll,
  canAccessEmployeePortal,
  canManageAllHcm,
  canViewSchoolEmployees,
  canViewOwnEmployeeProfile,
  canViewPayrollInfo,
  canEditHcm,
  assertCanViewHcm,
  assertCanEditHcm,
  requireHcmViewAccess,
  requireHcmEditAccess,
} from "./access";

export { recordHcmActivity } from "./activity";
export {
  canTransition,
  transitionEmployeeLifecycle,
  promoteEmployee,
} from "./lifecycle";
export {
  scheduleInterview,
  extendOffer,
  hireApplicant,
  convertOfferToOnboarding,
} from "./recruiting";
export {
  ensureExtendedOnboardingTasks,
  completeOnboardingTask,
  listOnboardingTasks,
} from "./onboarding";
export {
  createEmploymentContract,
  updateContractStatus,
  renewContract,
  listEmployeeContracts,
} from "./contracts";
export {
  listExpiringCertifications,
  emitCertificationExpiringAlerts,
} from "./certifications";
export {
  createPerformanceReview,
  completePerformanceReview,
  createPerformanceGoal,
  addPerformanceNote,
} from "./performance";
export {
  createPdCourse,
  assignTraining,
  completeTraining,
} from "./professional-development";
export { submitLeaveRequest, decideLeaveRequest } from "./leave";
export { assignEmployee, listEmployeeAssignments } from "./assignments";
export { sendHcmCommunication } from "./communications";
export {
  ensureHrisExtensionsRegistered,
  syncHrisProvider,
} from "./integrations";
export { getHcmOperationsSummary } from "./reports";
export { LIFECYCLE_STATES, LIFECYCLE_TRANSITIONS } from "./types";
export type * from "./types";
