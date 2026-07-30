/**
 * ProjectService ? projects + initiative linkage + progress roll-up.
 */

import { randomUUID } from "node:crypto";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { logWorkActivity, recordStatusHistory } from "@/lib/work/activity";
import { createWorkProgress } from "@/lib/work/progress";
import {
  getProject,
  listInitiativesForOrganization,
  listProjectsForOrganization,
  upsertInitiative,
  upsertProject,
} from "@/lib/work/store";
import { createExecutionTimeline } from "@/lib/work/timeline";
import { createWorkTwinService } from "@/lib/work/twin";
import type {
  JagInitiative,
  JagProject,
  WorkHealthIndicator,
  WorkPriority,
  WorkProject,
  WorkProjectStatus,
  WorkStatus,
} from "@/lib/work/types";

export type ProjectService = {
  create(input: {
    organizationId: string;
    title: string;
    description: string;
    status?: WorkStatus;
    priority?: WorkPriority;
    owner?: string | null;
    department?: string | null;
    businessUnit?: string | null;
    initiativeId?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
    relatedRiskId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    createdBy: string;
  }): JagProject | { error: string };
  get(organizationId: string, projectId: string): JagProject | null;
  list(organizationId: string): readonly JagProject[];
  update(input: {
    organizationId: string;
    projectId: string;
    actor: string;
    title?: string;
    description?: string;
    status?: WorkStatus;
    priority?: WorkPriority;
    owner?: string | null;
    department?: string | null;
    businessUnit?: string | null;
    dueDate?: string | null;
  }): JagProject | null;
  refreshProgress(organizationId: string, projectId: string): JagProject | null;
  createInitiative(input: {
    organizationId: string;
    title: string;
    description: string;
    owner?: string | null;
    relatedGoalId?: string | null;
    createdBy: string;
  }): JagInitiative | { error: string };
  listInitiatives(organizationId: string): readonly JagInitiative[];
};

export function createProjectService(): ProjectService {
  const progress = createWorkProgress();
  const timeline = createExecutionTimeline();
  const twin = createWorkTwinService();

  return {
    create(input) {
      if (!input.title.trim()) return { error: "Project title is required." };
      const now = new Date().toISOString();
      let project: JagProject = {
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status ?? "Planned",
        priority: input.priority ?? "P2",
        owner: input.owner ?? null,
        department: input.department ?? null,
        businessUnit: input.businessUnit ?? null,
        initiativeId: input.initiativeId ?? null,
        relatedGoalId: input.relatedGoalId ?? null,
        relatedDecisionId: input.relatedDecisionId ?? null,
        relatedRiskId: input.relatedRiskId ?? null,
        startDate: input.startDate ?? null,
        dueDate: input.dueDate ?? null,
        progressPercent: 0,
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        createdBy: input.createdBy,
      };
      upsertProject(project);
      const twinId = twin.ensureProjectTwin(project, input.createdBy);
      project = { ...project, twinEntityId: twinId };
      upsertProject(project);
      timeline.record({
        organizationId: input.organizationId,
        entityType: "project",
        entityId: project.id,
        kind: "created",
        actor: input.createdBy,
        message: "Project created.",
      });
      return project;
    },

    get: getProject,
    list: listProjectsForOrganization,

    update(input) {
      const current = getProject(input.organizationId, input.projectId);
      if (!current) return null;
      const now = new Date().toISOString();
      let next: JagProject = {
        ...current,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        status: input.status ?? current.status,
        priority: input.priority ?? current.priority,
        owner: input.owner !== undefined ? input.owner : current.owner,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        businessUnit:
          input.businessUnit !== undefined
            ? input.businessUnit
            : current.businessUnit,
        dueDate: input.dueDate !== undefined ? input.dueDate : current.dueDate,
        updatedAt: now,
        completedAt:
          input.status === undefined
            ? current.completedAt
            : input.status === "Completed"
              ? now
              : null,
      };
      next = {
        ...next,
        progressPercent: progress.projectProgress(
          input.organizationId,
          next
        ),
      };
      upsertProject(next);
      twin.ensureProjectTwin(next, input.actor);
      if (input.status && input.status !== current.status) {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "project",
          entityId: next.id,
          kind: "status_changed",
          actor: input.actor,
          message: `${current.status} ? ${input.status}.`,
        });
      }
      return next;
    },

    refreshProgress(organizationId, projectId) {
      const current = getProject(organizationId, projectId);
      if (!current) return null;
      const next = {
        ...current,
        progressPercent: progress.projectProgress(organizationId, current),
        updatedAt: new Date().toISOString(),
      };
      return upsertProject(next);
    },

    createInitiative(input) {
      if (!input.title.trim()) return { error: "Initiative title is required." };
      const now = new Date().toISOString();
      return upsertInitiative({
        id: randomUUID(),
        organizationId: input.organizationId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: "Planned",
        owner: input.owner ?? null,
        relatedGoalId: input.relatedGoalId ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
    },

    listInitiatives: listInitiativesForOrganization,
  };
}


