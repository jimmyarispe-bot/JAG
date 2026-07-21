import { createAuthClient } from "@/lib/supabase/server-auth";
import { getTriggerLabel } from "./triggers";
import type {
  ExecutionStatus,
  WorkflowDefinitionJson,
  WorkflowListRow,
  WorkflowRow,
  WorkflowStatus,
} from "./types";

export interface WorkflowListQuery {
  search?: string;
  status?: WorkflowStatus | "all" | "enabled" | "disabled";
  category?: string;
  sort?: "name" | "updated_at" | "last_run_at" | "success_rate";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  schoolId?: string | null;
}

export async function listWorkflows(
  query: WorkflowListQuery = {}
): Promise<{ rows: WorkflowListRow[]; total: number; page: number; pageSize: number }> {
  const supabase = await createAuthClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const sort = query.sort ?? "updated_at";
  const sortDir = query.sortDir ?? "desc";

  let request = supabase.from("platform_workflows").select("*", { count: "exact" });

  if (query.schoolId) request = request.or(`school_id.eq.${query.schoolId},school_id.is.null`);
  if (query.category) request = request.eq("category", query.category);
  if (query.status === "enabled") request = request.eq("enabled", true).eq("status", "active");
  else if (query.status === "disabled") request = request.eq("enabled", false);
  else if (query.status && query.status !== "all") request = request.eq("status", query.status);
  else request = request.neq("status", "archived");

  const search = (query.search ?? "").trim();
  if (search) {
    request = request.or(`name.ilike.%${search}%,description.ilike.%${search}%,trigger_key.ilike.%${search}%`);
  }

  if (sort !== "success_rate") {
    request = request.order(sort === "name" ? "name" : sort, {
      ascending: sortDir === "asc",
      nullsFirst: false,
    });
  } else {
    request = request.order("name", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await request.range(from, from + pageSize - 1);
  if (error) {
    console.error("[workflows] listWorkflows:", error.message);
    return { rows: [], total: 0, page, pageSize };
  }

  const creatorIds = [...new Set((data ?? []).map((r) => r.created_by).filter(Boolean))];
  const nameById = new Map<string, string>();
  if (creatorIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", creatorIds as string[]);
    for (const u of users ?? []) nameById.set(u.id, u.full_name ?? "User");
  }

  let rows: WorkflowListRow[] = (data ?? []).map((row) => {
    const runs = row.run_count ?? 0;
    const successRate = runs > 0 ? Math.round(((row.success_count ?? 0) / runs) * 100) : null;
    return {
      ...(row as unknown as WorkflowRow),
      definition: row.definition as WorkflowDefinitionJson,
      createdByName: row.created_by ? nameById.get(row.created_by) ?? null : null,
      successRate,
      triggerLabel: getTriggerLabel(row.trigger_key),
    };
  });

  if (sort === "success_rate") {
    rows = [...rows].sort((a, b) => {
      const av = a.successRate ?? -1;
      const bv = b.successRate ?? -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }

  return { rows, total: count ?? rows.length, page, pageSize };
}

export async function getWorkflowById(id: string): Promise<WorkflowRow | null> {
  const supabase = await createAuthClient();
  const { data } = await supabase.from("platform_workflows").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return { ...data, definition: data.definition as WorkflowDefinitionJson } as WorkflowRow;
}

export interface ExecutionHistoryQuery {
  workflowId?: string;
  status?: ExecutionStatus | "all";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listExecutions(query: ExecutionHistoryQuery = {}) {
  const supabase = await createAuthClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));

  let request = supabase
    .from("platform_workflow_executions")
    .select("*, platform_workflows(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query.workflowId) request = request.eq("workflow_id", query.workflowId);
  if (query.status && query.status !== "all") request = request.eq("status", query.status);
  if (query.fromDate) request = request.gte("created_at", query.fromDate);
  if (query.toDate) request = request.lte("created_at", query.toDate);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await request.range(from, from + pageSize - 1);
  if (error) {
    console.error("[workflows] listExecutions:", error.message);
    return { rows: [], total: 0, page, pageSize };
  }

  const rows = (data ?? []).map((row) => {
    const wf = row.platform_workflows as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(wf) ? wf[0]?.name : wf?.name;
    return {
      ...row,
      workflowName: name ?? "Workflow",
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}
