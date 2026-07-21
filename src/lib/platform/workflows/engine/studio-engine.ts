/**
 * RC-7 Workflow Automation Studio engine facade.
 */

import { executeStudioWorkflow, type ExecuteStudioWorkflowInput } from "@/lib/platform/workflows/engine/execute";
import { validateStudioWorkflow } from "@/lib/platform/workflows/engine/validate";
import { getExampleWorkflow, listExampleWorkflows } from "@/lib/platform/workflows/examples/catalog";
import { getStudioNodeCatalog } from "@/lib/platform/workflows/catalog/node-catalog";
import type {
  ExampleWorkflowKey,
  StudioRunResult,
  StudioWorkflowDefinition,
} from "@/lib/platform/workflows/types";
import { WORKFLOW_STUDIO_VERSION } from "@/lib/platform/workflows/types";

export class WorkflowStudioEngine {
  readonly version = WORKFLOW_STUDIO_VERSION;

  listNodeCatalog() {
    return getStudioNodeCatalog();
  }

  listExamples() {
    return listExampleWorkflows();
  }

  getExample(key: ExampleWorkflowKey) {
    return getExampleWorkflow(key);
  }

  validate(workflow: StudioWorkflowDefinition) {
    return validateStudioWorkflow(workflow);
  }

  /** Preview / CI default — dryRun true. */
  run(input: ExecuteStudioWorkflowInput): StudioRunResult {
    return executeStudioWorkflow(input);
  }

  runExample(
    key: ExampleWorkflowKey,
    organizationId: string,
    options: Omit<ExecuteStudioWorkflowInput, "workflow" | "organizationId"> = {}
  ): StudioRunResult {
    return executeStudioWorkflow({
      ...options,
      workflow: getExampleWorkflow(key),
      organizationId,
    });
  }
}

export function createWorkflowStudioEngine(): WorkflowStudioEngine {
  return new WorkflowStudioEngine();
}
