import type { PlatformModule } from "@/lib/platform/automation/types";
import type { MissionControlItemType } from "@/lib/platform/automation/types";

export const OPERATIONAL_LOOP_STAGES = [
  "admissions",
  "enrollment",
  "scheduling",
  "instruction",
  "evidence",
  "progress",
  "parent_communication",
  "billing",
] as const;

export type OperationalLoopStage = (typeof OPERATIONAL_LOOP_STAGES)[number];

export const OPERATIONAL_LOOP_TRANSITION_KEYS = [
  "admissions_to_enrollment",
  "enrollment_to_scheduling",
  "scheduling_to_instruction",
  "instruction_to_evidence",
  "evidence_to_progress",
  "progress_to_parent_communication",
  "parent_communication_to_billing",
  "billing_to_scheduling_cycle",
] as const;

export type OperationalLoopTransitionKey = (typeof OPERATIONAL_LOOP_TRANSITION_KEYS)[number];

export interface LoopTransitionDefinition {
  transitionKey: OperationalLoopTransitionKey;
  fromStage: OperationalLoopStage;
  toStage: OperationalLoopStage;
  label: string;
  eventType: string;
  ruleSetKeys: string[];
  capabilityKey?: string;
  nextWorkModule: PlatformModule;
  nextWorkItemType: MissionControlItemType;
  nextWorkTitle: string;
  nextWorkHref: string;
  profileSections: string[];
}

export type TransitionSideEffect =
  | "publish_event"
  | "workflow_state"
  | "platform_audit"
  | "rules_engine"
  | "jag_profile"
  | "paj_journey"
  | "mission_control"
  | "executive_intelligence";

export interface LoopTransitionContext {
  transitionKey: OperationalLoopTransitionKey;
  studentId: string;
  schoolId: string;
  organizationId?: string | null;
  actorUserId?: string | null;
  relatedEntityType?: string;
  relatedEntityId?: string;
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  cycleNumber?: number;
}

export interface LoopSideEffectResult {
  effect: TransitionSideEffect;
  success: boolean;
  detail?: string;
  error?: string;
}

export interface LoopTransitionResult {
  success: boolean;
  transitionKey: OperationalLoopTransitionKey;
  fromStage: OperationalLoopStage;
  toStage: OperationalLoopStage;
  attemptId: string;
  instanceId?: string;
  sideEffects: LoopSideEffectResult[];
  errors: string[];
  recoverable: boolean;
}

export interface LoopTransitionAuditEntry {
  id: string;
  attemptId: string;
  transitionKey: OperationalLoopTransitionKey;
  studentId: string;
  schoolId: string | null;
  status: "completed" | "failed" | "retrying";
  fromStage: OperationalLoopStage;
  toStage: OperationalLoopStage;
  sideEffects: LoopSideEffectResult[];
  errors: string[];
  actorUserId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface LoopTransitionDiagnostic {
  transitionKey: OperationalLoopTransitionKey;
  stage: OperationalLoopStage;
  status: "complete" | "missing" | "failed" | "unknown";
  lastAttemptAt?: string;
  lastError?: string;
  evidence?: string;
}

export interface LoopGapReport {
  studentId: string;
  studentName: string;
  schoolId: string;
  currentStage: OperationalLoopStage | null;
  cycleNumber: number;
  diagnostics: LoopTransitionDiagnostic[];
  gaps: {
    transitionKey: OperationalLoopTransitionKey;
    label: string;
    reason: string;
    severity: "critical" | "warning" | "info";
  }[];
  completenessPct: number;
}

export interface OperationalLoopSummary {
  activeStudents: number;
  byStage: Record<OperationalLoopStage, number>;
  failedTransitions24h: number;
  completedTransitions24h: number;
  openGaps: number;
  recentTransitions: LoopTransitionAuditEntry[];
}
