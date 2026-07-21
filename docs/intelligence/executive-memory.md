# Executive Memory Intelligence (Sprint 063)

**Version:** 0.1.0  
**Module id:** `executive-memory`  
**Package:** `src/lib/platform/intelligence/executive-memory/`

> Path note: Sprint 009 already owns `src/lib/platform/intelligence/memory/`.
> This domain uses `executive-memory` so that package remains frozen.

## Purpose

Executive Memory is JAG’s structured, queryable memory of organizational reasoning.

It remembers decisions, briefs, risks, opportunities, initiatives, outcomes, and
lessons — not as a document dump, but as a relational graph executives can recall:

- Why did we approve this?
- When did this risk first appear?
- What initiatives came from this recommendation?
- How many times has this issue recurred?

## Memory model

| Kind | Role |
|------|------|
| `decision` | Decision + alternatives + expected/actual outcome |
| `briefing` | Archived Executive Brief (daily/weekly/monthly/quarterly) |
| `risk` / `opportunity` | Persistent signals with recurrence |
| `initiative` | Actions spawned from decisions |
| `meeting` | Strategic discussion anchors |
| `outcome` | Measured results |
| `lesson` | What to repeat / what to change |

## Entity relationships

```
Brief → Decision → Initiative → Outcome → Lesson
Risk  → Decision
```

Relationship kinds: `derived_from`, `led_to`, `mitigates`, `realizes`, `supports`,
`contradicts`, `recurs`, `archived_as`, `owned_by`, `evidenced_by`.

Duplicate entities are prevented via source fingerprints and risk title recurrence.

## Retrieval architecture

`MemoryRecallQuery` filters by date range, domain, initiative, decision, person,
topic, confidence, organization, school, and tags.

Structured recall helpers:

- `whenDidRiskFirstAppear(title)`
- `briefingsRelatedTo(topic)`
- `initiativesFromDecision(id)`
- `recurrenceCount(title)`
- `traverseFrom(id)`

## Retention policies

Configurable (never hard-coded):

| Policy | Meaning |
|--------|---------|
| `permanent` | Keep indefinitely (decisions, outcomes, lessons) |
| `archive` | Keep for comparison (briefs, meetings) |
| `expire` | Soft-expire after N days |
| `legal_hold` | Override expiry |

## Architecture layer

```
Domains
   │
   ▼
Wisdom
   │
   ▼
Executive Synthesis
   │
   ▼
Executive Briefing
   │
   ▼
Executive Memory
```

Hard DAG predecessor: **`briefing`**. Soft-reads `BriefingResultLight` only.

## Extension guide

1. Do not regenerate Sprint 009 `intelligence/memory`.
2. Soft-read briefing/synthesis lights — never import peer engines.
3. Register custom retention rules via `ExecutiveMemoryRegistry`.
4. Upsert entities through `MemoryGraph` to preserve dedupe + relationships.

## Example timeline

| When | Kind | Title |
|------|------|-------|
| 08:00 | briefing | Executive brief daily |
| 08:00 | risk | Staffing–cash cluster |
| 08:00 | decision | Approve Florida staffing war-room |
| 08:00 | initiative | Initiative: Approve Florida staffing war-room |

## Example decision history

```
Decision: Approve Florida staffing war-room
Status: proposed → completed
Expected: Vacancies filled in 30 days
Actual: Vacancies filled in 45 days
Lesson: Adjust expected-outcome assumptions; tighten follow-up ownership
```

## Validation

```bash
npx vitest run tests/unit/intelligence/executive-memory.test.ts
npm run typecheck
npm run perf:audit
npm run perf:regression
```
