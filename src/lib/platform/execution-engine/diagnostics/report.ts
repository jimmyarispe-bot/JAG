import {
  getAllWorkspaceDefinitions,
  isExecutionEngineRegistered,
} from "@/lib/platform/execution-engine/registry/registry";
import { validateExecutionEngineRegistry } from "@/lib/platform/execution-engine/registry/validate";

export interface ExecutionEngineDiagnosticsReport {
  registered: boolean;
  workspaceCount: number;
  publishedWorkspaceCount: number;
  referenceWorkspace: string;
  validationOk: boolean;
  validationIssues: { code: string; message: string }[];
}

export function collectExecutionEngineDiagnostics(): ExecutionEngineDiagnosticsReport {
  const validation = validateExecutionEngineRegistry();
  const workspaces = getAllWorkspaceDefinitions();

  return {
    registered: isExecutionEngineRegistered(),
    workspaceCount: workspaces.length,
    publishedWorkspaceCount: workspaces.filter((w) => w.status === "published").length,
    referenceWorkspace: "teacher",
    validationOk: validation.ok,
    validationIssues: validation.issues,
  };
}
