/**
 * Autonomous Executive Operating Loop — public API (Sprint 016).
 */

export {
  AUTONOMOUS_EXECUTIVE_LOOP_VERSION,
  AUTONOMY_APPROVAL_MODES,
  AUTONOMY_ESCALATION_SEVERITIES,
  AUTONOMY_GOVERNANCE_ACTIONS,
  AUTONOMY_LOOP_PHASES,
  AUTONOMY_LOOP_STATUSES,
  AUTONOMY_PRIORITY_DIMENSIONS,
  AUTONOMY_ROOT_CAUSE_KINDS,
  type AutonomyApprovalMode,
  type AutonomyDecisionResult,
  type AutonomyDiagnosisResult,
  type AutonomyEscalationNotice,
  type AutonomyEscalationResult,
  type AutonomyEscalationSeverity,
  type AutonomyExecutionPackage,
  type AutonomyGovernanceAction,
  type AutonomyGovernanceDecision,
  type AutonomyGovernancePolicy,
  type AutonomyLearningResult,
  type AutonomyLoopPhase,
  type AutonomyLoopRequest,
  type AutonomyLoopResult,
  type AutonomyLoopStatus,
  type AutonomyMeasurementResult,
  type AutonomyMetadata,
  type AutonomyObservationResult,
  type AutonomyObservationSignal,
  type AutonomyPlan,
  type AutonomyPlanStep,
  type AutonomyPrioritizationResult,
  type AutonomyPriorityDimension,
  type AutonomyPriorityItem,
  type AutonomyReflectionResult,
  type AutonomyRootCause,
  type AutonomyRootCauseKind,
  type AutonomyScheduleJob,
} from "@/lib/platform/autonomy/types";

export {
  DEFAULT_AUTONOMY_POLICIES,
  AutonomyGovernance,
  type AutonomyGovernanceDependencies,
} from "@/lib/platform/autonomy/governance";

export {
  AutonomyObservation,
  type AutonomyObservationDependencies,
} from "@/lib/platform/autonomy/observation";

export {
  AutonomyDiagnosis,
  type AutonomyDiagnosisDependencies,
} from "@/lib/platform/autonomy/diagnosis";

export {
  AutonomyPlanning,
  type AutonomyPlanningDependencies,
} from "@/lib/platform/autonomy/planning";

export {
  AutonomyDecision,
  type AutonomyDecisionDependencies,
} from "@/lib/platform/autonomy/decision";

export {
  AutonomyExecution,
  type AutonomyExecutionDependencies,
} from "@/lib/platform/autonomy/execution";

export {
  AutonomyMeasurement,
  type AutonomyMeasurementDependencies,
} from "@/lib/platform/autonomy/measurement";

export {
  AutonomyLearning,
  type AutonomyLearningDependencies,
} from "@/lib/platform/autonomy/learning";

export {
  AutonomyReflection,
  type AutonomyReflectionDependencies,
} from "@/lib/platform/autonomy/reflection";

export {
  AutonomyPrioritization,
  type AutonomyPrioritizationDependencies,
} from "@/lib/platform/autonomy/prioritization";

export {
  AutonomyEscalation,
  type AutonomyEscalationDependencies,
} from "@/lib/platform/autonomy/escalation";

export {
  AutonomyScheduler,
  InMemoryAutonomyScheduleRunner,
  type AutonomyScheduleRunner,
  type AutonomySchedulerDependencies,
} from "@/lib/platform/autonomy/scheduler";

export {
  AutonomousExecutiveLoop,
  createAutonomousExecutiveLoop,
  type AutonomousExecutiveLoopDependencies,
} from "@/lib/platform/autonomy/executive-loop";
