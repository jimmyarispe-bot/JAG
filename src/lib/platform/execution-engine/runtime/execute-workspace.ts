import { buildHierarchyTree, resolveWorkflowContext } from "@/lib/platform/hierarchy/query/lookup";
import { getCapabilityBinding } from "@/lib/platform/hierarchy/registry/registry";
import type { JagCapabilityBinding } from "@/lib/platform/hierarchy/types";
import {
  attachCapabilityOwnership,
  resolveJagOrganizationContext,
} from "@/lib/platform/jag-organization";
import { getWorkspaceDefinition } from "@/lib/platform/execution-engine/registry/registry";
import type { WorkspaceDefinition } from "@/lib/platform/execution-engine/types";
import {
  resolveKnowledgeNodes,
  resolveRuntimeRecommendations,
  uniqueNodesByKind,
} from "@/lib/platform/execution-engine/pipeline/resolve";
import type {
  ExecutableWorkspaceState,
  ExecutionPipelineStepTrace,
  ResolvedCapability,
  WorkspaceExecutionRequest,
  WorkspaceExecutionResult,
  WorkspaceNavItemDefinition,
} from "@/lib/platform/execution-engine/types";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

function trace(
  stepId: ExecutionPipelineStepTrace["stepId"],
  status: ExecutionPipelineStepTrace["status"],
  detail?: string
): ExecutionPipelineStepTrace {
  return { stepId, status, detail };
}

function hasPermission(identity: IdentityContext, permission: string): boolean {
  return identity.isEnterpriseAdmin || identity.permissions.includes(permission);
}

function hasAnyPermission(identity: IdentityContext, permissions: string[]): boolean {
  if (identity.isEnterpriseAdmin) return true;
  return permissions.some((p) => identity.permissions.includes(p));
}

function isCapabilityGranted(
  identity: IdentityContext,
  workspace: WorkspaceDefinition,
  binding: JagCapabilityBinding
): { granted: boolean; denyReason?: string } {
  if (identity.isEnterpriseAdmin) return { granted: true };
  if (workspace.managePermission && hasPermission(identity, workspace.managePermission)) {
    return { granted: true };
  }
  if (binding.requiredPermissions?.length) {
    if (hasAnyPermission(identity, binding.requiredPermissions)) return { granted: true };
    return { granted: false, denyReason: `Requires one of: ${binding.requiredPermissions.join(", ")}` };
  }
  if (workspace.accessPermissions?.length) {
    if (hasAnyPermission(identity, workspace.accessPermissions)) return { granted: true };
    return { granted: false, denyReason: `Requires workspace access permission` };
  }
  return { granted: true };
}

function filterNavigation(
  navigation: WorkspaceNavItemDefinition[],
  identity: IdentityContext,
  grantedCapabilityKeys: Set<string>,
  managePermission?: string
): WorkspaceNavItemDefinition[] {
  const canManage = managePermission ? hasPermission(identity, managePermission) : false;

  return navigation.filter((item) => {
    if (item.permission && !identity.isEnterpriseAdmin && !canManage && !hasPermission(identity, item.permission)) {
      return false;
    }
    if (item.capabilityKey && !grantedCapabilityKeys.has(item.capabilityKey)) {
      return false;
    }
    return true;
  });
}

function resolveCapabilities(
  identity: IdentityContext,
  workspace: WorkspaceDefinition
): ResolvedCapability[] {
  const resolved: ResolvedCapability[] = [];

  for (const capabilityKey of workspace.capabilityKeys) {
    const binding = getCapabilityBinding(capabilityKey);
    const workflowContext = resolveWorkflowContext(capabilityKey);
    if (!binding || !workflowContext) continue;

    const access = isCapabilityGranted(identity, workspace, binding);
    resolved.push({
      capabilityKey,
      binding,
      workflowContext,
      granted: access.granted,
      denyReason: access.denyReason,
    });
  }

  return resolved;
}

/**
 * Execute the workspace pipeline — generic runtime for all workspaces.
 * Teacher Workspace is the reference consumer; no domain logic lives here.
 */
