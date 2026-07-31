/**
 * JAG Process Engine — immutable core contracts.
 * Industry-agnostic: no education, healthcare, or domain-specific fields.
 */

export type ProcessId = string;
export type StageId = string;
export type ProcessInstanceId = string;

/** Declared by application packages; executed by JAG. */
export type ProcessDefinition = {
  readonly id: ProcessId;
  readonly applicationId: string;
  readonly version: string;
  readonly label: string;
  readonly description?: string;
  readonly initialStageId: StageId;
  readonly stages: readonly StageDefinition[];
  readonly transitions: readonly StageTransition[];
  readonly participants?: readonly ProcessParticipant[];
  readonly permissions?: readonly ProcessPermission[];
  /** Other process definition ids that must be registered first. */
  readonly dependsOn?: readonly ProcessId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  /**
   * Extension references by id only — never import framework implementations.
   * Adapters resolve these at runtime through ProcessExtensionPorts.
   */
  readonly extensions?: Readonly<{
    workflowDefinitionId?: string;
    formDefinitionIds?: readonly string[];
    entityTypeIds?: readonly string[];
    documentCategoryIds?: readonly string[];
    communicationTemplateIds?: readonly string[];
    /** Decision definition ids referenced by the process (evaluate via Decision Engine). */
    decisionDefinitionIds?: readonly string[];
    intelligencePackIds?: readonly string[];
    navigationModuleIds?: readonly string[];
  }>;
};

export type StageDefinition = {
  readonly id: StageId;
  readonly label: string;
  readonly description?: string;
  readonly kind: "initial" | "intermediate" | "terminal" | "cancelled";
  readonly behavior?: StageBehavior;
};

/** Declarative stage behavior hints — interpreted via adapters, not package code. */
export type StageBehavior = {
  readonly requiresFormId?: string;
  readonly requiresDocumentCategory?: string;
  readonly autoAdvance?: boolean;
  readonly onEnterHookIds?: readonly string[];
  readonly onExitHookIds?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type StageTransition = {
  readonly id: string;
  readonly from: StageId;
  readonly to: StageId;
  readonly label?: string;
  readonly guardPermission?: string;
  /** Named guard key evaluated by the runtime (not package-owned logic). */
  readonly guardKey?: string;
};

export type ProcessInstanceStatus =
  | "active"
  | "suspended"
  | "completed"
  | "cancelled";

export type ProcessInstance = {
  readonly id: ProcessInstanceId;
  readonly definitionId: ProcessId;
  readonly definitionVersion: string;
  readonly organizationId: string;
  readonly status: ProcessInstanceStatus;
  readonly currentStageId: StageId;
  readonly subjectId?: string;
  readonly startedByUserId: string;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly participants: readonly ProcessParticipant[];
  readonly stageHistory: readonly StageHistoryEntry[];
};

export type StageHistoryEntry = {
  readonly stageId: StageId;
  readonly enteredAt: string;
  readonly leftAt?: string;
};

export type ProcessSnapshot = {
  readonly instanceId: ProcessInstanceId;
  readonly definitionId: ProcessId;
  readonly capturedAt: string;
  readonly status: ProcessInstanceStatus;
  readonly currentStageId: StageId;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly participants: readonly ProcessParticipant[];
  readonly stageHistory: readonly StageHistoryEntry[];
};

export type ProcessEvent = {
  readonly id: string;
  readonly instanceId: ProcessInstanceId;
  readonly type: ProcessEventType;
  readonly occurredAt: string;
  readonly actorUserId?: string;
  readonly stageId?: StageId;
  readonly transitionId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
};

export type ProcessEventType =
  | "process.started"
  | "process.resumed"
  | "process.suspended"
  | "process.completed"
  | "process.cancelled"
  | "process.snapshot_restored"
  | "stage.entered"
  | "stage.executed"
  | "stage.validated"
  | "stage.left"
  | "transition.applied"
  | "participant.action"
  | "lifecycle.hook";

export type ProcessContext = {
  readonly organizationId: string;
  readonly actorUserId: string;
  readonly instance: ProcessInstance;
  readonly definition: ProcessDefinition;
  readonly now: () => Date;
};

export type ProcessParticipant = {
  readonly role: string;
  readonly userId?: string;
  readonly groupId?: string;
};

export type ProcessPermissionAction =
  | "start"
  | "resume"
  | "complete"
  | "cancel"
  | "suspend"
  | "transition"
  | "view";

export type ProcessPermission = {
  readonly action: ProcessPermissionAction;
  readonly roles?: readonly string[];
  readonly permissionKey?: string;
};

export type ProcessResultError = {
  readonly code: string;
  readonly message: string;
};

export type ProcessResult<T = void> = {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: ProcessResultError;
  readonly events?: readonly ProcessEvent[];
};

export type ProcessMetrics = {
  readonly instanceId: ProcessInstanceId;
  readonly definitionId: ProcessId;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly durationMs?: number;
  readonly stageDurations: readonly {
    readonly stageId: StageId;
    readonly durationMs: number;
  }[];
  readonly transitionCount: number;
  readonly participantActionCount: number;
};
