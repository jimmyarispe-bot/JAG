import type { GraphEdge, GraphEdgeDirection } from "@/lib/platform/intelligence-graph/types";

export interface PlatformGraphEdgeRow {
  id: string;
  edge_type: string;
  source_node_id: string;
  target_node_id: string;
  direction: GraphEdgeDirection;
  weight: number;
  provider_key: string;
  organization_id: string | null;
  school_id: string | null;
  effective_date: string | null;
  end_date: string | null;
  status: "active" | "archived";
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface RecordGraphEdgeInput {
  edgeType: string;
  sourceNodeId: string;
  targetNodeId: string;
  providerKey: string;
  direction?: GraphEdgeDirection;
  weight?: number;
  organizationId?: string | null;
  schoolId?: string | null;
  effectiveDate?: string | null;
  endDate?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListGraphEdgesFilters {
  sourceNodeId?: string;
  targetNodeId?: string;
  nodeId?: string;
  direction?: "outgoing" | "incoming" | "both";
  edgeType?: string;
  edgeTypes?: string[];
  providerKey?: string;
  schoolId?: string;
  organizationId?: string;
  status?: "active" | "archived";
  limit?: number;
}

export function rowToGraphEdge(row: PlatformGraphEdgeRow): GraphEdge {
  return {
    edgeType: row.edge_type,
    sourceNode: row.source_node_id,
    targetNode: row.target_node_id,
    direction: row.direction,
    weight: Number(row.weight),
    effectiveDate: row.effective_date,
    endDate: row.end_date,
    metadata: {
      ...row.metadata,
      providerKey: row.provider_key,
      graphEdgeId: row.id,
      status: row.status,
    },
  };
}

export function graphEdgeToRowInput(
  input: RecordGraphEdgeInput
): Omit<PlatformGraphEdgeRow, "id" | "recorded_at" | "status"> {
  return {
    edge_type: input.edgeType,
    source_node_id: input.sourceNodeId,
    target_node_id: input.targetNodeId,
    direction: input.direction ?? "directed",
    weight: input.weight ?? 1,
    provider_key: input.providerKey,
    organization_id: coerceUuid(input.organizationId),
    school_id: coerceUuid(input.schoolId),
    effective_date: input.effectiveDate ?? null,
    end_date: input.endDate ?? null,
    metadata: input.metadata ?? {},
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coerceUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
}
