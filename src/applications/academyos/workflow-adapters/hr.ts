import { AcademyWorkflowRuntime } from "@/applications/academyos/workflow-adapters/workflow-runtime";
import type { WorkflowAdapterResult } from "@/applications/academyos/workflow-adapters/types";

export const HRWorkflowAdapter = {
  startHiring(input: {
    employeeId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.hiring",
      entityType: "Employee",
      entityId: input.employeeId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Hiring workflow started",
    });
  },

  transition(input: {
    instanceId: string;
    transitionKey: string;
    actorUserId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
    reason?: string | null;
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.transition(input);
  },
};
