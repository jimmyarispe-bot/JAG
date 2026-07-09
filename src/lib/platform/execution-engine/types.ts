import type { JagOrganizationContext } from "@/lib/platform/jag-organization";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type {
  JagCapabilityBinding,
  JagHierarchyNodeDefinition,
  JagHierarchyTreeNode,
  JagWorkflowContext,
} from "@/lib/platform/hierarchy/types";

export const EXECUTION_PIPELINE_STEPS = [
  "resolve-user",
  "resolve-org-context",
  "resolve-hierarchy",
  "resolve-capabilities",
  "resolve-permissions",
  "resolve-protocols",
  "resolve-processes",
  "resolve-procedures",
  "resolve-knowledge",
  "resolve-recommendations",
  "return-workspace-state",
] as const;

export type ExecutionPipelineStepId = (typeof EXECUTION_PIPELINE_STEPS)[number];

export type ExecutionStepStatus = "complete" | "skipped" | "error";

export interface ExecutionPipelineStepTrace {
  stepId: ExecutionPipelineStepId;
  status: ExecutionStepStatus;
  detail?: string;
}

export interface WorkspaceNavItemDefinition {
  id: string;
  label: string;
  href: string;
  permission?: string | null;
  capabilityKey?: string;
}

export interface WorkspaceDefinition {
  workspaceKey: string;
  title: string;
  description: string;
  basePath: string;
  status: "published" | "draft";
  /** Hierarchy capability keys bound to this workspace. */
  capabilityKeys: string[];
  navigation: WorkspaceNavItemDefinition[];
  /** Permissions required to enter this workspace (any match). */
  accessPermissions?: string[];
  /** Permission granting full workspace management (bypasses item-level gates). */
  managePermission?: string;
  sortOrder: number;
}

/** Enterprise org context — delegated to JAG Organization™ (single source). */
export type OrganizationalContext = JagOrganizationContext;

export interface ResolvedCapability {
  capabilityKey: string;
  binding: JagCapabilityBinding;
  workflowContext: JagWorkflowContext;
  granted: boolean;
  denyReason?: string;
}

export interface RuntimeRecommendation {
  id: string;
  capabilityKey: string;
  title: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  source: string;
  decisionTypeKey?: string;
  ruleSetKey?: string;
}

export interface ExecutableWorkspaceState {
  workspaceKey: string;
  workspaceTitle: string;
  user: {
    userId: string;
    effectiveUserId: string;
    fullName: string;
    roleLabel: string;
    email: string;
    isEnterpriseAdmin: boolean;
  };
  org: OrganizationalContext;
  hierarchy: {
    tree: JagHierarchyTreeNode | null;
    foundation: JagWorkflowContext["foundation"];
  };
  capabilities: ResolvedCapability[];
  grantedCapabilities: ResolvedCapability[];
  permissions: string[];
  protocols: JagHierarchyNodeDefinition[];
  processes: JagHierarchyNodeDefinition[];
  procedures: JagHierarchyNodeDefinition[];
  knowledge: JagHierarchyNodeDefinition[];
  recommendations: RuntimeRecommendation[];
  navigation: WorkspaceNavItemDefinition[];
  activeView?: string;
  pipeline: ExecutionPipelineStepTrace[];
  executable: boolean;
  blockReason?: string;
}

export interface WorkspaceExecutionRequest {
  workspaceKey: string;
  identity: IdentityContext;
  activeView?: string;
  /** Optional facts for rule-based recommendation resolution. */
  recommendationFacts?: Record<string, unknown>;
}

export interface WorkspaceExecutionResult {
  ok: boolean;
  state: ExecutableWorkspaceState | null;
  errors: string[];
}
