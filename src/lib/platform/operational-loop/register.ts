import { registerEventDefinitions } from "@/lib/platform/events/registry/registry";
import { registerWorkflowDefinitions } from "@/lib/platform/workflow/registry/registry";
import {
  OPERATIONAL_LOOP_EVENT_DEFINITIONS,
  OPERATIONAL_LOOP_WORKFLOW_DEFINITION,
} from "@/lib/platform/operational-loop/catalog";

registerEventDefinitions(OPERATIONAL_LOOP_EVENT_DEFINITIONS);
registerWorkflowDefinitions([OPERATIONAL_LOOP_WORKFLOW_DEFINITION]);
