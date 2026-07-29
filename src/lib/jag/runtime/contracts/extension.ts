import type { RuntimePipelineStageId } from "../types/stages";

export type RuntimeExtensionKind =
  | "domain_package"
  | "pipeline_stage"
  | "event_listener"
  | "experience_provider"
  | "action_provider"
  | "generic";

/**
 * Generic Runtime extension descriptor.
 * Packs register via the Registry — Kernel never hard-codes Education.
 */
export interface RuntimeExtension {
  id: string;
  kind: RuntimeExtensionKind;
  /** Semver or contract version this extension targets. */
  runtimeContractVersion?: string;
  domainPackageId?: string;
  /** Stages this extension contributes to, if any. */
  stages?: readonly RuntimePipelineStageId[];
  priority?: number;
  enabled?: boolean;
  metadata?: Readonly<Record<string, unknown>>;
  /** Optional lifecycle hooks — no domain logic in Kernel. */
  onRegister?(api: RuntimeExtensionApi): void | Promise<void>;
  onUnregister?(api: RuntimeExtensionApi): void | Promise<void>;
}

/** Narrow API passed to extension lifecycle hooks. */
export interface RuntimeExtensionApi {
  extensionId: string;
  /** Opaque handle — typed as unknown to avoid circular deps at contract layer. */
  runtime: unknown;
}

export interface RuntimeDomainPackageRegistration {
  id: string;
  name: string;
  version?: string;
  runtimeContractVersion?: string;
  metadata?: Readonly<Record<string, unknown>>;
}
