# Executive Briefing Intelligence (Sprint 062)

**Version:** 0.1.0  
**Module id:** `briefing`  
**Package:** `src/lib/platform/intelligence/briefing/`  
**Depends on:** Executive Synthesis (`synthesis`), Wisdom, Executive Intelligence (soft)

## Purpose

Transform Executive Synthesis outputs into actionable executive briefings so leaders no longer hunt through dashboards.

Every login should answer:

1. What changed?
2. What matters?
3. What requires a decision?
4. What should I do next?

## Architecture

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
Executive Briefing  ← Sprint 062
```

| Area | Path |
|------|------|
| Engine | `engine/briefing-engine.ts`, `briefing-generator.ts`, `summary-engine.ts` |
| Cards | `cards/*` (risks, opportunities, decisions, alerts, metrics) |
| Timeline | `timeline/*` (overnight → year) |
| Personalization | `personalization/*` (founder, ceo, executive, school_leader, board) |
| UI | `src/components/executive-briefing/*` |

Hard DAG predecessor: **`synthesis`**. Soft-reads synthesis lights only.

## Brief lifecycle

1. Pipeline runs synthesis → `context.set("synthesis", result)`
2. Briefing module soft-reads synthesis light
3. Cards built and priority-sorted (severity / urgency / impact / confidence / alignment)
4. Overnight + timeline windows generated
5. Role personalizer applied
6. `BriefingResult` stored at `context.set("briefing", result)`
7. UI consumes `ExecutiveBriefing` contracts via ActionChip actions

## Card model

Every card includes:

- Title / summary / priority scores
- Domains
- Explainability (`why`, evidence, confidence)
- **Actions** (required): Open Investigation, View Evidence, Assign Owner, Create Initiative, Schedule Review, Dismiss

Cards are never passive reports.

## Personalization

Built-in roles: `founder`, `ceo`, `executive`, `school_leader`, `board`.

Register future roles without engine edits:

```ts
engine.registerPersonalizer({
  id: "cfo",
  name: "CFO Profile",
  version: "0.1.0",
  personalize(briefing, preferences) { /* ... */ return briefing; },
});
```

## Extension guide

1. Keep synthesis/wisdom frozen — soft-read lights only.
2. Add personalizers via the registry.
3. Extend card builders for new queues; keep actions on every card.
4. UI must import briefing contracts, not peer engines.

## Example morning brief

```
Good Morning, Jimmy
Organization Health: 48/100 (watch)
Overnight: 2 risk signals, 1 opportunity across finance, human-capital, customer

Today's Focus
1. Staffing–finance–enrollment linkage  [Open Investigation]
2. Cash decline decision                [Assign Owner]
3. Enrollment confidence outreach       [Create Initiative]
```

## Example decision card

| Field | Value |
|-------|--------|
| Decision Needed | Stand up staffing war-room |
| Why | Staffing instability links instructional continuity and enrollment pressure |
| Impact if delayed | Enrollment / cash risk within immediate horizon |
| Recommended decision | Brief CEO within 24h; assign campus owner |
| Confidence | 72 |
| Domains | finance, human-capital, customer |
| Actions | Open Investigation · View Evidence · Assign Owner · Schedule Review |

## Validation

```bash
npx vitest run tests/unit/intelligence/briefing.test.ts
npm run typecheck
npm run perf:audit
npm run perf:regression
```
