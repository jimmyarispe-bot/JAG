/**
 * Work module — legacy dashboard/Supabase API + Work & Execution™ coexistence.
 * Sprint 209: restore exports without redesign.
 */

// Legacy dashboard / Supabase surface
export * from "@/lib/work/types";
export * from "@/lib/work/queries";
export {
  canViewWork,
  canManageWork,
  canAdminWork,
  canViewWorkReports,
} from "@/lib/work/access";
export {
  createProjectAction,
  createTaskAction,
  completeTaskAction,
  updateTaskStatusAction,
  executePlaybookAction,
  logTimeEntryAction,
  updateProjectStatusAction,
} from "@/lib/work/actions";
export { syncWorkToMissionControl } from "@/lib/work/automation";

// Legacy Supabase CRUD (also via projects/tasks modules)
export {
  createProject,
  updateProjectHealth,
  updateProjectStatus,
  getProjects,
} from "@/lib/work/projects";
export {
  createTask,
  completeTask,
  updateTaskStatus,
  getTasks,
} from "@/lib/work/tasks";

// Work & Execution™
export {
  createWorkService,
  getWorkService,
  resetWorkServiceForTests,
  type WorkService,
} from "@/lib/work/service";
export { createProjectService, type ProjectService } from "@/lib/work/projects";
export { createTaskService, type TaskService } from "@/lib/work/tasks";
export {
  createMilestoneService,
  type MilestoneService,
} from "@/lib/work/milestones";
export {
  createDependencyService,
  type DependencyService,
} from "@/lib/work/dependencies";
export {
  createExecutionMetrics,
  getExecutionSummary,
} from "@/lib/work/metrics";
export { createExecutionTimeline } from "@/lib/work/timeline";
export { createWorkProgress } from "@/lib/work/progress";
export { createWorkTwinService } from "@/lib/work/twin";
export {
  resetWorkStoreForTests,
  listWorkItemsForOrganization,
  listProjectsForOrganization,
  listMilestonesForOrganization,
  listDependenciesForOrganization,
  listWorkTimeline,
  getWorkItem,
  getProject,
} from "@/lib/work/store";