/* ---- Legacy Supabase project CRUD (coexistence) ---- */


type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const today = () => new Date().toISOString().split("T")[0];

export async function createProject(
  supabase: AuthClient,
  input: {
    schoolId?: string | null;
    campusId?: string | null;
    department?: string | null;
    program?: string | null;
    name: string;
    description?: string | null;
    projectType?: string;
    priority?: string;
    ownerUserId?: string | null;
    startDate?: string | null;
    targetDate?: string | null;
    budgetAmount?: number | null;
    playbookId?: string | null;
    playbookRunId?: string | null;
    studentId?: string | null;
    employeeId?: string | null;
    familyId?: string | null;
    sourceModule?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
    createdBy?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("work_projects")
    .insert({
      school_id: input.schoolId ?? null,
      campus_id: input.campusId ?? null,
      department: input.department ?? null,
      program: input.program ?? null,
      name: input.name,
      description: input.description ?? null,
      project_type: input.projectType ?? "custom",
      priority: input.priority ?? "normal",
      owner_user_id: input.ownerUserId ?? input.createdBy ?? null,
      start_date: input.startDate ?? today(),
      target_date: input.targetDate ?? null,
      budget_amount: input.budgetAmount ?? null,
      playbook_id: input.playbookId ?? null,
      playbook_run_id: input.playbookRunId ?? null,
      student_id: input.studentId ?? null,
      employee_id: input.employeeId ?? null,
      family_id: input.familyId ?? null,
      source_module: input.sourceModule ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      created_by: input.createdBy ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logWorkActivity(supabase, {
    projectId: data.id,
    actorUserId: input.createdBy,
    actionType: "project_created",
    summary: `Project created: ${input.name}`,
  });

  return { id: data.id };
}

export async function updateProjectHealth(supabase: AuthClient, projectId: string) {
  const { data: tasks } = await supabase
    .from("work_tasks")
    .select("status, due_date")
    .eq("project_id", projectId)
    .not("status", "in", '("cancelled","completed")');

  const { data: project } = await supabase
    .from("work_projects")
    .select("target_date, status, budget_amount, budget_spent")
    .eq("id", projectId)
    .single();

  if (!project) return;

  const taskList = tasks ?? [];
  const total = taskList.length;
  const completed = taskList.filter((t) => t.status === "completed").length;
  const overdue = taskList.filter(
    (t) => t.due_date && t.due_date < today() && t.status !== "completed"
  ).length;
  const blocked = taskList.filter((t) => t.status === "blocked").length;

  const completionPct = total ? Math.round((completed / total) * 100) : 0;

  let health: WorkHealthIndicator = "green";
  if (blocked > 0 || overdue > 2) health = "red";
  else if (overdue > 0 || (project.target_date && project.target_date < today() && project.status !== "completed")) {
    health = "yellow";
  }

  await supabase
    .from("work_projects")
    .update({
      completion_pct: completionPct,
      health_indicator: health,
      status: completionPct === 100 && total > 0 ? "completed" : project.status,
      completed_date: completionPct === 100 && total > 0 ? today() : null,
    })
    .eq("id", projectId);
}

export async function updateProjectStatus(
  supabase: AuthClient,
  projectId: string,
  status: WorkProjectStatus,
  actorUserId?: string | null
) {
  const { data: project } = await supabase
    .from("work_projects")
    .select("status")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Not found" };

  await supabase.from("work_projects").update({ status }).eq("id", projectId);
  await recordStatusHistory(supabase, {
    entityType: "project",
    entityId: projectId,
    fromStatus: project.status,
    toStatus: status,
    changedBy: actorUserId,
  });

  await logWorkActivity(supabase, {
    projectId,
    actorUserId,
    actionType: "status_changed",
    summary: `Project status: ${project.status} G?? ${status}`,
    beforeState: { status: project.status },
    afterState: { status },
  });

  return { success: true };
}

export async function getProjects(
  supabase: AuthClient,
  filters?: { schoolId?: string; status?: string; projectType?: string; ownerUserId?: string; limit?: number }
) {
  let query = supabase
    .from("work_projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.projectType) query = query.eq("project_type", filters.projectType);
  if (filters?.ownerUserId) query = query.eq("owner_user_id", filters.ownerUserId);

  const { data } = await query;
  return (data ?? []) as WorkProject[];
}
