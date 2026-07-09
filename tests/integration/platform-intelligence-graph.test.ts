import { describe, expect, it } from "vitest";
import "@/lib/platform/intelligence-graph";
import {
  PLATFORM_GRAPH_EDGE_CATALOG,
  PLATFORM_GRAPH_NODE_CATALOG,
  buildGraphNodeId,
  captureGraphSnapshot,
  getActiveGraphRegistrySnapshot,
  getGraphRegistrySnapshot,
  isGraphRegistryRegistered,
  parseGraphNodeId,
  queryGraphNeighborhood,
  queryGraphPath,
  resolveGraphEdges,
  resolveGraphNode,
  searchGraphByProvider,
  traverseGraph,
  validateGraphRegistry,
} from "@/lib/platform/intelligence-graph";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";

describe("Platform intelligence graph registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateGraphRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference definitions and providers on side-effect import", () => {
    expect(isGraphRegistryRegistered()).toBe(true);
    expect(getActiveGraphRegistrySnapshot().nodeDefinitions.length).toBeGreaterThanOrEqual(25);
    expect(getActiveGraphRegistrySnapshot().edgeDefinitions.length).toBeGreaterThanOrEqual(18);
    expect(getActiveGraphRegistrySnapshot().providers).toHaveLength(11);
  });
});

describe("Platform intelligence graph catalog", () => {
  it("defines reference node and edge types across providers", () => {
    const snapshot = getGraphRegistrySnapshot();
    expect(PLATFORM_GRAPH_NODE_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(PLATFORM_GRAPH_EDGE_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(snapshot.providers).toContain("relationship");
    expect(snapshot.providers).toContain("activity");
    expect(snapshot.providers).toContain("profile");
  });
});

describe("Platform intelligence graph node utilities", () => {
  it("builds and parses canonical node identifiers", () => {
    const nodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);
    expect(nodeId).toBe(`entity:student:${TEST_UUIDS.student}`);

    const parsed = parseGraphNodeId(nodeId);
    expect(parsed).toEqual({
      nodeType: "entity",
      entityType: "student",
      entityId: TEST_UUIDS.student,
    });
  });
});

describe("Platform intelligence graph node resolver", () => {
  it("resolves entity nodes via the relationship provider", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));
    const node = await resolveGraphNode(
      {
        supabase: supabase as never,
        organizationId: TEST_UUIDS.organization,
        schoolId: TEST_UUIDS.school,
      },
      {
        nodeType: "entity",
        entityType: "student",
        entityId: TEST_UUIDS.student,
      }
    );

    expect(node).not.toBeNull();
    expect(node?.nodeType).toBe("entity");
    expect(node?.entityType).toBe("student");
    expect(node?.entityId).toBe(TEST_UUIDS.student);
  });

  it("resolves nodes by nodeId", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));
    const nodeId = buildGraphNodeId("entity", "employee", TEST_UUIDS.employee);

    const node = await resolveGraphNode(
      { supabase: supabase as never },
      { nodeId }
    );

    expect(node?.nodeId).toBe(nodeId);
    expect(node?.entityType).toBe("employee");
  });
});

describe("Platform intelligence graph edge resolver", () => {
  it("resolves relationship edges from the Relationship Engine", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_relationships") {
        return {
          data: [
            {
              id: TEST_UUIDS.relationship,
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              relationship_type: "student.teacher",
              from_entity_type: "student",
              from_entity_id: TEST_UUIDS.student,
              to_entity_type: "employee",
              to_entity_id: TEST_UUIDS.employee,
              is_primary: true,
              effective_date: "2025-01-01",
              end_date: null,
              status: "active",
              source: "manual",
              notes: null,
              metadata: {},
              created_by: null,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    const startNode = {
      nodeId: buildGraphNodeId("entity", "student", TEST_UUIDS.student),
      nodeType: "entity",
      entityType: "student",
      entityId: TEST_UUIDS.student,
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      metadata: {},
    };

    const edges = await resolveGraphEdges(
      { supabase: supabase as never },
      { node: startNode, direction: "outgoing" }
    );

    expect(edges.length).toBeGreaterThanOrEqual(1);
    expect(edges[0]?.edgeType).toBe("relationship");
    expect(edges[0]?.metadata.providerKey).toBe("relationship");
  });
});

describe("Platform intelligence graph traversal engine", () => {
  it("traverses breadth-first with max depth", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_relationships") {
        return {
          data: [
            {
              id: TEST_UUIDS.relationship,
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              relationship_type: "student.teacher",
              from_entity_type: "student",
              from_entity_id: TEST_UUIDS.student,
              to_entity_type: "employee",
              to_entity_id: TEST_UUIDS.employee,
              is_primary: false,
              effective_date: null,
              end_date: null,
              status: "active",
              source: "manual",
              notes: null,
              metadata: {},
              created_by: null,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      if (table === "platform_activity_events") return { data: [], error: null };
      if (table === "platform_notes") return { data: [], error: null };
      if (table === "platform_entity_tags") return { data: [], error: null };
      if (table === "platform_workflow_instances") return { data: [], error: null };
      return { data: [], error: null };
    });

    const startNodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);
    const result = await traverseGraph(
      { supabase: supabase as never },
      startNodeId,
      { strategy: "breadth_first", maxDepth: 2 }
    );

    expect(result.strategy).toBe("breadth_first");
    expect(result.nodes.length).toBeGreaterThanOrEqual(1);
    expect(result.visitedCount).toBeGreaterThanOrEqual(1);
  });

  it("supports depth-first traversal", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));
    const startNodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);

    const result = await traverseGraph(
      { supabase: supabase as never },
      startNodeId,
      {
        strategy: "depth_first",
        maxDepth: 0,
        edgeFilter: { providerKeys: "relationship" },
      }
    );

    expect(result.strategy).toBe("depth_first");
    expect(result.nodes).toHaveLength(1);
  });
});

