# Sprint 208 — Explainability & Intelligence Graph Explorer

**Status:** Complete (Phase II)  
**Scope:** Application / intelligence services + Command Center UI. No JAG Core or Runtime changes.  
**Not a graph database** — application-layer visualization and reasoning explorer over existing JAG services.

---

## 1. Objective

Every executive decision, forecast, recommendation, alert, strategy, and outcome must be explainable:

- **Why?**
- **What evidence supports this?**
- **How did JAG reach this conclusion?**

Route: `/jag/graph`

---

## 2. Package

```
src/lib/platform/intelligence/explain/
  types.ts
  ExplanationService.ts
  ExplanationEngine.ts
  ReasoningChain.ts
  EvidenceCollector.ts
  ConfidenceAnalyzer.ts
  DependencyExplorer.ts
  GraphBuilder.ts
  ExplainabilityRegistry.ts
  ExplainabilityObservability.ts
  index.ts
```

Import via `@/lib/platform/intelligence/explain/index`.

Command Center adapter: `src/lib/jag-command-center/explain/`

---

## 3. Reasoning model

An **Explanation** is composed from a subject (decision, alert, goal, briefing section, graph node):

1. Collect evidence refs  
2. Resolve dependencies (depth-limited, cycle-safe)  
3. Build chronological reasoning steps  
4. Analyze confidence (score, evidence strength, freshness, assumptions, missing info)  
5. Cache result (TTL 60s)

Reasoning steps move from evidence → knowledge/policies → forecasts/scenarios → memory → goals/initiatives → decisions → executions → outcomes.

---

## 4. Graph model

Nodes: Evidence · Knowledge · Policies · Contributors · Forecasts · Scenarios · Memory · Goals · Initiatives · Decisions · Executions · Outcomes · Watcher Alerts · Briefings · Conversations · Capabilities · Organization

Edges: supports · derived_from · references · depends_on · influences · produces · related_to · triggered_by · aligns_with

Seeds are built from Strategy, Memory, Watchers, and Capability Registry for an organization. Relationships are lazy-loaded and truncated for large graphs.

---

## 5. Explanation lifecycle

| Step | Surface |
|------|---------|
| Generate | `ExplanationService` / `ExplanationEngine` |
| Explore | `/jag/graph` focus + filters |
| Panel | Explain on Decision, Inbox, Strategy, Briefing |
| Converse | Intent `explainability` (“Why did you recommend…”) |
| Observe | `/jag/observability` · Explainability operations |

---

## 6. Confidence model

Every explanation includes:

| Field | Meaning |
|-------|---------|
| score / band | Overall confidence |
| evidenceStrength | Strength of bound evidence |
| dataFreshness | fresh · aging · stale · unknown |
| assumptionCount | Explicit assumptions |
| missingInformation | Gaps stated, never invented |

---

## 7. Performance strategy

- Lazy-load relationships via depth + limit  
- Virtualize large node lists in the UI (scroll container)  
- Cache explanations (60s TTL, bounded cache)  
- Dependency explorer prevents recursive traversal loops  
- Graph queries record truncation when seed exceeds view

---

## 8. Surfaces

| Surface | Behavior |
|---------|----------|
| `/jag/graph` | Search, kind/capability/time filters, focus, expand/collapse, breadcrumb, node details |
| Decision / Inbox / Strategy / Briefing | Shared Explain panel |
| Conversation | Why / evidence / assumptions / reasoning |
| Global search | Reasoning · Evidence · Goals · Capabilities |
| Capability SDK | `jag.intelligence.explainability` |

---

## 9. Invariants

- Application layer only — no Core / Runtime changes  
- Advisory explanations — no fabricated facts  
- Graph Explorer is an executive reasoning map, not a developer debugger  
