import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { WORKFLOW_RECIPE_STEPS } from "./config";
import { emitCommunicationsEvent } from "./events";
import {
  getWorkflow,
  listWorkflows,
  upsertWorkflow,
} from "./store";
import type {
  CommunicationDomain,
  WorkflowInstance,
  WorkflowRecipe,
  WorkflowStatus,
  WorkflowStep,
} from "./types";
import { WORKFLOW_RECIPES, WORKFLOW_STATUSES } from "./types";

function recipeDomain(recipe: WorkflowRecipe): CommunicationDomain {
  if (recipe.includes("Employee")) return "workforce";
  if (recipe.includes("Scholarship") || recipe.includes("Tuition"))
    return "finance";
  if (recipe.includes("Withdrawal") || recipe.includes("Enrollment"))
    return "sis";
  return "admissions";
}

export function createWorkflowService() {
  return {
    start(input: {
      organizationId: string;
      recipe: WorkflowRecipe;
      name?: string;
      studentId?: string | null;
      familyId?: string | null;
      employeeId?: string | null;
      campusId?: string | null;
      programId?: string | null;
      activate?: boolean;
      createdBy: string;
    }): WorkflowInstance | { error: string } {
      if (!(WORKFLOW_RECIPES as readonly string[]).includes(input.recipe)) {
        return { error: "Invalid workflow recipe." };
      }
      const stepDefs = WORKFLOW_RECIPE_STEPS[input.recipe] ?? [];
      const steps: WorkflowStep[] = stepDefs.map((s) => ({
        id: randomUUID(),
        title: s.title,
        status: "Pending",
        assigneeType: s.assigneeType,
        assigneeId: null,
        completedAt: null,
      }));
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Workflow",
        twinEntityType: "Document",
        id,
        label: input.name?.trim() || input.recipe,
        kind: "workflow",
        actor: input.createdBy,
        metadata: { recipe: input.recipe },
      });
      const workflow = upsertWorkflow({
        id,
        organizationId: input.organizationId,
        recipe: input.recipe,
        name: input.name?.trim() || input.recipe,
        status: input.activate === false ? "Draft" : "Active",
        domain: recipeDomain(input.recipe),
        studentId: input.studentId ?? null,
        familyId: input.familyId ?? null,
        employeeId: input.employeeId ?? null,
        campusId: input.campusId ?? null,
        programId: input.programId ?? null,
        steps: Object.freeze(steps),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
        completedAt: null,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Workflow",
        entityId: id,
        eventType: "workflow_started",
        actor: input.createdBy,
        metadata: { recipe: input.recipe, status: workflow.status },
      });
      return workflow;
    },

    advance(input: {
      organizationId: string;
      workflowId: string;
      stepId: string;
      actor: string;
      skip?: boolean;
    }): WorkflowInstance | { error: string } | null {
      const current = getWorkflow(input.organizationId, input.workflowId);
      if (!current) return null;
      if (
        current.status === "Completed" ||
        current.status === "Cancelled" ||
        current.status === "Draft"
      ) {
        return { error: `Cannot advance workflow in ${current.status} state.` };
      }
      const now = new Date().toISOString();
      const steps = current.steps.map((s) =>
        s.id === input.stepId
          ? {
              ...s,
              status: input.skip ? ("Skipped" as const) : ("Completed" as const),
              completedAt: now,
              assigneeId: s.assigneeId ?? input.actor,
            }
          : s
      );
      const allDone = steps.every(
        (s) => s.status === "Completed" || s.status === "Skipped"
      );
      const hasPending = steps.some((s) => s.status === "Pending");
      const status: WorkflowStatus = allDone
        ? "Completed"
        : hasPending
          ? "Active"
          : "Waiting";
      const updated = upsertWorkflow({
        ...current,
        steps: Object.freeze(steps),
        status,
        completedAt: allDone ? now : null,
        updatedAt: now,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Workflow",
        entityId: current.id,
        eventType: allDone ? "workflow_completed" : "workflow_step_advanced",
        actor: input.actor,
        metadata: { stepId: input.stepId, status },
      });
      return updated;
    },

    setStatus(input: {
      organizationId: string;
      workflowId: string;
      status: WorkflowStatus;
      actor: string;
    }): WorkflowInstance | { error: string } | null {
      const current = getWorkflow(input.organizationId, input.workflowId);
      if (!current) return null;
      if (!(WORKFLOW_STATUSES as readonly string[]).includes(input.status)) {
        return { error: "Invalid workflow status." };
      }
      const now = new Date().toISOString();
      const updated = upsertWorkflow({
        ...current,
        status: input.status,
        completedAt:
          input.status === "Completed" ? now : current.completedAt,
        updatedAt: now,
      });
      emitCommunicationsEvent({
        organizationId: input.organizationId,
        entityType: "Workflow",
        entityId: current.id,
        eventType: "workflow_status_changed",
        actor: input.actor,
        metadata: { status: input.status },
      });
      return updated;
    },

    get: getWorkflow,
    list: listWorkflows,

    search(input: {
      organizationId: string;
      q?: string;
      status?: WorkflowStatus;
      recipe?: WorkflowRecipe;
      studentId?: string;
      employeeId?: string;
      familyId?: string;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        listWorkflows(input.organizationId).filter((w) => {
          if (input.status && w.status !== input.status) return false;
          if (input.recipe && w.recipe !== input.recipe) return false;
          if (input.studentId && w.studentId !== input.studentId) return false;
          if (input.employeeId && w.employeeId !== input.employeeId)
            return false;
          if (input.familyId && w.familyId !== input.familyId) return false;
          if (!q) return true;
          return (
            w.name.toLowerCase().includes(q) ||
            w.recipe.toLowerCase().includes(q)
          );
        })
      );
    },

    tasksFor(input: {
      organizationId: string;
      assigneeType: "parent" | "employee" | "staff";
      subjectId?: string;
    }) {
      return Object.freeze(
        listWorkflows(input.organizationId)
          .filter(
            (w) =>
              w.status === "Active" ||
              w.status === "Waiting"
          )
          .flatMap((w) =>
            w.steps
              .filter(
                (s) =>
                  s.status === "Pending" &&
                  s.assigneeType === input.assigneeType
              )
              .map((s) => ({
                workflowId: w.id,
                workflowName: w.name,
                recipe: w.recipe,
                step: s,
                studentId: w.studentId,
                employeeId: w.employeeId,
                familyId: w.familyId,
              }))
          )
      );
    },
  };
}
