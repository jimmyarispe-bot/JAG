import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/decision";
import {
  clearDecisionAuditBuffer,
  executeDecision,
  getPlatformDecisionRecordByExecutionId,
  listPlatformDecisionRecords,
  loadPersistedDecisionAuditEntries,
} from "@/lib/platform/decision";

function createDecisionRecordMockStore() {
  const records: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table !== "platform_decision_records") {
      return { data: null, error: { message: `Unknown table ${table}` } };
    }

    if (operation === "insert" || operation === "single") {
      const row = {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        recorded_at: new Date().toISOString(),
        ...(payload as Record<string, unknown>),
      };
      records.push(row);
      return { data: row, error: null };
    }

    if (operation === "maybeSingle") {
      const row = records.find((record) => record.execution_id === filters.execution_id);
      return { data: row ?? null, error: null };
    }

    let rows = [...records];
    if (filters.execution_id) {
      rows = rows.filter((row) => row.execution_id === filters.execution_id);
    }
    if (filters.decision_type) {
      rows = rows.filter((row) => row.decision_type === filters.decision_type);
    }
    if (filters.entity_id) {
      rows = rows.filter((row) => row.entity_id === filters.entity_id);
    }

    return { data: rows, error: null };
  });

  return { supabase, records };
}

describe("Platform decision persistence", () => {
  beforeEach(() => {
    clearDecisionAuditBuffer();
  });

  it("persists rule-based decision audit entries", async () => {
    const { supabase, records } = createDecisionRecordMockStore();

    const result = await executeDecision(
      {
        decisionType: "ref_platform_escalation_priority",
        inputs: { severity_score: 85, age_hours: 2 },
        organizationId: TEST_UUIDS.organization,
        schoolId: TEST_UUIDS.school,
        actorUserId: TEST_UUIDS.user,
        entityType: "ticket",
        entityId: "ticket_1",
      },
      { persist: { supabase } }
    );

    expect(records).toHaveLength(1);
    expect(records[0]?.execution_id).toBe(result.executionId);
    expect(records[0]?.decision_type).toBe("ref_platform_escalation_priority");
    expect(records[0]?.organization_id).toBe(TEST_UUIDS.organization);
    expect(records[0]?.school_id).toBe(TEST_UUIDS.school);
    expect(records[0]?.result).toEqual(result);

    const loaded = await getPlatformDecisionRecordByExecutionId(supabase, result.executionId);
    expect(loaded?.execution_id).toBe(result.executionId);
    expect(loaded?.recommendation).toEqual(result.recommendation);
  });

  it("lists and loads persisted decision audit entries", async () => {
    const { supabase } = createDecisionRecordMockStore();

    await executeDecision(
      {
        decisionType: "ref_platform_escalation_priority",
        inputs: { severity_score: 60, age_hours: 12 },
        organizationId: TEST_UUIDS.organization,
        entityType: "ticket",
        entityId: TEST_UUIDS.note,
      },
      { persist: { supabase } }
    );

    const rows = await listPlatformDecisionRecords(supabase, {
      decisionType: "ref_platform_escalation_priority",
    });
    expect(rows).toHaveLength(1);

    const entries = await loadPersistedDecisionAuditEntries(supabase, {
      entityId: TEST_UUIDS.note,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.decisionType).toBe("ref_platform_escalation_priority");
    expect(entries[0]?.result.recommendation.outcomeKey).toBeTruthy();
  });
});
