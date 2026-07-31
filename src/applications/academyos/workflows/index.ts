import { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows/definitions";
import { WorkflowService } from "@/lib/platform/workflows/framework";
import type { WorkflowDefinition } from "@/lib/platform/workflows/framework";

export function registerAcademyWorkflows(): WorkflowDefinition[] {
  return ACADEMYOS_WORKFLOWS.map((wf) => WorkflowService.register(wf));
}

export { ACADEMYOS_WORKFLOWS } from "@/applications/academyos/workflows/definitions";
