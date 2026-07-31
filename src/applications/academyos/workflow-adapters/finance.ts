import { AcademyWorkflowRuntime } from "@/applications/academyos/workflow-adapters/workflow-runtime";
import type { WorkflowAdapterResult } from "@/applications/academyos/workflow-adapters/types";

export const FinanceWorkflowAdapter = {
  startBilling(input: {
    invoiceId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.finance",
      entityType: "Invoice",
      entityId: input.invoiceId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Finance billing started",
    });
  },

  startScholarship(input: {
    scholarshipId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.scholarship",
      entityType: "Scholarship",
      entityId: input.scholarshipId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Scholarship workflow started",
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