export async function executeWorkspace(
  request: WorkspaceExecutionRequest
): Promise<WorkspaceExecutionResult> {
  const pipeline: ExecutionPipelineStepTrace[] = [];
  const errors: string[] = [];
  const { identity, workspaceKey, activeView, recommendationFacts } = request;

  pipeline.push(trace("resolve-user", "complete", identity.fullName));

  let supabase: Awaited<ReturnType<typeof createAuthClient>> | null = null;
  try {
    supabase = await createAuthClient();
  } catch {
    supabase = null;
  }

  let org = await resolveJagOrganizationContext(identity, {
    supabase,
    employeeUserId: identity.effectiveUserId,
  });
  pipeline.push(
    trace(
      "resolve-org-context",
      org.schoolId ? "complete" : "skipped",
      org.activeScope.schoolName ?? org.schoolId ?? "No school context"
    )
  );

  const workspace = getWorkspaceDefinition(workspaceKey);
  if (!workspace) {
    errors.push(`Unknown workspace "${workspaceKey}"`);
    pipeline.push(trace("return-workspace-state", "error", "Unknown workspace"));
    return { ok: false, state: null, errors };
  }

  if (workspace.status !== "published") {
    errors.push(`Workspace "${workspaceKey}" is not published`);
  }

  const tree = buildHierarchyTree();
  const sampleContext = workspace.capabilityKeys[0]
    ? resolveWorkflowContext(workspace.capabilityKeys[0])
    : null;
  const hierarchyFoundation = sampleContext?.foundation ?? {
    vision: undefined,
    mission: undefined,
    coreValues: [],
    jagWay: undefined,
  };

  pipeline.push(
    trace("resolve-hierarchy", tree ? "complete" : "skipped", tree?.title ?? "Hierarchy tree")
  );

  const capabilities = resolveCapabilities(identity, workspace);
  pipeline.push(trace("resolve-capabilities", "complete", `${capabilities.length} capability binding(s)`));

  const grantedCapabilities = capabilities.filter((c) => c.granted);
  org = attachCapabilityOwnership(org, grantedCapabilities);
  const grantedKeys = new Set(grantedCapabilities.map((c) => c.capabilityKey));
  pipeline.push(
    trace(
      "resolve-permissions",
      "complete",
      `${grantedCapabilities.length}/${capabilities.length} granted · ${identity.permissions.length} permission(s)`
    )
  );

  const protocols = uniqueNodesByKind(grantedCapabilities, "protocol");
  const processes = uniqueNodesByKind(grantedCapabilities, "process");
  const procedures = uniqueNodesByKind(grantedCapabilities, "procedure");

  pipeline.push(trace("resolve-protocols", "complete", `${protocols.length} protocol(s)`));
  pipeline.push(trace("resolve-processes", "complete", `${processes.length} process(es)`));
  pipeline.push(trace("resolve-procedures", "complete", `${procedures.length} procedure(s)`));

  const knowledge = resolveKnowledgeNodes(grantedCapabilities);
  pipeline.push(trace("resolve-knowledge", "complete", `${knowledge.length} knowledge asset(s)`));

  const recommendations = await resolveRuntimeRecommendations({
    grantedCapabilities,
    org,
    effectiveUserId: identity.effectiveUserId,
    facts: recommendationFacts,
  });
  pipeline.push(trace("resolve-recommendations", "complete", `${recommendations.length} recommendation(s)`));

  const navigation = filterNavigation(
    workspace.navigation,
    identity,
    grantedKeys,
    workspace.managePermission
  );

  const validViews = new Set(navigation.map((n) => n.id));
  const resolvedView =
    activeView && validViews.has(activeView) ? activeView : navigation[0]?.id;

  const workspaceAccess =
    !workspace.accessPermissions?.length ||
    hasAnyPermission(identity, workspace.accessPermissions);

  const executable =
    workspace.status === "published" && workspaceAccess && grantedCapabilities.length > 0;

  const blockReason = !workspaceAccess
    ? "Missing workspace access permission"
    : workspace.status !== "published"
      ? "Workspace not published"
      : grantedCapabilities.length === 0
        ? "No capabilities granted"
        : undefined;

  pipeline.push(trace("return-workspace-state", executable ? "complete" : "skipped", blockReason));

  const state: ExecutableWorkspaceState = {
    workspaceKey: workspace.workspaceKey,
    workspaceTitle: workspace.title,
    user: {
      userId: identity.id,
      effectiveUserId: identity.effectiveUserId,
      fullName: identity.fullName,
      roleLabel: identity.roleLabel,
      email: identity.email,
      isEnterpriseAdmin: identity.isEnterpriseAdmin,
    },
    org,
    hierarchy: {
      tree,
      foundation: hierarchyFoundation,
    },
    capabilities,
    grantedCapabilities,
    permissions: identity.permissions,
    protocols,
    processes,
    procedures,
    knowledge,
    recommendations,
    navigation,
    activeView: resolvedView,
    pipeline,
    executable,
    blockReason,
  };

  return { ok: executable && errors.length === 0, state, errors };
}
