/**
 * Slice 4.0 — Listening Intelligence Engine (deterministic foundation).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import {
  DeterministicThemeGrouper,
  classifyTextValence,
  computeCampaignMetrics,
  extractListeningSignals,
  mapSignalClassToDbType,
  normalizeListeningText,
  planListeningAnalysis,
  LISTENING_SIGNAL_CLASSES,
} from "@/lib/platform/listening/intelligence";

const ORG = TEST_UUIDS.organization;
const ORG_B = "99999999-9999-4999-8999-999999999999";
const CAMPAIGN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VERSION = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INSTRUMENT = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const Q_TEXT = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const Q_CHOICE = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const Q_LIKERT = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const R1 = "11111111-1111-4111-8111-111111111101";
const R2 = "11111111-1111-4111-8111-111111111102";
const A1 = "22222222-2222-4222-8222-222222222201";
const A2 = "22222222-2222-4222-8222-222222222202";
const A3 = "22222222-2222-4222-8222-222222222203";
const A4 = "22222222-2222-4222-8222-222222222204";

const questions = [
  {
    id: Q_TEXT,
    question_type: "long_text",
    prompt: "What concerns you?",
    required: true,
    options: [],
  },
  {
    id: Q_CHOICE,
    question_type: "single_choice",
    prompt: "Workload",
    required: true,
    options: [
      { option_key: "high", label: "Too high — stressful" },
      { option_key: "ok", label: "Manageable" },
    ],
  },
  {
    id: Q_LIKERT,
    question_type: "likert",
    prompt: "Trust in leadership",
    required: false,
    options: [],
  },
];

const responses = [
  { id: R1, status: "submitted" },
  { id: R2, status: "submitted" },
];

const answers = [
  {
    id: A1,
    response_id: R1,
    question_id: Q_TEXT,
    question_type: "long_text",
    value: { text: "Burnout and stress from unclear priorities." },
  },
  {
    id: A2,
    response_id: R2,
    question_id: Q_TEXT,
    question_type: "long_text",
    value: { text: "Stress and burnout — priorities are unclear." },
  },
  {
    id: A3,
    response_id: R1,
    question_id: Q_CHOICE,
    question_type: "single_choice",
    value: { option_key: "high" },
  },
  {
    id: A4,
    response_id: R2,
    question_id: Q_CHOICE,
    question_type: "single_choice",
    value: { option_key: "high" },
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    response_id: R1,
    question_id: Q_LIKERT,
    question_type: "likert",
    value: { number: 2 },
  },
  {
    id: "22222222-2222-4222-8222-222222222206",
    response_id: R2,
    question_id: Q_LIKERT,
    question_type: "likert",
    value: { number: 1 },
  },
];

describe("Listening intelligence — deterministic grouping", () => {
  it("normalizes text and groups near-duplicates", () => {
    const a = normalizeListeningText("  Burnout and Stress!!! ");
    const b = normalizeListeningText("burnout and stress");
    expect(a.normalized).toBe("burnout and stress!!!");
    // tokens drop punctuation noise via replace
    expect(a.tokens).toContain("burnout");
    expect(classifyTextValence("I am worried about burnout and stress")).toBe(
      "concern"
    );

    const grouper = new DeterministicThemeGrouper({ minOverlap: 0.3 });
    const groups = grouper.group([
      {
        answerId: A1,
        responseId: R1,
        questionId: Q_TEXT,
        questionPrompt: "What concerns you?",
        rawText: "Burnout and stress from unclear priorities.",
        ...normalizeListeningText(
          "Burnout and stress from unclear priorities."
        ),
      },
      {
        answerId: A2,
        responseId: R2,
        questionId: Q_TEXT,
        questionPrompt: "What concerns you?",
        rawText: "Stress and burnout — priorities are unclear.",
        ...normalizeListeningText(
          "Stress and burnout — priorities are unclear."
        ),
      },
    ]);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups[0]!.members.length).toBe(2);
  });

  it("maps semantic classes into migration-214 DB signal types", () => {
    expect(mapSignalClassToDbType("theme")).toBe("theme");
    expect(mapSignalClassToDbType("opportunity")).toBe("opportunity");
    expect(mapSignalClassToDbType("concern")).toBe("tension");
    expect(mapSignalClassToDbType("risk")).toBe("tension");
    expect(mapSignalClassToDbType("strength")).toBe("other");
    expect(LISTENING_SIGNAL_CLASSES).toContain("suggestion");
  });
});

describe("Listening intelligence — metrics", () => {
  it("computes completion, distributions, and numeric summaries", () => {
    const metrics = computeCampaignMetrics({
      responses,
      questions,
      answers,
    });
    expect(metrics.completionCount).toBe(2);
    expect(metrics.completionRate).toBeGreaterThan(0);
    expect(metrics.averageResponseLength).toBeGreaterThan(10);
    const choice = metrics.questionCompletion.find(
      (q) => q.questionId === Q_CHOICE
    );
    expect(choice?.choiceDistribution?.high).toBe(2);
    const likert = metrics.questionCompletion.find(
      (q) => q.questionId === Q_LIKERT
    );
    expect(likert?.likertDistribution?.["1"]).toBe(1);
    expect(likert?.likertDistribution?.["2"]).toBe(1);
  });
});

describe("Listening intelligence — signals + evidence", () => {
  it("generates signals only with evidence links", () => {
    const metrics = computeCampaignMetrics({ responses, questions, answers });
    const signals = extractListeningSignals({
      answers,
      questions,
      metrics,
      minThemeSupport: 2,
    });
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(s.evidence.length).toBeGreaterThan(0);
      expect(s.supportCount).toBeGreaterThan(0);
      expect(s.confidence).toBeGreaterThan(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    }
    const plan = planListeningAnalysis({ responses, questions, answers });
    expect(plan.engine).toBe("deterministic_v1");
    expect(plan.signals.every((s) => s.evidence.length > 0)).toBe(true);
  });

  it("never fabricates signals from empty answers", () => {
    const metrics = computeCampaignMetrics({
      responses: [],
      questions,
      answers: [],
    });
    const signals = extractListeningSignals({
      answers: [],
      questions,
      metrics,
    });
    expect(signals).toEqual([]);
  });
});

describe("Listening intelligence — persistence + permissions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("persists analysis run, signals, and evidence (org scoped)", async () => {
    const inserts: { table: string; payload: unknown }[] = [];
    const db = createMockSupabase(({ table, operation, payload, filters }) => {
      if (table === "listening_analysis_runs" && operation === "single") {
        inserts.push({ table, payload });
        return { data: { id: "run-1" }, error: null };
      }
      if (table === "listening_analysis_runs" && operation === "maybeSingle") {
        return { data: { id: "run-1" }, error: null };
      }
      if (
        table === "listening_analysis_runs" &&
        (operation === "update" || operation === "select")
      ) {
        return {
          data: {
            id: "run-1",
            status: "succeeded",
            metadata: { metrics: { completionCount: 2 } },
          },
          error: null,
        };
      }
      if (table === "listening_signals" && operation === "single") {
        inserts.push({ table, payload });
        const row = payload as { organization_id: string; metadata: unknown };
        expect(row.organization_id).toBe(ORG);
        return { data: { id: `sig-${inserts.length}` }, error: null };
      }
      if (table === "listening_evidence_links" && operation === "insert") {
        inserts.push({ table, payload });
        const rows = payload as { organization_id: string }[];
        expect(rows.every((r) => r.organization_id === ORG)).toBe(true);
        return { data: rows, error: null };
      }
      // update chain ends with then
      if (table === "listening_analysis_runs") {
        return { data: null, error: null };
      }
      return {
        data: null,
        error: {
          message: `unexpected ${table}/${operation}/${JSON.stringify(filters)}`,
        },
      };
    });

    const { persistListeningAnalysisRun } = await import(
      "@/lib/platform/listening/intelligence/repository"
    );
    const plan = planListeningAnalysis({ responses, questions, answers });
    const result = await persistListeningAnalysisRun(db, {
      organizationId: ORG,
      campaignId: CAMPAIGN,
      instrumentId: INSTRUMENT,
      instrumentVersionId: VERSION,
      plan,
    });
    expect(result.status).toBe("succeeded");
    expect(result.signalCount).toBe(plan.signals.length);
    expect(result.evidenceCount).toBeGreaterThan(0);
    expect(inserts.some((i) => i.table === "listening_signals")).toBe(true);
    expect(inserts.some((i) => i.table === "listening_evidence_links")).toBe(
      true
    );
  });

  it("enforces ANALYZE+RAW for runListeningAnalysis", async () => {
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async (_db: unknown, key: string) => {
        if (key === "LISTENING_ANALYZE") return true;
        if (key === "LISTENING_RAW") return false;
        if (key === "LISTENING_VIEW") return true;
        return false;
      },
    }));
    const { runListeningAnalysis } = await import(
      "@/lib/platform/listening/intelligence/service"
    );
    const db = createMockSupabase(() => ({ data: null, error: null }));
    await expect(
      runListeningAnalysis(db, { organizationId: ORG, campaignId: CAMPAIGN })
    ).rejects.toThrow("listening_permission_raw_required");
  });

  it("redacts excerpts without LISTENING_RAW", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async (_db: unknown, key: string) => {
        if (key === "LISTENING_ANALYZE") return true;
        if (key === "LISTENING_RAW") return false;
        if (key === "LISTENING_VIEW") return true;
        return false;
      },
    }));

    const db = createMockSupabase(({ table, operation, filters }) => {
      if (table === "listening_signals" && operation === "maybeSingle") {
        expect(filters.organization_id).toBe(ORG);
        return { data: { id: "sig-1" }, error: null };
      }
      if (table === "listening_evidence_links" && operation === "select") {
        expect(filters.organization_id).toBe(ORG);
        return {
          data: [
            {
              id: "ev-1",
              signal_id: "sig-1",
              evidence_kind: "answer",
              answer_id: A1,
              question_id: Q_TEXT,
              response_id: R1,
              label: "excerpt",
              payload: { excerpt: "secret raw text", question_prompt: "x" },
              created_at: "2026-01-01T00:00:00Z",
              organization_id: ORG,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });

    const { getSignalEvidence } = await import(
      "@/lib/platform/listening/intelligence/service"
    );
    const rows = await getSignalEvidence(db, {
      organizationId: ORG,
      signalId: "sig-1",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.payload.excerpt).toBeUndefined();
    expect(rows[0]!.payload.question_prompt).toBe("x");
  });

  it("blocks cross-org signal evidence lookup", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async () => true,
    }));
    const db = createMockSupabase(({ table, operation, filters }) => {
      if (table === "listening_signals" && operation === "maybeSingle") {
        // Signal not found in caller's org
        expect(filters.organization_id).toBe(ORG);
        expect(filters.organization_id).not.toBe(ORG_B);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });
    const { getSignalEvidence } = await import(
      "@/lib/platform/listening/intelligence/service"
    );
    await expect(
      getSignalEvidence(db, { organizationId: ORG, signalId: "foreign-sig" })
    ).rejects.toThrow("listening_signal_not_found");
  });

  it("requires VIEW for listListeningSignals", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async () => false,
    }));
    const { listListeningSignals } = await import(
      "@/lib/platform/listening/intelligence/service"
    );
    const db = createMockSupabase(() => ({ data: [], error: null }));
    await expect(
      listListeningSignals(db, { organizationId: ORG })
    ).rejects.toThrow("listening_permission_view_required");
  });
});
