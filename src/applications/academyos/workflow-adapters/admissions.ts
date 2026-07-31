import { AcademyWorkflowRuntime } from "@/applications/academyos/workflow-adapters/workflow-runtime";
import type { WorkflowAdapterResult } from "@/applications/academyos/workflow-adapters/types";

export const AdmissionsWorkflowAdapter = {
  startInquiry(input: {
    inquiryId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.admissions",
      entityType: "Inquiry",
      entityId: input.inquiryId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Admissions inquiry opened",
      facts: { stage: "inquiry" },
    });
  },

  startApplication(input: {
    applicationId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.admissions",
      entityType: "Application",
      entityId: input.applicationId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Admissions application opened",
      facts: { stage: "application" },
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
