# Human Capital Intelligence — Verification Checklist

**Sprint:** 032  
**Branch:** `founder-os-beta`  
**Date:** July 12, 2026

## Build / types

- [x] `npx tsc --noEmit` passes
- [x] No circular imports between `human-capital` and infrastructure adapters
- [x] Package exports resolve from `@/lib/platform/intelligence` and `@/lib/platform/intelligence/human-capital`

## Package completeness

- [x] `HumanCapitalService`
- [x] `HumanCapitalEngine`
- [x] `WorkforceIntelligence`
- [x] `WorkforceRepository`
- [x] WorkforceModels (`workforceModels`)
- [x] `HumanCapitalDashboard`
- [x] Recruiting suite (pipeline, resume, scoring, interview, references, hiring, offers, sourcing, branding, analytics)
- [x] Employee suite (profile, skills, competency, performance, goals, feedback, coaching, recognition, behavior, productivity)
- [x] Leadership suite (assessment, development, succession, bench, org design, manager effectiveness, high potential)
- [x] Retention suite (burnout, retention, engagement, stay, exit, sentiment, culture)
- [x] Learning suite (plans, paths, certifications, mentorship, training, knowledge transfer)
- [x] Compensation suite (salary, equity, modeling, bonus, benefits)
- [x] Planning suite (forecast, capacity, hiring, scenarios, skills gap, future workforce)
- [x] Outputs: scores, hiring dashboard, burnout dashboard, succession, capability index, brief, career plans, coaching
- [x] README + CHANGELOG + architecture + sprint docs

## Functional scenarios

- [x] Builds full `HumanCapitalResult` with core scores and dashboards
- [x] Persists results + history via `WorkforceRepository`
- [x] Supports focused queries via `HumanCapitalQueries`
- [x] Produces Executive Workforce Brief

## Integration

- [x] Platform module `human-capital` runs after `board-governance`
- [x] `createIntelligenceService().humanCapital` is wired
- [x] Default pipeline order includes `human-capital`
- [x] OIOS domain `human-capital` is active
- [x] Existing Sprint 021–031 packages untouched (composition only)

## Tests

- [x] `tests/unit/intelligence/human-capital.test.ts` passes
- [x] Pipeline order assertions include `human-capital`
- [x] Full intelligence unit suite passes

## Suggested commit message

```
feat(intelligence): add Sprint 032 Human Capital Intelligence

Activate talent lifecycle intelligence so OIOS can recruit, develop,
retain, and grow extraordinary people as a first-class domain.
```
