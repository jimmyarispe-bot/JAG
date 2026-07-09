import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/intelligence-graph";
import "@/lib/platform/events";
import { recordEvidence } from "@/lib/platform/evidence";
import { evaluateRuleSet } from "@/lib/platform/rules";
import { publishEvent } from "@/lib/platform/events";
import {
  JAG_LEARNING_NODE_DEFINITIONS,
  loadPersistedGraphEdges,
  queryGraphRelationships,
  recordGraphEdge,
  recordGraphEdges,
} from "@/lib/platform/intelligence-graph";

function createGraphMockStore() {
  const edges: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table === "platform_graph_edges") {
      if (operation === "insert" || operation === "upsert" || operation === "single") {
        const row = {
          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5",
          recorded_at: new Date().toISOString(),
          status: "active",
          ...(payload as Record<string, unknown>),
        };
        const existingIndex = edges.findIndex(
          (edge) =>
            edge.edge_type === row.edge_type &&
            edge.source_node_id === row.source_node_id &&
            edge.target_node_id === row.target_node_id &&
            edge.provider_key === row.provider_key
        );
        if (existingIndex >= 0) {
          edges[existingIndex] = { ...edges[existingIndex], ...row };
        } else {
          edges.push(row);
        }
        return { data: row, error: null };
      }

      let rows = edges.filter((edge) => edge.status === (filters.status ?? "active"));
      if (filters.source_node_id) {
        rows = rows.filter((edge) => edge.source_node_id === filters.source_node_id);
      }
      if (filters.target_node_id) {
        rows = rows.filter((edge) => edge.target_node_id === filters.target_node_id);
      }
      if (filters.edge_type) {
        rows = rows.filter((edge) => edge.edge_type === filters.edge_type);
      }
      if (filters.provider_key) {
        rows = rows.filter((edge) => edge.provider_key === filters.provider_key);
      }
      return { data: rows, error: null };
    }

    if (table === "platform_evidence_records") {
      if (operation === "insert" || operation === "single") {
        const row = {
          id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
          recorded_at: new Date().toISOString(),
          status: "active",
          ...(payload as Record<string, unknown>),
        };
        return { data: row, error: null };
      }
      if (operation === "maybeSingle") {
        return {
          data: {
            id: filters.id ?? "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
            evidence_type_key: "observation.instructional",
            skill_keys: ["AW-SL-PA-001-S01-v1.0.0"],
            competency_keys: ["AW-SL-PA-001-v1.0.0"],
            student_id: TEST_UUIDS.student,
            organization_id: TEST_UUIDS.organization,
            school_id: TEST_UUIDS.school,
            captured_at: new Date().toISOString(),
            captured_by_role: "teacher",
            captured_by_user_id: null,
            source_context: {},
            locale: "en",
            jurisdiction_keys: [],
            artifact_refs: [],
            scores: [],
            narrative: null,
            accommodations_applied: [],
            evidence_confidence: 0.9,
            evidence_quality: 0.85,
            expires_at: null,
            relationships: [],
            supersedes_evidence_id: null,
            ai_assisted: false,
            ai_validation_status: null,
            metadata: {},
            status: "active",
            recorded_at: new Date().toISOString(),
          },
          error: null,
        };
      }
    }

    if (table === "platform_event_records") {
      if (operation === "insert" || operation === "single") {
        return {
          data: {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
            ...(payload as Record<string, unknown>),
          },
          error: null,
        };
      }
      return { data: [], error: null };
    }

    if (table === "platform_rule_evaluation_records") {
      if (operation === "insert" || operation === "single") {
        return {
          data: {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
            ...(payload as Record<string, unknown>),
          },
          error: null,
        };
      }
      return { data: [], error: null };
    }

    return { data: [], error: null };
  });

  return { supabase, edges };
}

