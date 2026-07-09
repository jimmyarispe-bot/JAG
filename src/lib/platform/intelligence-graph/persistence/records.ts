import type { GraphEdge } from "@/lib/platform/intelligence-graph/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  graphEdgeToRowInput,
  rowToGraphEdge,
  type ListGraphEdgesFilters,
  type PlatformGraphEdgeRow,
  type RecordGraphEdgeInput,
} from "@/lib/platform/intelligence-graph/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist a canonical graph edge — references only, no operational entity duplication. */
export async function recordGraphEdge(
  supabase: AuthClient,
  input: RecordGraphEdgeInput
): Promise<{ id: string | null; error?: string }> {
  const row = {
    ...graphEdgeToRowInput(input),
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("platform_graph_edges")
    .upsert(row, {
      onConflict: "edge_type,source_node_id,target_node_id,provider_key",
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: (data as { id: string }).id };
}

export async function recordGraphEdges(
  supabase: AuthClient,
  inputs: RecordGraphEdgeInput[]
): Promise<{ recorded: number; errors: string[] }> {
  const errors: string[] = [];
  let recorded = 0;

  for (const input of inputs) {
    const result = await recordGraphEdge(supabase, input);
    if (result.error) {
      errors.push(result.error);
    } else {
      recorded += 1;
    }
  }

  return { recorded, errors };
}

export async function listGraphEdges(
  supabase: AuthClient,
  filters: ListGraphEdgesFilters = {}
): Promise<PlatformGraphEdgeRow[]> {
  let query = supabase
    .from("platform_graph_edges")
    .select("*")
    .eq("status", filters.status ?? "active")
    .order("recorded_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.edgeType) query = query.eq("edge_type", filters.edgeType);
  if (filters.edgeTypes?.length) query = query.in("edge_type", filters.edgeTypes);
  if (filters.providerKey) query = query.eq("provider_key", filters.providerKey);
  if (filters.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);

  if (filters.nodeId) {
    const direction = filters.direction ?? "both";
    if (direction === "outgoing") {
      query = query.eq("source_node_id", filters.nodeId);
    } else if (direction === "incoming") {
      query = query.eq("target_node_id", filters.nodeId);
    }
  } else {
    if (filters.sourceNodeId) query = query.eq("source_node_id", filters.sourceNodeId);
    if (filters.targetNodeId) query = query.eq("target_node_id", filters.targetNodeId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PlatformGraphEdgeRow[];
}

export async function loadPersistedGraphEdges(
  supabase: AuthClient,
  filters: ListGraphEdgesFilters = {}
): Promise<GraphEdge[]> {
  if (filters.nodeId && (!filters.direction || filters.direction === "both")) {
    const outgoing = await listGraphEdges(supabase, {
      ...filters,
      nodeId: undefined,
      sourceNodeId: filters.nodeId,
      direction: "outgoing",
    });
    const incoming = await listGraphEdges(supabase, {
      ...filters,
      nodeId: undefined,
      targetNodeId: filters.nodeId,
      direction: "incoming",
    });
    const rows = [...outgoing, ...incoming];
    const seen = new Set<string>();
    return rows
      .filter((row) => {
        const key = `${row.edge_type}|${row.source_node_id}|${row.target_node_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(rowToGraphEdge);
  }

  const rows = await listGraphEdges(supabase, filters);
  return rows.map(rowToGraphEdge);
}

export async function archiveGraphEdge(
  supabase: AuthClient,
  edgeId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("platform_graph_edges")
    .update({ status: "archived" })
    .eq("id", edgeId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
