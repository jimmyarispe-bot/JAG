/** The JAG Hierarchy — executable platform infrastructure types */

export const JAG_HIERARCHY_NODE_STATUSES = ["draft", "published", "deprecated", "archived"] as const;
export type JagHierarchyNodeStatus = (typeof JAG_HIERARCHY_NODE_STATUSES)[number];

/** Canonical layer kinds every executable capability may reference. */
export const JAG_HIERARCHY_LAYER_KINDS = [
  "vision",
  "mission",
  "core_values",
  "jag_way",
  "standard",
  "protocol",
  "process",
  "procedure",
  "rule",
  "parameter",
  "template",
  "playbook",
  "evidence",
  "knowledge",
  "intelligence",
  "automation",
  "execution",
  "outcome",
  "research",
  "innovation",
] as const;

export type JagHierarchyLayerKind = (typeof JAG_HIERARCHY_LAYER_KINDS)[number];

/** Governance chain kinds in top-down order. */
export const JAG_GOVERNANCE_CHAIN_KINDS = [
  "standard",
  "protocol",
  "process",
  "procedure",
] as const;

export type JagGovernanceChainKind = (typeof JAG_GOVERNANCE_CHAIN_KINDS)[number];

/** Cross-platform registry keys a hierarchy node may reference. */
export interface JagPlatformRefs {
  ruleSetKey?: string;
  decisionTypeKey?: string;
  eventType?: string;
  workflowKey?: string;
  automationKey?: string;
  evidenceTypeKey?: string;
  ulrCompetencyKey?: string;
  ulrDomainKey?: string;
  graphNodeKey?: string;
  parameterKeys?: string[];
  knowledgeAssetKeys?: string[];
  intelligenceServiceKeys?: string[];
}

export interface JagHierarchyNodeDefinition {
  nodeKey: string;
  kind: JagHierarchyLayerKind;
  title: string;
  description: string;
  version: string;
  status: JagHierarchyNodeStatus;
  parentKey?: string;
  sortOrder: number;
  platformRefs?: JagPlatformRefs;
  metadata?: Record<string, unknown>;
}

/** Binds an executable capability to its governing hierarchy context. */
export interface JagCapabilityBinding {
  capabilityKey: string;
  title: string;
  description: string;
  status: JagHierarchyNodeStatus;
  standardKey: string;
  protocolKey: string;
  processKey: string;
  procedureKey: string;
  ruleSetKeys: string[];
  parameterKeys: string[];
  evidenceTypeKeys: string[];
  knowledgeAssetKeys: string[];
  intelligenceServiceKeys: string[];
  workflowKey?: string;
  automationKey?: string;
  decisionTypeKey?: string;
  eventType?: string;
  sortOrder: number;
  /** Permissions required to grant this capability (any match). */
  requiredPermissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface JagHierarchyTreeNode {
  nodeKey: string;
  kind: JagHierarchyLayerKind;
  title: string;
  status: JagHierarchyNodeStatus;
  children: JagHierarchyTreeNode[];
}

export interface JagGovernanceChain {
  standard?: JagHierarchyNodeDefinition;
  protocol?: JagHierarchyNodeDefinition;
  process?: JagHierarchyNodeDefinition;
  procedure?: JagHierarchyNodeDefinition;
}

export interface JagWorkflowContext {
  capabilityKey: string;
  capabilityTitle: string;
  foundation: {
    vision?: JagHierarchyNodeDefinition;
    mission?: JagHierarchyNodeDefinition;
    coreValues: JagHierarchyNodeDefinition[];
    jagWay?: JagHierarchyNodeDefinition;
  };
  governance: JagGovernanceChain;
  ruleSetKeys: string[];
  parameterKeys: string[];
  evidenceTypeKeys: string[];
  knowledgeAssetKeys: string[];
  intelligenceServiceKeys: string[];
  workflowKey?: string;
  automationKey?: string;
  decisionTypeKey?: string;
  eventType?: string;
  resolvedNodes: JagHierarchyNodeDefinition[];
}

export const HIERARCHY_PIPELINE_STEP_IDS = [
  "read-hierarchy",
  "load-standard",
  "load-protocol",
  "load-process",
  "load-procedure",
  "evaluate-rules",
  "read-parameters",
  "execute",
  "collect-evidence",
  "update-knowledge",
  "recommend-improvements",
  "done",
] as const;

export type HierarchyPipelineStepId = (typeof HIERARCHY_PIPELINE_STEP_IDS)[number];

export type HierarchyPipelineStepStatus = "pending" | "active" | "complete" | "skipped" | "error";

export interface HierarchyPipelineStepResult {
  stepId: HierarchyPipelineStepId;
  status: HierarchyPipelineStepStatus;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface ExecuteHierarchyCapabilityInput {
  capabilityKey: string;
  facts?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  actorUserId?: string;
  organizationId?: string;
  schoolId?: string;
  entityType?: string;
  entityId?: string;
}

export interface HierarchyExecutionResult {
  capabilityKey: string;
  workflowContext: JagWorkflowContext;
  steps: HierarchyPipelineStepResult[];
  ruleEvaluationIds?: string[];
  ok: boolean;
  errors: string[];
}

export interface JagHierarchyRegistrySnapshot {
  nodes: JagHierarchyNodeDefinition[];
  capabilityBindings: JagCapabilityBinding[];
  layerKinds: JagHierarchyLayerKind[];
  registeredAt: string;
}

export interface HierarchyValidationIssue {
  code: string;
  message: string;
}

export interface HierarchyValidationResult {
  ok: boolean;
  issues: HierarchyValidationIssue[];
}