describe("Intelligence graph learning entity catalog", () => {
  it("registers all required JAG graph entity types", () => {
    const nodeTypes = new Set(JAG_LEARNING_NODE_DEFINITIONS.map((def) => def.nodeType));
    expect(nodeTypes.has("student")).toBe(true);
    expect(nodeTypes.has("competency")).toBe(true);
    expect(nodeTypes.has("evidence")).toBe(true);
    expect(nodeTypes.has("learning_journey")).toBe(true);
    expect(nodeTypes.has("scholarship")).toBe(true);
    expect(nodeTypes.has("rule_evaluation")).toBe(true);
    expect(JAG_LEARNING_NODE_DEFINITIONS.length).toBeGreaterThanOrEqual(18);
  });
});

describe("Intelligence graph persistence", () => {
  it("records and queries canonical graph edges", async () => {
    const { supabase, edges } = createGraphMockStore();

    await recordGraphEdge(supabase, {
      edgeType: "student.enrolled_in.class",
      sourceNodeId: `entity:student:${TEST_UUIDS.student}`,
      targetNodeId: "class:class:class_101",
      providerKey: "persisted",
      schoolId: TEST_UUIDS.school,
    });

    expect(edges).toHaveLength(1);

    const loaded = await loadPersistedGraphEdges(supabase, {
      sourceNodeId: `entity:student:${TEST_UUIDS.student}`,
    });
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.edgeType).toBe("student.enrolled_in.class");
  });

  it("queries relationships via queryGraphRelationships", async () => {
    const { supabase } = createGraphMockStore();
    const studentNodeId = `entity:student:${TEST_UUIDS.student}`;
    const competencyNodeId = "competency:competency:AW-SL-PA-001-v1.0.0";

    await recordGraphEdges(supabase, [
      {
        edgeType: "student.demonstrates.competency",
        sourceNodeId: studentNodeId,
        targetNodeId: competencyNodeId,
        providerKey: "evidence",
      },
    ]);

    const result = await queryGraphRelationships(
      { supabase: supabase as never, schoolId: TEST_UUIDS.school },
      { nodeId: studentNodeId, direction: "outgoing" }
    );

    expect(result.edges).toHaveLength(1);
    expect(result.relatedNodeIds).toContain(competencyNodeId);
  });
});

describe("Intelligence graph platform integrations", () => {
  beforeEach(() => {
    // graph store is per-test factory
  });

  it("syncs KEE evidence into graph edges on recordEvidence", async () => {
    const { supabase, edges } = createGraphMockStore();

    await recordEvidence(supabase, {
      evidenceTypeKey: "observation.instructional",
      competencyKeys: ["AW-SL-PA-001-v1.0.0"],
      skillKeys: ["AW-SL-PA-001-AS-001-v1.0.0"],
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      evidenceConfidence: 0.9,
      evidenceQuality: 0.85,
    });

    expect(edges.length).toBeGreaterThanOrEqual(2);
    expect(edges.some((edge) => edge.edge_type === "student.demonstrates.competency")).toBe(true);
    expect(edges.some((edge) => edge.edge_type === "competency.supported_by.evidence")).toBe(true);
  });

  it("syncs rule evaluations into graph edges on evaluateRuleSet persist", async () => {
    const { supabase, edges } = createGraphMockStore();

    await evaluateRuleSet(
      {
        ruleSetKey: "ref_graduation_readiness",
        facts: { readiness_score: 92 },
        entityType: "student",
        entityId: TEST_UUIDS.student,
        schoolId: TEST_UUIDS.school,
      },
      { persist: { supabase: supabase as never } }
    );

    expect(edges.some((edge) => edge.edge_type === "rule.evaluated_for.entity")).toBe(true);
  });

  it("syncs events into graph edges on publishEvent persist", async () => {
    const { supabase, edges } = createGraphMockStore();

    await publishEvent(
      {
        eventType: "platform.entity.created",
        entityType: "student",
        entityId: TEST_UUIDS.student,
        schoolId: TEST_UUIDS.school,
      },
      { persist: { supabase: supabase as never } }
    );

    expect(edges.some((edge) => edge.edge_type === "event.references")).toBe(true);
  });
});
