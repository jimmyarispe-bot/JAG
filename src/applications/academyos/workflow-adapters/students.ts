import { AcademyWorkflowRuntime } from "@/applications/academyos/workflow-adapters/workflow-runtime";
import type { WorkflowAdapterResult } from "@/applications/academyos/workflow-adapters/types";

export const StudentWorkflowAdapter = {
  startLifecycle(input: {
    studentId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.student-lifecycle",
      entityType: "Student",
      entityId: input.studentId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Student lifecycle started",
    });
  },

  startEnrollment(input: {
    enrollmentId: string;
    actorUserId?: string | null;
    organizationId?: string | null;
    grantedPermissions?: ReadonlySet<string> | readonly string[];
  }): WorkflowAdapterResult {
    return AcademyWorkflowRuntime.start({
      definitionId: "academyos.enrollment",
      entityType: "Enrollment",
      entityId: input.enrollmentId,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      grantedPermissions: input.grantedPermissions,
      reason: "Enrollment workflow started",
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
