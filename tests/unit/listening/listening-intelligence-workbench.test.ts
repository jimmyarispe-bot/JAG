/**
 * Slice 4.1 — Listening Intelligence Workbench (filter, compare, permissions).
 */

import { describe, expect, it, vi } from "vitest";
import {
  compareListeningCampaignSignals,
  filterListeningSignals,
  formatCompletionPct,
  formatConfidence,
  type ListeningSignalRow,
} from "@/lib/platform/listening/intelligence";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";

const ORG = TEST_UUIDS.organization;

function signal(
  partial: Partial<ListeningSignalRow> &
    Pick<ListeningSignalRow, "id" | "campaignId" | "title" | "signalClass">
): ListeningSignalRow {
  return {
    organizationId: ORG,
    analysisRunId: "run-1",
    signalKind: "deterministic",
    signalType: "theme",
    description: "desc",
    status: "proposed",
    confidence: 0.7,
    supportCount: 3,
    instrumentId: "inst-1",
    instrumentVersionId: "ver-1",
    createdAt: "2026-06-01T00:00:00Z",
    metadata: {},
    ...partial,
  };
}

const SAMPLE: ListeningSignalRow[] = [
  signal({
    id: "s1",
    campaignId: "camp-a",
    title: "Burnout risk",
    signalClass: "concern",
    supportCount: 5,
    confidence: 0.8,
    metadata: { question_id: "q1" },
    createdAt: "2026-06-02T00:00:00Z",
  }),
  signal({
    id: "s2",
    campaignId: "camp-a",
    title: "Strong collaboration",
    signalClass: "strength",
    supportCount: 2,
    confidence: 0.5,
    instrumentId: "inst-2",
    metadata: { question_id: "q2" },
    createdAt: "2026-06-03T00:00:00Z",
  }),
  signal({
    id: "s3",
    campaignId: "camp-b",
    title: "Burnout risk",
    signalClass: "concern",
    supportCount: 4,
    confidence: 0.6,
    metadata: { question_id: "q1", segment_id: "seg-1" },
    createdAt: "2026-05-01T00:00:00Z",
  }),
  signal({
    id: "s4",
    campaignId: "camp-b",
    title: "Training opportunity",
    signalClass: "opportunity",
    supportCount: 3,
    confidence: 0.55,
    createdAt: "2026-07-01T00:00:00Z",
  }),
];

describe("Listening workbench — filtering", () => {
  it("filters by campaign, type, question, search, and sorts", () => {
    const filtered = filterListeningSignals(SAMPLE, {
      campaignId: "camp-a",
      signalClass: "concern",
      questionId: "q1",
      query: "burn",
      sort: "support",
    });
    expect(filtered.map((s) => s.id)).toEqual(["s1"]);

    const byInstrument = filterListeningSignals(SAMPLE, {
      instrumentId: "inst-2",
    });
    expect(byInstrument.map((s) => s.id)).toEqual(["s2"]);

    const byDate = filterListeningSignals(SAMPLE, {
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      sort: "recent",
    });
    expect(byDate.map((s) => s.id)).toEqual(["s2", "s1"]);

    const byInitiative = filterListeningSignals(
      SAMPLE,
      { initiativeId: "init-a" },
      {
        campaignInitiative: new Map([
          ["camp-a", "init-a"],
          ["camp-b", "init-b"],
        ]),
      }
    );
    expect(byInitiative.every((s) => s.campaignId === "camp-a")).toBe(true);

    const bySegment = filterListeningSignals(SAMPLE, { segmentId: "seg-1" });
    expect(bySegment.map((s) => s.id)).toEqual(["s3"]);
  });
});

describe("Listening workbench — comparison", () => {
  it("computes shared and unique themes plus class buckets", () => {
    const a = SAMPLE.filter((s) => s.campaignId === "camp-a");
    const b = SAMPLE.filter((s) => s.campaignId === "camp-b");
    const result = compareListeningCampaignSignals(a, b, "camp-a", "camp-b");
    expect(result.sharedThemes).toContain("burnout risk");
    expect(result.uniqueToA).toContain("strong collaboration");
    expect(result.uniqueToB).toContain("training opportunity");
    expect(result.concernsA).toContain("burnout risk");
    expect(result.concernsB).toContain("burnout risk");
    expect(result.strengthsA).toContain("strong collaboration");
    expect(result.opportunitiesB).toContain("training opportunity");
  });
});

describe("Listening workbench — signal retrieval + formatting", () => {
  it("formats completion and confidence for display", () => {
    expect(formatCompletionPct(0.42)).toBe("42%");
    expect(formatCompletionPct(null)).toBe("—");
    expect(formatConfidence(0.805)).toBe("81%");
  });
});

describe("Listening workbench — evidence permissions + isolation", () => {
  it("redacts excerpts without RAW and scopes by organization", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async (_db: unknown, key: string) => {
        if (key === "LISTENING_ANALYZE") return true;
        if (key === "LISTENING_VIEW") return true;
        if (key === "LISTENING_RAW") return false;
        return false;
      },
    }));

    const db = createMockSupabase(({ table, operation, filters }) => {
      if (table === "listening_signals" && operation === "maybeSingle") {
        expect(filters.organization_id).toBe(ORG);
        return { data: { id: "s1" }, error: null };
      }
      if (table === "listening_evidence_links" && operation === "select") {
        expect(filters.organization_id).toBe(ORG);
        return {
          data: [
            {
              id: "e1",
              signal_id: "s1",
              evidence_kind: "answer",
              answer_id: "a1",
              question_id: "q1",
              response_id: "r1",
              label: "Support",
              payload: { excerpt: "raw secret", question_prompt: "Why?" },
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
      signalId: "s1",
    });
    expect(rows[0]?.payload.excerpt).toBeUndefined();
    expect(rows[0]?.payload.question_prompt).toBe("Why?");
  });

  it("lists signals only for the requested organization", async () => {
    vi.resetModules();
    vi.doMock("@/lib/platform/identity/permissions", () => ({
      userHasPermission: async () => true,
    }));
    const db = createMockSupabase(({ table, operation, filters }) => {
      if (table === "listening_signals" && operation === "select") {
        expect(filters.organization_id).toBe(ORG);
        return {
          data: [
            {
              id: "s1",
              organization_id: ORG,
              campaign_id: "camp-a",
              analysis_run_id: "run-1",
              signal_kind: "deterministic",
              signal_type: "theme",
              title: "Theme",
              summary: "s",
              status: "proposed",
              confidence: 0.5,
              created_at: "2026-01-01T00:00:00Z",
              metadata: { listening_class: "theme", support_count: 2 },
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${table}/${operation}` } };
    });
    const { listListeningSignals } = await import(
      "@/lib/platform/listening/intelligence/service"
    );
    const rows = await listListeningSignals(db, { organizationId: ORG });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.organizationId).toBe(ORG);
  });
});
