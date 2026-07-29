# Sprint 203 — Executive Conversation Intelligence

**Status:** Complete (Phase II)  
**Scope:** Application layer Command Center conversation. No JAG Core or Runtime changes.

---

## 1. Objective

Provide a **conversational interface for the entire JAG Intelligence Platform**.

This is **not a chatbot**.

Every answer is grounded in existing:

- Decisions · Briefings · Forecasts · Scenarios  
- Contributor executions · Organization health  
- Policies · Knowledge · Global search catalog  

**No hallucinations. No fabricated facts.** Unbound signals are stated as empty.

Route: `/jag/chat`

---

## 2. Conversation architecture

```
Executive question
  → Intent router (deterministic keywords + session memory)
  → Context gatherer (Command Center loaders only)
  → Answer builder (structured sections)
  → Store turn + memory topics
  → Observability + audit
  → UI stream (NDJSON progressive chunks of grounded text)
```

| Package | Path |
|---------|------|
| Engine | `src/lib/jag-command-center/conversation/` |
| UI | `src/components/jag/command-center/chat/` |
| Stream API | `src/app/api/jag/conversation/route.ts` |
| Page | `src/app/jag/(portal)/chat/page.tsx` |

---

## 3. Evidence model

Answers only cite:

| Source | Loader / store |
|--------|----------------|
| Decisions | `loadDecisionCenter` |
| Health | `loadExecutiveOverview` / school health store |
| Forecasts | `loadForecastsView` |
| Scenarios | `loadScenarioPlanner` templates (+ links to runs) |
| Briefings | `loadBriefingList` |
| Executions | `listStoredExecutions` |
| Catalog | `loadJagSearchCatalog` |

Evidence items carry `kind`: `observed` | `forecast` | `scenario` | `derived`.

---

## 4. Memory model

Per conversation (in-memory application store):

- `memoryTopics` — last topics (funding, decisions, forecasts, …)
- `memoryEntityIds` — recent decision/forecast ids
- Follow-up questions (`How does that affect…`) reuse the prior topic via intent `follow_up`

Memory is **session conversation scoped**, not a long-term LLM memory fabric.

---

## 5. Routing model

Deterministic `routeConversationIntent`:

Examples: `decide_today`, `overdue_decisions`, `organization_health`, `forecasts_attention`, `delay_decision`, `scenario_what_if`, `search`, `follow_up`, …

No LLM classification. Unknown phrasing falls through to `general_status` composed only from bound overview metrics.

---

## 6. Explainability model

Every answer includes:

- Executive Summary  
- Evidence · Confidence (+ explanation)  
- Primary Drivers · Supporting Contributors  
- Related Policies / Knowledge / Decisions  
- Forecasts · Scenarios  
- Recommended Next Actions · Suggested Follow-ups  
- Reasoning chain · Timeline · Policy / contributor traces · Dependencies  

**Source panel** surfaces confidence explanation, evidence, timeline, and traces.

All entity links navigate into JAG (Decision, Briefing, Forecast anchor, Scenario, Policy, Knowledge, Organization, …).

---

## 7. Chat experience

| Capability | Implementation |
|------------|----------------|
| History | Conversation store list |
| Streaming | NDJSON chunks via `/api/jag/conversation` |
| Suggested prompts | `SUGGESTED_PROMPTS` |
| Pin / rename / archive | Store mutations + server actions |
| Search conversations | Client filter + list query |

---

## 8. Observability

Each turn records: question, intent, duration, evidence ids, contributors, confidence, related objects, insufficient flag.

Audit action: `conversation_turn`.

Surfaced on `/jag/observability`.

---

## 9. Design

Executive. Minimal. Evidence-first. No consumer chat aesthetics.
