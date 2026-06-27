import { PLATFORM_REFERENCE_WORKFLOW_DEFINITIONS } from "@/lib/platform/workflow/catalog/reference-definitions";
import {
  markWorkflowRegistryRegistered,
  registerWorkflowDefinitions,
} from "@/lib/platform/workflow/registry/registry";

registerWorkflowDefinitions(PLATFORM_REFERENCE_WORKFLOW_DEFINITIONS);
markWorkflowRegistryRegistered();
