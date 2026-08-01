/** Work & Execution™ — deterministic execution layer (no AI). */

export const WORK_ITEM_TYPES = [
  "Work Item",
  "Task",
  "Action",
  "Deliverable",
] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const WORK_STATUSES = [
  "Backlog",
  "Planned",
  "In Progress",
  "Blocked",
  "Review",
  "Completed",
  "Archived",
] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_PRIORITIES = ["P1", "P2", "P3"] as const;
export type WorkPriority = (typeof WORK_PRIORITIES)[number];

export const DEPENDENCY_KINDS = [
  "blocks",
  "blocked_by",
  "depends_on",
  "parent",
  "child",
] as const;
export type DependencyKind = (typeof DEPENDENCY_KINDS)[number];

export const WORK_TIMELINE_KINDS = [
  "created",
  "updated",
  "assigned",
  "status_changed",
  "dependency_added",
  "progress_changed",
  "completed",
  "archived",
] as const;
export type WorkTimelineKind = (typeof WORK_TIMELINE_KINDS)[number];

export type JagWorkItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly type: WorkItemType;
  readonly status: WorkStatus;
  readonly priority: WorkPriority;
  readonly owner: string | null;
  readonly assignee: string | null;
  readonly department: string | null;
  readonly businessUnit: string | null;
  readonly dueDate: string | null;
  readonly startDate: string | null;
  readonly estimatedEffort: number;
  readonly actualEffort: number;
  readonly relatedGoalId: string | null;
  readonly relatedDecisionId: string | null;
  readonly relatedRiskId: string | null;
  readonly relatedEvidenceIds: readonly string[];
  readonly relatedTwinEntityIds: readonly string[];
  readonly projectId: string | null;
  readonly parentWorkItemId: string | null;
  readonly progressPercent: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdBy: string;
};

export type JagProject = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly status: WorkStatus;
  readonly priority: WorkPriority;
  readonly owner: string | null;
  readonly department: string | null;
  readonly businessUnit: string | null;
  readonly initiativeId: string | null;
  readonly relatedGoalId: string | null;
  readonly relatedDecisionId: string | null;
  readonly relatedRiskId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly progressPercent: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly createdBy: string;
};

export type JagInitiative = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly status: WorkStatus;
  readonly owner: string | null;
  readonly relatedGoalId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type JagMilestone = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly title: string;
  readonly description: string;
  readonly dueDate: string | null;
  readonly status: WorkStatus;
  readonly progressPercent: number;
  readonly overdue: boolean;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly createdBy: string;
};

export type JagDependency = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromWorkItemId: string;
  readonly toWorkItemId: string;
  readonly kind: DependencyKind;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type WorkTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityType: "work_item" | "project" | "milestone";
  readonly entityId: string;
  readonly kind: WorkTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type CreateWorkItemInput = {
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly type?: WorkItemType;
  readonly status?: WorkStatus;
  readonly priority?: WorkPriority;
  readonly owner?: string | null;
  readonly assignee?: string | null;
  readonly department?: string | null;
  readonly businessUnit?: string | null;
  readonly dueDate?: string | null;
  readonly startDate?: string | null;
  readonly estimatedEffort?: number;
  readonly relatedGoalId?: string | null;
  readonly relatedDecisionId?: string | null;
  readonly relatedRiskId?: string | null;
  readonly relatedEvidenceIds?: readonly string[];
  readonly relatedTwinEntityIds?: readonly string[];
  readonly projectId?: string | null;
  readonly parentWorkItemId?: string | null;
  readonly createdBy: string;
};

export type PatchWorkItemInput = {
  readonly organizationId: string;
  readonly workItemId: string;
  readonly actor: string;
  readonly title?: string;
  readonly description?: string;
  readonly type?: WorkItemType;
  readonly status?: WorkStatus;
  readonly priority?: WorkPriority;
  readonly owner?: string | null;
  readonly assignee?: string | null;
  readonly department?: string | null;
  readonly businessUnit?: string | null;
  readonly dueDate?: string | null;
  readonly startDate?: string | null;
  readonly estimatedEffort?: number;
  readonly actualEffort?: number;
  readonly relatedGoalId?: string | null;
  readonly relatedDecisionId?: string | null;
  readonly relatedRiskId?: string | null;
  readonly relatedEvidenceIds?: readonly string[];
  readonly relatedTwinEntityIds?: readonly string[];
  readonly projectId?: string | null;
  readonly parentWorkItemId?: string | null;
};

