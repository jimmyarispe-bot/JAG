export type WorkflowStartRequest = {
  definitionId: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  organizationId?: string | null;
  facts?: Record<string, unknown>;
  reason?: string | null;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
};

export type WorkflowTransitionRequest = {
  instanceId: string;
  transitionKey: string;
  actorUserId?: string | null;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
  reason?: string | null;
  factUpdates?: Record<string, unknown>;
};

export type WorkflowAdapterResult = {
  instanceId: string;
  definitionId: string;
  currentState: string;
  status: string;
};
