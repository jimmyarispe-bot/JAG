/**
 * Sprint 009 — Executive Intelligence Memory unit tests.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  archiveMemory,
  createMemory,
  createPersistentIntelligenceMemory,
  deleteMemory,
  findRelatedMemory,
  InMemoryIntelligenceMemoryRepository,
  IntelligenceMemoryLifecycle,
  IntelligenceMemoryStore,
  IntelligenceMemorySummarizer,
  jaccardSimilarity,
  loadMemory,
  PersistentIntelligenceMemory,
  resetDefaultPersistentIntelligenceMemory,
  saveMemory,
  setDefaultPersistentIntelligenceMemory,
  summarizeMemory,
  TokenOverlapSimilarityEngine,
  tokenizeMemoryText,
  type CreateIntelligenceMemoryInput,
  type IntelligenceMemoryRepository,
  type IntelligencePersistentMemoryRecord,
} from "@/lib/platform/intelligence/memory/index";

function makeInput(
  overrides: Partial<CreateIntelligenceMemoryInput> = {}
): CreateIntelligenceMemoryInput {
  return {
    domain: "executive",
    executionId: "exec-1",
    organizationId: "org-1",
    schoolId: "school-1",
    observations: ["Enrollment trending down in grade 3"],
    assumptions: ["Seasonal dip is temporary"],
    recommendations: ["Review recruiting pipeline"],
    evidence: [{ evidenceId: "ev-1", label: "Enrollment report" }],
    confidence: { value: 0.72, level: "medium", factors: [] },
    request: { intent: "morning-brief" },
    contextSnapshot: { healthScore: 68 },
    metadata: { source: "test" },
    ...overrides,
  };
}

describe("IntelligenceMemoryLifecycle — creation", () => {
  it("creates a fully populated active memory record", () => {
    const repo = new InMemoryIntelligenceMemoryRepository();
    const store = new IntelligenceMemoryStore({ repository: repo });
    const lifecycle = new IntelligenceMemoryLifecycle({
      store,
      now: () => new Date("2026-07-11T12:00:00.000Z"),
      createId: () => "mem-fixed-1",
    });

    const record = lifecycle.create(makeInput());

    expect(record.id).toBe("mem-fixed-1");
    expect(record.timestamp).toBe("2026-07-11T12:00:00.000Z");
    expect(record.domain).toBe("executive");
    expect(record.executionId).toBe("exec-1");
    expect(record.organizationId).toBe("org-1");
    expect(record.status).toBe("active");
    expect(record.observations).toEqual(["Enrollment trending down in grade 3"]);
    expect(record.evidence).toHaveLength(1);
    expect(record.confidence.value).toBe(0.72);
    expect(record.request).toEqual({ intent: "morning-brief" });
    expect(record.contextSnapshot).toEqual({ healthScore: 68 });
  });

  it("applies default confidence when omitted", () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "mem-2",
      now: () => new Date("2026-07-11T00:00:00.000Z"),
    });
    const record = memory.createMemory({
      domain: "financial",
      executionId: "exec-2",
    });
    expect(record.confidence.level).toBe("unknown");
    expect(record.confidence.value).toBe(0);
    expect(record.observations).toEqual([]);
  });
});

describe("retrieval", () => {
  async function seed(): Promise<{
    memory: PersistentIntelligenceMemory;
    records: IntelligencePersistentMemoryRecord[];
  }> {
    const memory = createPersistentIntelligenceMemory({
      createId: (() => {
        let n = 0;
        return () => `mem-r-${++n}`;
      })(),
    });

    const inputs: CreateIntelligenceMemoryInput[] = [
      makeInput({
        domain: "executive",
        executionId: "exec-a",
        organizationId: "org-1",
        timestamp: "2026-07-01T10:00:00.000Z",
        observations: ["Cash runway is healthy"],
        recommendations: ["Hold tuition steady"],
      }),
      makeInput({
        domain: "financial",
        executionId: "exec-b",
        organizationId: "org-1",
        timestamp: "2026-07-05T10:00:00.000Z",
        observations: ["Receivables aging improved"],
        recommendations: ["Continue collection cadence"],
      }),
      makeInput({
        domain: "executive",
        executionId: "exec-c",
        organizationId: "org-2",
        timestamp: "2026-07-08T10:00:00.000Z",
        observations: ["Teacher retention risk rising"],
        recommendations: ["Launch stay interviews"],
      }),
    ];

    const records: IntelligencePersistentMemoryRecord[] = [];
    for (const input of inputs) {
      const created = memory.createMemory(input);
      records.push(await memory.saveMemory(created));
    }
    return { memory, records };
  }

  it("retrieves by domain", async () => {
    const { memory } = await seed();
    const hits = await memory.retrieval.byDomain("executive");
    expect(hits).toHaveLength(2);
    expect(hits.every((h) => h.domain === "executive")).toBe(true);
  });

  it("retrieves by date range", async () => {
    const { memory } = await seed();
    const hits = await memory.retrieval.byDate({
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-09T00:00:00.000Z",
    });
    expect(hits.map((h) => h.executionId).sort()).toEqual(["exec-b", "exec-c"]);
  });

  it("retrieves by organization", async () => {
    const { memory } = await seed();
    const hits = await memory.retrieval.byOrganization("org-1");
    expect(hits).toHaveLength(2);
    expect(hits.every((h) => h.organizationId === "org-1")).toBe(true);
  });

  it("retrieves by execution", async () => {
    const { memory } = await seed();
    const hits = await memory.retrieval.byExecution("exec-b");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.domain).toBe("financial");
  });

  it("retrieves most relevant memories", async () => {
    const { memory } = await seed();
    const hits = await memory.findRelatedMemory({
      text: "teacher retention stay interviews",
      organizationId: undefined,
      limit: 2,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.executionId).toBe("exec-c");
  });
});

describe("similarity", () => {
  it("tokenizes and scores Jaccard overlap", () => {
    const a = tokenizeMemoryText("Enrollment trending down grade three");
    const b = tokenizeMemoryText("Enrollment trending up grade three");
    const score = jaccardSimilarity(a, b);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(1);
  });

  it("ranks candidates with TokenOverlapSimilarityEngine", () => {
    const engine = new TokenOverlapSimilarityEngine();
    const ranked = engine.rank(
      { id: "q", text: "cash runway tuition", domain: "executive" },
      [
        { id: "1", text: "cash runway is healthy", domain: "executive" },
        { id: "2", text: "unrelated weather report", domain: "operational" },
      ]
    );
    expect(ranked[0]!.id).toBe("1");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });

  it("allows injecting a custom similarity engine", async () => {
    const custom = {
      score: vi.fn(() => 0.9),
      rank: vi.fn((query, candidates) =>
        candidates.map((c: { id: string }) => ({
          id: c.id,
          score: c.id === "preferred" ? 1 : 0.1,
        }))
      ),
    };

    const repo = new InMemoryIntelligenceMemoryRepository();
    const store = new IntelligenceMemoryStore({ repository: repo });
    const memory = createPersistentIntelligenceMemory({
      repository: repo,
      store,
      similarity: custom,
      createId: () => "preferred",
    });

    await memory.saveMemory(
      memory.createMemory(
        makeInput({
          id: "preferred",
          observations: ["alpha"],
        })
      )
    );
    await memory.saveMemory(
      memory.createMemory(
        makeInput({
          id: "other",
          observations: ["beta"],
          executionId: "exec-other",
        })
      )
    );

    const hits = await memory.findRelatedMemory({ text: "anything", limit: 1 });
    expect(custom.rank).toHaveBeenCalled();
    expect(hits[0]!.id).toBe("preferred");
  });
});

describe("summarization", () => {
  it("builds an executive summary from related memories", () => {
    const summarizer = new IntelligenceMemorySummarizer();
    const memory = createPersistentIntelligenceMemory({
      createId: (() => {
        let n = 0;
        return () => `sum-${++n}`;
      })(),
      now: () => new Date("2026-07-11T15:00:00.000Z"),
    });

    const a = memory.createMemory(
      makeInput({
        observations: ["Obs A", "Obs shared"],
        recommendations: ["Rec 1"],
        confidence: { value: 0.8, level: "high", factors: [] },
      })
    );
    const b = memory.createMemory(
      makeInput({
        observations: ["Obs B", "Obs shared"],
        recommendations: ["Rec 2"],
        confidence: { value: 0.6, level: "medium", factors: [] },
        executionId: "exec-2",
      })
    );

    const summary = summarizer.summarize([a, b], {
      generatedAt: "2026-07-11T15:00:00.000Z",
      summaryId: "summary-1",
    });

    expect(summary.summaryId).toBe("summary-1");
    expect(summary.domainFocus).toBe("executive");
    expect(summary.memoryIds).toEqual(["sum-1", "sum-2"]);
    expect(summary.keyObservations).toContain("Obs A");
    expect(summary.keyObservations).toContain("Obs shared");
    expect(summary.keyObservations.filter((o) => o === "Obs shared")).toHaveLength(1);
    expect(summary.averageConfidence).toBe(0.7);
    expect(summary.narrative).toContain("Recommended actions");
  });

  it("summarizeMemory accepts records or ids", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "sum-id-1",
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    });
    const record = await memory.saveMemory(
      memory.createMemory(makeInput({ observations: ["Loaded observation"] }))
    );

    const fromRecords = await memory.summarizeMemory([record]);
    expect(fromRecords.keyObservations).toContain("Loaded observation");

    const fromIds = await memory.summarizeMemory([record.id]);
    expect(fromIds.memoryIds).toEqual([record.id]);
  });
});

describe("lifecycle", () => {
  it("archives, expires, and deletes memories", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: (() => {
        let n = 0;
        return () => `life-${++n}`;
      })(),
      now: () => new Date("2026-07-11T18:00:00.000Z"),
    });

    const active = await memory.saveMemory(
      memory.createMemory(
        makeInput({
          expiresAt: "2026-07-10T00:00:00.000Z",
        })
      )
    );

    const archived = await memory.archiveMemory(active.id);
    expect(archived.status).toBe("archived");

    const due = await memory.saveMemory(
      memory.createMemory(
        makeInput({
          executionId: "exec-expire",
          expiresAt: "2026-07-10T00:00:00.000Z",
        })
      )
    );
    // Re-activate path: create fresh active with past expiry
    await memory.updateMemory(due.id, { status: "active" });
    const expired = await memory.expireMemory({ asOf: "2026-07-11T18:00:00.000Z" });
    expect(expired.some((e) => e.id === due.id && e.status === "expired")).toBe(true);

    const softTarget = await memory.saveMemory(
      memory.createMemory(makeInput({ executionId: "exec-del" }))
    );
    expect(await memory.deleteMemory(softTarget.id)).toBe(true);
    const softLoaded = await memory.loadMemory(softTarget.id);
    expect(softLoaded?.status).toBe("deleted");

    const hardTarget = await memory.saveMemory(
      memory.createMemory(makeInput({ executionId: "exec-hard" }))
    );
    expect(await memory.deleteMemory(hardTarget.id, { hard: true })).toBe(true);
    expect(await memory.loadMemory(hardTarget.id)).toBeNull();
  });

  it("updates mutable fields", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "upd-1",
      now: () => new Date("2026-07-11T19:00:00.000Z"),
    });
    await memory.saveMemory(memory.createMemory(makeInput()));
    const updated = await memory.updateMemory("upd-1", {
      observations: ["Updated observation"],
      recommendations: ["Updated rec"],
    });
    expect(updated.observations).toEqual(["Updated observation"]);
    expect(updated.recommendations).toEqual(["Updated rec"]);
    expect(updated.updatedAt).toBe("2026-07-11T19:00:00.000Z");
  });
});

describe("dependency injection", () => {
  it("uses an injected repository without calling a database", async () => {
    const save = vi.fn(async (record: IntelligencePersistentMemoryRecord) => record);
    const findById = vi.fn(async (id: string) =>
      id === "di-1"
        ? ({
            id: "di-1",
            timestamp: "2026-07-11T00:00:00.000Z",
            domain: "executive" as const,
            request: {},
            contextSnapshot: {},
            observations: ["from-repo"],
            evidence: [],
            assumptions: [],
            recommendations: [],
            confidence: { value: 0.5, level: "medium" as const, factors: [] },
            metadata: {},
            executionId: "exec-di",
            organizationId: "org-1",
            schoolId: null,
            status: "active" as const,
            updatedAt: "2026-07-11T00:00:00.000Z",
            expiresAt: null,
          } satisfies IntelligencePersistentMemoryRecord)
        : null
    );
    const findMany = vi.fn(async () => []);
    const del = vi.fn(async () => true);

    const repository: IntelligenceMemoryRepository = {
      save,
      findById,
      findMany,
      delete: del,
    };

    const memory = createPersistentIntelligenceMemory({
      repository,
      createId: () => "di-1",
      now: () => new Date("2026-07-11T00:00:00.000Z"),
    });

    const created = memory.createMemory(makeInput({ id: "di-1" }));
    await memory.saveMemory(created);
    expect(save).toHaveBeenCalledTimes(1);

    const loaded = await memory.loadMemory("di-1");
    expect(findById).toHaveBeenCalledWith("di-1");
    expect(loaded?.observations).toEqual(["from-repo"]);

    await memory.deleteMemory("di-1", { hard: true });
    expect(del).toHaveBeenCalledWith("di-1");
  });

  it("wires standalone public API through an injected default instance", async () => {
    resetDefaultPersistentIntelligenceMemory();
    const repo = new InMemoryIntelligenceMemoryRepository();
    const instance = createPersistentIntelligenceMemory({
      repository: repo,
      createId: () => "api-1",
      now: () => new Date("2026-07-11T20:00:00.000Z"),
    });
    setDefaultPersistentIntelligenceMemory(instance);

    const created = createMemory(makeInput({ id: "api-1" }));
    await saveMemory(created);
    const loaded = await loadMemory("api-1");
    expect(loaded?.id).toBe("api-1");

    const related = await findRelatedMemory({
      text: "Enrollment trending",
      limit: 5,
    });
    expect(related.some((r) => r.id === "api-1")).toBe(true);

    const summary = await summarizeMemory(["api-1"]);
    expect(summary.memoryIds).toEqual(["api-1"]);

    await archiveMemory("api-1");
    expect((await loadMemory("api-1"))?.status).toBe("archived");

    await deleteMemory("api-1", { hard: true });
    expect(await loadMemory("api-1")).toBeNull();

    resetDefaultPersistentIntelligenceMemory();
  });
});

describe("foundation coexistence", () => {
  it("does not replace foundation IntelligenceMemoryService exports", async () => {
    const foundation = await import("@/lib/platform/intelligence/memory");
    expect(foundation.IntelligenceMemoryService).toBeTypeOf("function");
    expect(new foundation.IntelligenceMemoryService()).toBeInstanceOf(
      foundation.IntelligenceMemoryService
    );
  });
});

afterEach(() => {
  resetDefaultPersistentIntelligenceMemory();
});
