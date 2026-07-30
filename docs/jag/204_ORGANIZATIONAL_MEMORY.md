# Sprint 204 — Organizational Memory & Learning

**Status:** Complete (Phase II)  
**Scope:** Application / intelligence services + Command Center UI. No JAG Core or Runtime changes.

---

## 1. Objective

Institutional memory — **not** user chat history.

JAG remembers organizational decisions, outcomes, and lessons so future intelligence can reference past experience.

Route: `/jag/memory`

---

## 2. Package

```
src/lib/platform/intelligence/memory/
  MemoryRecord.ts
  MemoryTimeline.ts
  MemoryPattern.ts
  MemorySimilarity.ts
  MemorySearch.ts
  MemoryInsights.ts
  MemoryRegistry.ts
  MemoryEngine.ts
  MemoryService.ts
  observability.ts
  index.ts
```

Command Center adapter: `src/lib/jag-command-center/memory/`

---

## 3. Memory lifecycle

1. **Capture** — Decision outcome review, executive lesson form, or explicit `MemoryService.create`
2. **Store** — Typed `MemoryRecord` with evidence, outcome, confidence, related entities
3. **Pattern detection** — Advisory recurring situations (funding shortages, turnover, …)
4. **Similarity** — “Similar situations” for decisions / scenarios / conversation / briefings
5. **Retrieval** — `/jag/memory` search + timeline + insights
6. **Observability** — creation, pattern detection, similarity, retrieval

---

## 4. Pattern engine

Keyword/tag matchers over memory corpus. Patterns require ≥2 hits.

Kinds include funding shortages, enrollment spikes, teacher turnover, attendance decline, compliance issues, successful interventions.

Patterns remain **advisory**.

---

## 5. Similarity model

Token Jaccard + type/tag/decision/contributor boosts.

Returns score, reasons, outcome, lessons, confidence for each hit.

---

## 6. Historical reasoning

| Surface | Behavior |
|---------|----------|
| Decision detail | Similar situations panel |
| Scenario Planner | Similar situations after runs |
| Forecasts | Link to Memory |
| Briefings | **Historical Context** section |
| Conversation | Intents: have we seen this / last time / worked best / how often |
| Outcome review | Auto-writes outcome memory |

---

## 7. Lessons learned

Executives record: what worked, what failed, unexpected outcomes, future recommendations (`lesson_learned` type).

---

## 8. Design

Memory should feel like **organizational experience**, not a document dump. Timelines, patterns, and similar situations emphasize outcomes and lessons.
