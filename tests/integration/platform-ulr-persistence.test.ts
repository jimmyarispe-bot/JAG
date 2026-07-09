import { describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/ulr";
import "@/lib/platform/events";
import {
  getUlrCompetency,
  persistUlrCompetency,
  publishUlrCompetency,
  ULR_REFERENCE_COMPETENCIES,
} from "@/lib/platform/ulr";

function createUlrMockStore() {
  const competencies: Record<string, unknown>[] = [];
  const relationships: Record<string, unknown>[] = [];
  const graphEdges: Record<string, unknown>[] = [];
  const events: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table === "platform_ulr_competencies") {
      if (operation === "insert" || operation === "upsert" || operation === "single") {
        const row: Record<string, unknown> = {
          id: "ulr-comp-1",
          ...(payload as Record<string, unknown>),
        };
        const idx = competencies.findIndex(
          (c) => c.competency_key === row.competency_key
        );
        if (idx >= 0) competencies[idx] = row;
        else competencies.push(row);
        return { data: row, error: null };
      }
      return { data: competencies, error: null };
    }

    if (table === "platform_ulr_relationships") {
      if (operation === "insert" || operation === "upsert" || operation === "single") {
        const row = {
          id: "ulr-rel-1",
          status: "active",
          ...(payload as Record<string, unknown>),
        };
        relationships.push(row);
        return { data: row, error: null };
      }
      return { data: relationships, error: null };
    }

    if (table === "platform_graph_edges") {
      if (operation === "insert" || operation === "upsert" || operation === "single") {
        const row = {
          id: "graph-edge-1",
          status: "active",
          recorded_at: new Date().toISOString(),
          ...(payload as Record<string, unknown>),
        };
        graphEdges.push(row);
        return { data: row, error: null };
      }
      return { data: graphEdges, error: null };
    }

    if (table === "platform_event_records") {
      if (operation === "insert" || operation === "single") {
        const row = { id: "event-1", ...(payload as Record<string, unknown>) };
        events.push(row);
        return { data: row, error: null };
      }
      return { data: events, error: null };
    }

    return { data: [], error: null };
  });

  return { supabase, competencies, relationships, graphEdges, events };
}

describe("ULR persistence and publish", () => {
  it("persists competency definitions to platform_ulr_competencies", async () => {
    const { supabase, competencies } = createUlrMockStore();
    const competency = ULR_REFERENCE_COMPETENCIES[0]!;

    const result = await persistUlrCompetency(supabase as never, competency);
    expect(result.id).toBeTruthy();
    expect(competencies).toHaveLength(1);
    expect(competencies[0]?.competency_key).toBe("AW-SL-PA-001-v1.0.0");
    expect(getUlrCompetency("AW-SL-PA-001-v1.0.0")).toBeDefined();
  });

  it("publishes competency with graph and event integration", async () => {
    const { supabase, graphEdges, events } = createUlrMockStore();
    const competency = ULR_REFERENCE_COMPETENCIES[0]!;

    const result = await publishUlrCompetency(supabase as never, competency);

    expect(result.ok).toBe(true);
    expect(graphEdges.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
  });
});
