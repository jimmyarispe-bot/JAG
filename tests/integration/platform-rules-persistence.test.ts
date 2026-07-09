import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/rules";
import {
  clearRuleAuditBuffer,
  evaluateRuleSet,
  getPlatformRuleEvaluationRecordByEvaluationId,
  listPlatformRuleEvaluationRecords,
  loadPersistedRuleAuditEntries,
} from "@/lib/platform/rules";

function createRuleEvaluationMockStore() {
  const records: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table !== "platform_rule_evaluation_records") {
      return { data: null, error: { message: `Unknown table ${table}` } };
    }

    if (operation === "insert" || operation === "single") {
      const row = {
        id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd4",
        recorded_at: new Date().toISOString(),
        ...(payload as Record<string, unknown>),
      };
      records.push(row);
      return { data: row, error: null };
    }

    if (operation === "maybeSingle") {
      const row = records.find((record) => record.evaluation_id === filters.evaluation_id);
      return { data: row ?? null, error: null };
    }

    let rows = [...records];
    if (filters.evaluation_id) {
      rows = rows.filter((row) => row.evaluation_id === filters.evaluation_id);
    }
    if (filters.rule_set_key) {
      rows = rows.filter((row) => row.rule_set_key === filters.rule_set_key);
    }
    if (filters.domain) {
      rows = rows.filter((row) => row.domain === filters.domain);
    }

    return { data: rows, error: null };
  });

  return { supabase, records };
}

describe("Platform rules persistence", () => {
  beforeEach(() => {
    clearRuleAuditBuffer();
  });

  it("persists rule evaluation audit entries", async () => {
    const { supabase, records } = createRuleEvaluationMockStore();

    const result = await evaluateRuleSet(
      {
        ruleSetKey: "ref_graduation_readiness",
        facts: { readiness_score: 92 },
        organizationId: TEST_UUIDS.organization,
        schoolId: TEST_UUIDS.school,
        actorUserId: TEST_UUIDS.user,
        entityType: "student",
        entityId: TEST_UUIDS.student,
      },
      { persist: { supabase } }
    );

    expect(records).toHaveLength(1);
    expect(records[0]?.evaluation_id).toBe(result.evaluationId);
    expect(records[0]?.rule_set_key).toBe("ref_graduation_readiness");
    expect(records[0]?.primary_outcome_key).toBe("graduation_ready");
    expect(records[0]?.organization_id).toBe(TEST_UUIDS.organization);

    const loaded = await getPlatformRuleEvaluationRecordByEvaluationId(
      supabase,
      result.evaluationId
    );
    expect(loaded?.result.primaryOutcome?.outcomeKey).toBe("graduation_ready");
  });

  it("lists and loads persisted rule audit entries", async () => {
    const { supabase } = createRuleEvaluationMockStore();

    await evaluateRuleSet(
      {
        ruleSetKey: "ref_scheduling_block",
        facts: { available_minutes: 60 },
        schoolId: TEST_UUIDS.school,
      },
      { persist: { supabase } }
    );

    const rows = await listPlatformRuleEvaluationRecords(supabase, {
      domain: "scheduling",
    });
    expect(rows).toHaveLength(1);

    const entries = await loadPersistedRuleAuditEntries(supabase, {
      ruleSetKey: "ref_scheduling_block",
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.domain).toBe("scheduling");
  });
});
