import { getCapabilityBinding } from "@/lib/platform/hierarchy/registry/registry";
import {
  getAllWorkspaceDefinitions,
  getDuplicateWorkspaceRegistrations,
} from "@/lib/platform/execution-engine/registry/registry";

export interface ExecutionEngineValidationIssue {
  code: string;
  message: string;
}

export interface ExecutionEngineValidationResult {
  ok: boolean;
  issues: ExecutionEngineValidationIssue[];
}

export function validateExecutionEngineRegistry(): ExecutionEngineValidationResult {
  const issues: ExecutionEngineValidationIssue[] = [];

  for (const key of getDuplicateWorkspaceRegistrations()) {
    issues.push({ code: "duplicate_workspace", message: `Duplicate workspace key "${key}"` });
  }

  for (const workspace of getAllWorkspaceDefinitions()) {
    for (const capabilityKey of workspace.capabilityKeys) {
      if (!getCapabilityBinding(capabilityKey)) {
        issues.push({
          code: "unknown_capability",
          message: `Workspace "${workspace.workspaceKey}" references unknown capability "${capabilityKey}"`,
        });
      }
    }

    for (const nav of workspace.navigation) {
      if (nav.capabilityKey && !getCapabilityBinding(nav.capabilityKey)) {
        issues.push({
          code: "nav_unknown_capability",
          message: `Workspace "${workspace.workspaceKey}" nav "${nav.id}" references unknown capability "${nav.capabilityKey}"`,
        });
      }
    }
  }

  const teacher = getAllWorkspaceDefinitions().find((w) => w.workspaceKey === "teacher");
  if (!teacher || teacher.status !== "published") {
    issues.push({
      code: "missing_teacher_workspace",
      message: "Teacher Workspace must be published as the reference implementation",
    });
  }

  return { ok: issues.length === 0, issues };
}
