/** The JAG Work™ — canonical work model consumed by every workspace. */
export type {
  AdmissionsLeadWorkInput,
  AdmissionsTaskWorkInput,
  AdmissionsTourWorkInput,
  BillingAccountWorkInput,
  ExecutiveInsightWorkInput,
  HrApplicationWorkInput,
  HrCertificationWorkInput,
  HrOnboardingWorkInput,
  InvoiceWorkInput,
  JagWorkItem,
  JagWorkPerspective,
  JagWorkPriority,
  JagWorkQueue,
  JagWorkStatus,
  ResolveAdmissionsJagWorkInput,
  ResolveExecutiveJagWorkInput,
  ResolveFinanceJagWorkInput,
  ResolveHrJagWorkInput,
  ResolveSchedulingJagWorkInput,
  ResolveStudentsJagWorkInput,
  ResolveTeacherJagWorkInput,
  StudentWorkInput,
  TeacherComplianceWorkInput,
  TeacherInterventionWorkInput,
  TeacherSessionWorkInput,
} from "@/lib/platform/jag-work/types";

export { JAG_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/types";
export {
  ADMISSIONS_WORK_PERSPECTIVES,
  EXECUTIVE_WORK_PERSPECTIVES,
  FINANCE_WORK_PERSPECTIVES,
  HR_WORK_PERSPECTIVES,
  SCHEDULING_WORK_PERSPECTIVES,
  STUDENTS_WORK_PERSPECTIVES,
  TEACHER_WORK_PERSPECTIVES,
  WORKSPACE_WORK_PERSPECTIVES,
  type EnterpriseWorkspaceKey,
  type JagWorkPerspectiveDef,
} from "@/lib/platform/jag-work/perspectives";
export { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
export { resolveJagWorkPerspective, resolveJagWorkQueue, type JagWorkQueueInput } from "@/lib/platform/jag-work/resolve";
export { resolveTeacherJagWork } from "@/lib/platform/jag-work/resolve-teacher-work";
export { resolveAdmissionsJagWork } from "@/lib/platform/jag-work/resolve-admissions-work";
export { resolveSchedulingJagWork } from "@/lib/platform/jag-work/resolve-scheduling-work";
export { resolveStudentsJagWork } from "@/lib/platform/jag-work/resolve-students-work";
export { resolveFinanceJagWork } from "@/lib/platform/jag-work/resolve-finance-work";
export { resolveHrJagWork } from "@/lib/platform/jag-work/resolve-hr-work";
export { resolveExecutiveJagWork } from "@/lib/platform/jag-work/resolve-executive-work";
