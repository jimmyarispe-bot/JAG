import { registerWorkflowDefinition } from "@/lib/platform/workflow/registry/registry";
import { buildAdmissionsCaseWorkflowDefinition } from "@/lib/admissions/workflow/platform-definition";

registerWorkflowDefinition(buildAdmissionsCaseWorkflowDefinition());