describe("Platform intelligence graph query APIs", () => {
  it("queries neighborhood within depth", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));
    const nodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);

    const result = await queryGraphNeighborhood(
      { supabase: supabase as never },
      { nodeId, depth: 1 }
    );

    expect(result.centerNodeId).toBe(nodeId);
    expect(result.depth).toBe(1);
    expect(result.nodes.length).toBeGreaterThanOrEqual(1);
  });

  it("finds shortest path between nodes", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_relationships") {
        return {
          data: [
            {
              id: TEST_UUIDS.relationship,
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              relationship_type: "student.teacher",
              from_entity_type: "student",
              from_entity_id: TEST_UUIDS.student,
              to_entity_type: "employee",
              to_entity_id: TEST_UUIDS.employee,
              is_primary: false,
              effective_date: null,
              end_date: null,
              status: "active",
              source: "manual",
              notes: null,
              metadata: {},
              created_by: null,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    const sourceNodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);
    const targetNodeId = buildGraphNodeId("entity", "employee", TEST_UUIDS.employee);

    const result = await queryGraphPath(
      { supabase: supabase as never },
      { sourceNodeId, targetNodeId, maxDepth: 3 }
    );

    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.path[0]?.nodeId).toBe(sourceNodeId);
    expect(result.path.at(-1)?.nodeId).toBe(targetNodeId);
  });

  it("returns not found when no path exists", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));

    const result = await queryGraphPath(
      { supabase: supabase as never },
      {
        sourceNodeId: buildGraphNodeId("entity", "student", TEST_UUIDS.student),
        targetNodeId: buildGraphNodeId("entity", "family", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
        maxDepth: 2,
      }
    );

    expect(result.found).toBe(false);
    expect(result.path).toHaveLength(0);
  });

  it("searches nodes across providers", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));

    const result = await searchGraphByProvider(
      { supabase: supabase as never },
      "workflow",
      { query: "platform" }
    );

    expect(result.query).toBe("platform");
    expect(result.matchCount).toBeGreaterThanOrEqual(0);
  });

  it("captures graph snapshot around a root node", async () => {
    const supabase = createMockSupabase(() => ({ data: [], error: null }));
    const rootNodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);

    const snapshot = await captureGraphSnapshot(
      { supabase: supabase as never },
      { rootNodeId, depth: 1 }
    );

    expect(snapshot.rootNodeId).toBe(rootNodeId);
    expect(snapshot.capturedAt).toBeTruthy();
    expect(snapshot.providers.length).toBe(11);
    expect(snapshot.nodes.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Platform intelligence graph filters", () => {
  it("applies node type filters during traversal", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_relationships") {
        return {
          data: [
            {
              id: TEST_UUIDS.relationship,
              organization_id: TEST_UUIDS.organization,
              school_id: TEST_UUIDS.school,
              relationship_type: "student.teacher",
              from_entity_type: "student",
              from_entity_id: TEST_UUIDS.student,
              to_entity_type: "employee",
              to_entity_id: TEST_UUIDS.employee,
              is_primary: false,
              effective_date: null,
              end_date: null,
              status: "active",
              source: "manual",
              notes: null,
              metadata: {},
              created_by: null,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    const startNodeId = buildGraphNodeId("entity", "student", TEST_UUIDS.student);
    const result = await traverseGraph(
      { supabase: supabase as never },
      startNodeId,
      {
        strategy: "breadth_first",
        maxDepth: 2,
        nodeFilter: { nodeTypes: "entity", entityTypes: "student" },
      }
    );

    expect(result.nodes.every((node) => node.entityType === "student")).toBe(true);
  });
});
