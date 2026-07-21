import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { updateProjectHealth } from "@/lib/work/projects";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const today = () => new Date().toISOString().split("T")[0];

export async function syncWorkToMissionControl(supabase: AuthClient) {
  await markOverdueTasks(supabase);
  await Promise.all([
    syncBlockedProjects(supabase),
    syncCriticalTasks(supabase),
    syncWaitingApprovals(supabase),
  ]);
  await refreshAllProjectHealth(supabase);
}

async function markOverdueTasks(supabase: AuthClient) {
  // Overdue tasks are surfaced via Mission Control — status remains unchanged for user workflow
  void supabase;
}

async function existingMcEntityIds(
  supabase: AuthClient,
  entityType: string,
  entityIds: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  if (!entityIds.length) return existing;
  const { data } = await supabase
    .from("platform_mission_control_items")
    .select("entity_id")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .eq("is_resolved", false);
  for (const row of data ?? []) {
    if (row.entity_id) existing.add(row.entity_id);
  }
  return existing;
}

async function syncBlockedProjects(supabase: AuthClient) {
  const { data: projects } = await supabase
    .from("work_projects")
    .select("id, name, school_id, health_indicator")
    .eq("health_indicator", "red")
    .in("status", ["active", "blocked", "planning"]);

  const ids = (projects ?? []).map((p) => p.id);
  const existing = await existingMcEntityIds(supabase, "work_projects", ids);

  await Promise.all(
    (projects ?? [])
      .filter((p) => !existing.has(p.id))
      .map((p) =>
        createMissionControlItem(supabase, {
          schoolId: p.school_id,
          module: "compliance",
          itemType: "compliance_alert",
          title: `Blocked project: ${p.name}`,
          body: "Project health is red — review overdue or blocked tasks",
          href: `/dashboard/projects?id=${p.id}`,
          entityType: "work_projects",
          entityId: p.id,
          assignedRole: "SCHOOL_LEADER",
          severity: "high",
        })
      )
  );
}

async function syncCriticalTasks(supabase: AuthClient) {
  const t = today();
  const { data: tasks } = await supabase
    .from("work_tasks")
    .select("id, title, school_id, owner_user_id, due_date, priority")
    .in("priority", ["critical", "high"])
    .not("status", "in", '("completed","cancelled")')
    .or(`due_date.lt.${t},priority.eq.critical`);

  const ids = (tasks ?? []).map((t) => t.id);
  const existing = await existingMcEntityIds(supabase, "work_tasks", ids);

  await Promise.all(
    (tasks ?? [])
      .filter((task) => !existing.has(task.id))
      .map((task) =>
        createMissionControlItem(supabase, {
          schoolId: task.school_id,
          module: "compliance",
          itemType: "compliance_alert",
          title: task.due_date && task.due_date < t ? `Overdue: ${task.title}` : `Critical: ${task.title}`,
          href: `/dashboard/tasks?id=${task.id}`,
          entityType: "work_tasks",
          entityId: task.id,
          assignedUserId: task.owner_user_id,
          severity: task.priority === "critical" ? "critical" : "high",
        })
      )
  );
}

async function syncWaitingApprovals(supabase: AuthClient) {
  const { data: tasks } = await supabase
    .from("work_tasks")
    .select("id, title, school_id, owner_user_id")
    .eq("status", "needs_review")
    .eq("task_type", "approval");

  await Promise.all(
    (tasks ?? []).map((task) =>
      createMissionControlItem(supabase, {
        schoolId: task.school_id,
        module: "executive",
        itemType: "executive_alert",
        title: `Approval waiting: ${task.title}`,
        href: `/dashboard/work?view=approvals`,
        entityType: "work_tasks",
        entityId: task.id,
        assignedUserId: task.owner_user_id,
        severity: "normal",
      })
    )
  );
}

async function refreshAllProjectHealth(supabase: AuthClient) {
  const { data: projects } = await supabase
    .from("work_projects")
    .select("id")
    .in("status", ["active", "planning", "blocked"]);

  await Promise.all((projects ?? []).map((p) => updateProjectHealth(supabase, p.id)));
}
