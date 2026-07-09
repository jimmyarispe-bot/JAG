import { WORKSPACE_DEFINITIONS } from "@/lib/platform/execution-engine/catalog/workspace-definitions";
import {
  markExecutionEngineRegistered,
  registerWorkspaceDefinitions,
} from "@/lib/platform/execution-engine/registry/registry";

import "@/lib/platform/operational-loop/register";

registerWorkspaceDefinitions(WORKSPACE_DEFINITIONS);
markExecutionEngineRegistered();
