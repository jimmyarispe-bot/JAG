# Decision Intelligence (Sprint 064)

**Version:** 0.1.0  
**Module id:** `decision-intelligence`  
**Package:** `src/lib/platform/intelligence/decision-intelligence/`

> Path note: Early cognitive `intelligence/decision` (DecisionResolver) remains frozen.
> This domain uses `decision-intelligence`.

## Purpose

Transform organizational intelligence into **decision support** — not autonomous execution.

JAG recommends multiple options with transparent scorecards, trade-offs, expected outcomes
(with uncertainty), historical lessons from Executive Memory, and policy-aware approval flags.

## Architecture

```
Wisdom → Synthesis → Briefing → Executive Memory → Decision Intelligence
```

| Area | Role |
|------|------|
| Option generator | Multiple candidate actions per issue kind |
| Evaluation engine | Multi-criteria scorecards + scenarios |
| Recommendation engine | Ranking, tie-breaks, recommendation object |
| Policy engine | Budget / compliance / approval thresholds |
| Explainability | Why / domains / history / assumptions / contradictions |
| History lookup | Soft-reads executive-memory (no duplicate storage) |

Hard DAG predecessor: **`executive-memory`**.

## Decision lifecycle

1. Resolve issue (explicit input, briefing decision queue, or top risk)
2. Collect evidence from briefing + memory lights
3. Generate option seeds (never a single answer)
4. Score each option (alignment, impact, risk, effort, urgency, ROI, confidence)
5. Apply organizational policies → approval flags
6. Rank with tie-breaks (overall → confidence → lower risk → lower effort)
7. Emit `DecisionRecommendation` with explainability + suggested next step

## Scoring methodology

| Criterion | Meaning |
|-----------|---------|
| Strategic alignment | Overlap with issue domains + category boost |
| Financial / operational impact | Seeded impact dimensions |
| Risk / effort / time | Penalties in overall composite |
| Confidence | Evidence count + historical matches − contradictions |
| ROI | Expected impact vs effort |
| Overall | Weighted composite used for ranking |

## Explainability

Every recommendation answers:

- Why is this recommended?
- Which domains contributed?
- Which historical outcomes influenced it?
- What assumptions matter most?
- What evidence contradicts it?

## Extension guide

1. Do not regenerate `intelligence/decision`.
2. Soft-read briefing / executive-memory lights only.
3. Register policies via `DecisionIntelligenceRegistry` / request.policies.
4. Add issue-kind option seeds in `option-generator.ts` without engine rewrites.

## Example recommendation

**Issue:** Teacher shortage at Florida campus  

**Top option:** Hire additional staff (or reallocate / virtual capacity alternatives ranked below)  

**Scorecard:** overall / impact / risk / effort / confidence  

**Suggested next step:** Route for executive approval, then assign owner.

## Example comparison table

| Rank | Option | Overall | Impact | Risk | Effort | Approval |
|------|--------|---------|--------|------|--------|----------|
| #1 | Hire additional staff | 72 | 78 | 45 | high | executive |
| #2 | Reallocate existing staff | 69 | 70 | 55 | medium | none |
| #3 | Increase virtual capacity | 64 | 65 | 50 | medium | manager |

## UI foundation

`src/components/decision-intelligence/`:

- `DecisionIntelligenceCard`
- `RecommendationPanel`
- `OptionComparisonTable`
- `TradeoffView`
- `ConfidenceIndicator`
- `EvidencePanel`

Uses UX-003/004 `ActionChip` actions.

## Validation

```bash
npx vitest run tests/unit/intelligence/decision-intelligence.test.ts
npm run typecheck
npm run perf:audit
npm run perf:regression
```
