import type { CorrelationId, RuntimeId, SessionId } from "../types/ids";
import type { RuntimeLifecycleState, RuntimePipelineStageId } from "../types/stages";
import type { RuntimeAction } from "./action";
import type { RuntimeEvidenceReference } from "./evidence";
import type { RuntimeExperience } from "./experience";
import type { RuntimeIdentity } from "./identity";
import type { RuntimeIntent } from "./intent";
import type { RuntimeMemoryReference } from "./memory";
import type { RuntimeOrganizationalContext } from "./organizational-context";
import type { RuntimePipelineTrigger } from "./pipeline-stage";
import type { RuntimeTwinReference } from "./twin";

/**
 * Execution context for a single pipeline run.
 * Not the organizational Context stage output.
 */
export interface RuntimeContext {
  runtimeId: RuntimeId;
  correlationId: CorrelationId;
  sessionId?: SessionId;
  signal: AbortSignal;
  startedAt: string;
  lifecycle: RuntimeLifecycleState;
  currentStageId?: RuntimePipelineStageId;
  trigger?: RuntimePipelineTrigger;
  /** Mutable stage bag — identity, context, intent, etc. */
  state: RuntimeExecutionState;
  /** Convenience setters used by skeleton stages / adapters. */
  setIdentity(identity: RuntimeIdentity): void;
  setOrganizationalContext(context: RuntimeOrganizationalContext): void;
  setIntent(intent: RuntimeIntent): void;
  setCognition(cognition: Readonly<Record<string, unknown>>): void;
  setExperience(experience: RuntimeExperience): void;
  setAction(action: RuntimeAction): void;
  setDomain(domain: Readonly<Record<string, unknown>>): void;
  addEvidence(refs: readonly RuntimeEvidenceReference[]): void;
  addMemory(refs: readonly RuntimeMemoryReference[]): void;
  addTwin(refs: readonly RuntimeTwinReference[]): void;
  /** Throw if aborted. */
  throwIfCancelled(): void;
}

export interface RuntimeExecutionState {
  identity?: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  cognition?: Readonly<Record<string, unknown>>;
  experience?: RuntimeExperience;
  action?: RuntimeAction;
  domain?: Readonly<Record<string, unknown>>;
  evidence: RuntimeEvidenceReference[];
  memory: RuntimeMemoryReference[];
  twin: RuntimeTwinReference[];
  /** Free-form bag for extensions. */
  data: Record<string, unknown>;
}
