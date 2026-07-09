import type { ExecutableWorkspaceState } from "@/lib/platform/execution-engine/types";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { JagProfile } from "@/lib/platform/jag-profile";
import type { JagWorkPerspectiveDef } from "@/lib/platform/jag-work/perspectives";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { WorkTask } from "@/lib/work/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type JagWorkPriority = "critical" | "high" | "medium" | "low";

export type JagWorkStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "awaiting_review"
  | "ready"
  | "completed";

/** Workspace-specific perspective id — see WORKSPACE_WORK_PERSPECTIVES. */
export type JagWorkPerspective = string;

/** @deprecated Use TEACHER_WORK_PERSPECTIVES from perspectives.ts */
export const JAG_WORK_PERSPECTIVES: JagWorkPerspectiveDef[] = [
  { id: "today", label: "Today's Work" },
  { id: "highest_priorities", label: "My Highest Priorities" },
  { id: "awaiting_review", label: "Awaiting My Review" },
  { id: "needs_human_decision", label: "Needs Human Decision" },
  { id: "ready_to_teach", label: "Ready To Teach" },
  { id: "ready_for_family_communication", label: "Ready For Family Communication" },
  { id: "ready_for_completion", label: "Ready For Completion" },
];

export interface JagWorkItem {
  id: string;
  title: string;
  description?: string;
  workType: string;
  perspectives: string[];
  priority: JagWorkPriority;
  ownerUserId?: string | null;
  ownerLabel?: string;
  dueDate?: string | null;
  status: JagWorkStatus;
  requiredCapabilityKey?: string;
  requiredKnowledgeKeys: string[];
  requiredEvidenceTypes: string[];
  recommendedNextAction: string;
  blockingDependencies: string[];
  completionCriteria: string[];
  href: string;
  entityType?: string;
  entityId?: string;
  studentId?: string;
  studentName?: string;
  source:
    | "platform_work"
    | "instruction"
    | "compliance"
    | "execution_engine"
    | "jag_profile"
    | "intervention"
    | "admissions"
    | "students"
    | "finance"
    | "hr"
    | "executive"
    | "scheduling";
}

export interface JagWorkQueue {
  workspaceKey: string;
  resolvedAt: string;
  activePerspective: string;
  perspectiveCatalog: JagWorkPerspectiveDef[];
  perspectives: Record<string, JagWorkItem[]>;
  allItems: JagWorkItem[];
  counts: Record<string, number>;
}

export interface TeacherSessionWorkInput {
  id: string;
  timeDisplay: string;
  lessonStatus: string;
  course?: { name?: string } | null;
  section?: { section_code?: string } | null;
  students: { id?: string; first_name?: string; last_name?: string }[];
  alerts: { studentId: string; type: string; message: string }[];
}

export interface TeacherComplianceWorkInput {
  type: string;
  severity: string;
  title: string;
  href?: string;
  dueDate?: string;
}

export interface TeacherInterventionWorkInput {
  id: string;
  student_id?: string;
  intervention_type?: string;
  review_date?: string | null;
  goal_description?: string | null;
  students?: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[] | null;
}

export interface ResolveTeacherJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  employeeId: string;
  activePerspective?: JagWorkPerspective;
  sessions: TeacherSessionWorkInput[];
  compliance: TeacherComplianceWorkInput[];
  interventions: TeacherInterventionWorkInput[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
  jagProfilesByStudent?: Map<string, JagProfile>;
  platformWorkTasks?: WorkTask[];
}

export interface AdmissionsLeadWorkInput {
  id: string;
  first_name: string;
  last_name: string;
  lead_stage: string;
  program: string | null;
  inquiry_date: string;
  schools?: { name: string } | null;
}

export interface AdmissionsTaskWorkInput {
  id: string;
  lead_id: string;
  task_name: string;
  due_date: string | null;
  task_status: string;
}

export interface AdmissionsTourWorkInput {
  id: string;
  lead_id: string;
  scheduled_at: string;
  tour_status: string;
}

export interface ResolveAdmissionsJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  leads: AdmissionsLeadWorkInput[];
  tasks: AdmissionsTaskWorkInput[];
  tours: AdmissionsTourWorkInput[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}

export interface StudentWorkInput {
  id: string;
  first_name: string;
  last_name: string;
  enrollment_status: string;
  status: string;
  grade_level: string | null;
  program: string | null;
  date_of_birth: string | null;
  student_number: string | null;
  family_id?: string | null;
  lifecycle_stage?: string | null;
}

export interface ResolveStudentsJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  students: StudentWorkInput[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}

export interface SchedulingConflictWorkInput {
  id: string;
  conflict_type: string;
  severity: string;
  title: string;
  description: string | null;
  recommendation: string | null;
  is_resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface SchedulingPlacementGapInput {
  studentId: string;
  studentName: string;
  reason: string;
}

export interface ResolveSchedulingJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  conflicts: SchedulingConflictWorkInput[];
  placementGaps: SchedulingPlacementGapInput[];
  recommendations: { priority: string; category: string; title: string; detail: string; action?: string }[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}

export interface InvoiceWorkInput {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  invoice_status: string;
  students?: { first_name: string; last_name: string } | null;
  family_billing_accounts?: { families?: { family_name: string } | null } | null;
}

export interface BillingAccountWorkInput {
  id: string;
  balance: number;
  collections_status?: string;
  families?: { family_name: string } | null;
}

export interface ResolveFinanceJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  invoices: InvoiceWorkInput[];
  billingAccounts: BillingAccountWorkInput[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}

export interface HrApplicationWorkInput {
  id: string;
  job_posting_id: string;
  status: string;
  created_at: string;
}

export interface HrCertificationWorkInput {
  id: string;
  expiration_date: string | null;
  employees?: { employee_profiles?: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[] | null } | null;
}

export interface HrOnboardingWorkInput {
  id: string;
  task_name: string;
  status: string;
  due_date: string | null;
}

export interface ResolveHrJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  applications: HrApplicationWorkInput[];
  expiringCertifications: HrCertificationWorkInput[];
  pendingOnboarding: HrOnboardingWorkInput[];
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}

export interface ExecutiveInsightWorkInput {
  id: string;
  title: string;
  severity: string;
  category: string;
  recommended_action?: string | null;
}

export interface ResolveExecutiveJagWorkInput {
  supabase: AuthClient;
  identity: IdentityContext;
  activePerspective?: JagWorkPerspective;
  insights: ExecutiveInsightWorkInput[];
  complianceAlerts: number;
  missionControlCritical: number;
  engineRecommendations: { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" }[];
  executionState: ExecutableWorkspaceState | null;
}
