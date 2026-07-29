export type RuntimeActionStatus =
  | "succeeded"
  | "failed"
  | "pending_approval"
  | "rejected"
  | "undone"
  | "skipped";

export interface RuntimeAction {
  actionId: string;
  status: RuntimeActionStatus;
  domainPackageId?: string;
  workflowInstanceId?: string;
  evidenceRefs?: readonly import("./evidence").RuntimeEvidenceReference[];
  memoryRefs?: readonly import("./memory").RuntimeMemoryReference[];
  twinRefs?: readonly import("./twin").RuntimeTwinReference[];
  undoToken?: string;
  error?: { code: string; message: string };
  attributes?: Readonly<Record<string, unknown>>;
}

export interface RuntimeActionRequest {
  actionId: string;
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  confirmationToken?: string;
  cognitionRecommendationId?: string;
}

/**
 * @deprecated Removed from execution paths in Ω-7B.
 * Use ActionContributor via Action Runtime + registerActionContributor.
 */
export interface RuntimeActionProvider {
  id: string;
  actionIds: readonly string[];
  priority?: number;
  execute(
    request: RuntimeActionRequest,
    input: RuntimeActionProviderInput
  ): Promise<RuntimeAction> | RuntimeAction;
}

export interface RuntimeActionProviderInput {
  identity?: import("./identity").RuntimeIdentity;
  organizationalContext?: import("./organizational-context").RuntimeOrganizationalContext;
  intent?: import("./intent").RuntimeIntent;
  attributes?: Readonly<Record<string, unknown>>;
}
