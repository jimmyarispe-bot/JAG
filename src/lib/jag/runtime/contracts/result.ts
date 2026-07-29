import type { RuntimePipelineStageId } from "../types/stages";
import type { RuntimeAction } from "./action";
import type { RuntimeEvidenceReference } from "./evidence";
import type { RuntimeExperience } from "./experience";
import type { RuntimeIdentity } from "./identity";
import type { RuntimeIntent } from "./intent";
import type { RuntimeMemoryReference } from "./memory";
import type { RuntimeOrganizationalContext } from "./organizational-context";
import type { RuntimeTwinReference } from "./twin";

export type RuntimeResultStatus =
  | "completed"
  | "aborted"
  | "failed"
  | "cancelled";

export interface RuntimeStageOutcome {
  stageId: RuntimePipelineStageId;
  status: "completed" | "skipped" | "failed" | "cancelled";
  durationMs: number;
  error?: { name: string; message: string; code?: string };
}

export interface RuntimeResult {
  status: RuntimeResultStatus;
  correlationId: string;
  runtimeId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stages: readonly RuntimeStageOutcome[];
  identity?: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  cognition?: Readonly<Record<string, unknown>>;
  experience?: RuntimeExperience;
  action?: RuntimeAction;
  domain?: Readonly<Record<string, unknown>>;
  evidence?: readonly RuntimeEvidenceReference[];
  memory?: readonly RuntimeMemoryReference[];
  twin?: readonly RuntimeTwinReference[];
  /** Stage bag for custom stage outputs. */
  data: Readonly<Record<string, unknown>>;
  error?: { name: string; message: string; code?: string; stageId?: string };
}