export type ExecutionSummary = {
  readonly activeProjects: number;
  readonly activeWorkItems: number;
  readonly blockedWork: number;
  readonly overdueWork: number;
  readonly completedThisWeek: number;
  readonly averageProgress: number;
  readonly workByBusinessUnit: Readonly<Record<string, number>>;
  readonly workByDepartment: Readonly<Record<string, number>>;
};

export type ExecutionDashboard = {
  readonly activeProjects: readonly JagProject[];
  readonly activeWorkItems: readonly JagWorkItem[];
  readonly blocked: readonly JagWorkItem[];
  readonly overdue: readonly JagWorkItem[];
  readonly completedThisWeek: readonly JagWorkItem[];
  readonly summary: ExecutionSummary;
};


/* ---- Legacy dashboard / Supabase Work API (coexistence) ---- */

export type WorkProjectType =
  | "admissions" | "enrollment" | "instruction" | "student_success" | "special_education"
  | "intervention" | "therapy" | "finance" | "payroll" | "scholarships" | "state_funding"
  | "hr" | "hiring" | "onboarding" | "performance_improvement" | "facilities" | "maintenance"
  | "technology" | "compliance" | "accreditation" | "strategic_plan" | "board" | "marketing"
  | "fundraising" | "grant" | "capital_project" | "construction" | "transportation"
  | "food_service" | "emergency_response" | "custom";

export type WorkProjectStatus =
  | "draft" | "planning" | "active" | "on_hold" | "blocked" | "completed" | "cancelled" | "archived";

export type WorkTaskStatus =
  | "not_started" | "in_progress" | "waiting" | "blocked" | "needs_review"
  | "approved" | "completed" | "cancelled" | "deferred";

export type WorkHealthIndicator = "green" | "yellow" | "red";

export interface WorkProject {
  id: string;
  school_id: string | null;
  campus_id: string | null;
  department: string | null;
  program: string | null;
  name: string;
  description: string | null;
  project_type: WorkProjectType;
  status: WorkProjectStatus;
  priority: string;
  risk_level: string;
  health_indicator: WorkHealthIndicator;
  completion_pct: number;
  budget_amount: number | null;
  budget_spent: number;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  owner_user_id: string | null;
  playbook_id: string | null;
  student_id: string | null;
  employee_id: string | null;
  family_id: string | null;
  created_at: string;
}

export interface WorkTask {
  id: string;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  status: WorkTaskStatus;
  priority: string;
  risk_level: string;
  completion_pct: number;
  estimated_hours: number | null;
  actual_hours: number;
  due_date: string | null;
  owner_user_id: string | null;
  school_id: string | null;
  student_id: string | null;
  employee_id: string | null;
  tags: string[];
  work_projects?: { name: string; project_type: string } | null;
}

export interface WorkPlaybook {
  id: string;
  school_id: string | null;
  playbook_key: string;
  name: string;
  description: string | null;
  project_type: WorkProjectType;
  category: string;
  is_system: boolean;
  estimated_duration_days: number | null;
  work_playbook_steps?: { count: number }[];
}

export interface WorkloadBucket {
  today: WorkTask[];
  thisWeek: WorkTask[];
  upcoming: WorkTask[];
  overdue: WorkTask[];
  waiting: WorkTask[];
  approvals: WorkTask[];
  projects: WorkProject[];
}

export interface WorkExecutiveMetrics {
  projectsBySchool: Record<string, number>;
  projectsByDepartment: Record<string, number>;
  completionRate: number;
  delayedProjects: number;
  overdueTasks: number;
  blockedTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  upcomingMilestones: number;
  playbookRunsCompleted: number;
  healthBreakdown: Record<WorkHealthIndicator, number>;
}

export interface MyWorkSummary {
  tasksToday: number;
  tasksThisWeek: number;
  overdue: number;
  waitingApprovals: number;
  activeProjects: number;
  missionControlAlerts: number;
}

export const WORK_TABS = [
  { href: "/dashboard/work?view=my-work", label: "My Work", value: "my-work" },
  { href: "/dashboard/work?view=tasks", label: "Tasks", value: "tasks" },
  { href: "/dashboard/work?view=projects", label: "Projects", value: "projects" },
  { href: "/dashboard/work?view=approvals", label: "Approvals", value: "approvals" },
  { href: "/dashboard/work?view=meetings", label: "Meetings", value: "meetings" },
] as const;

/** AI readiness hooks - architecture only, no implementation */
export const WORK_AI_CAPABILITIES = [
  "project_summaries",
  "task_prioritization",
  "workload_balancing",
  "risk_prediction",
  "suggested_assignments",
  "playbook_optimization",
  "executive_summaries",
] as const;
