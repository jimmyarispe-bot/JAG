# Executive Copilot (Sprint 067)

**Sprint:** 067  
**Domain:** Executive Copilot  
**Version:** 0.1.0  
**Module id:** `executive-copilot`  
**Package (intelligence DAG):** `src/lib/platform/intelligence/executive-copilot/`

> **Dual stack (maintainers):** Product **Copilot 2.0** for RC-5 lives at  
> `src/lib/platform/executive-copilot/` (Ask JAG / `/exec/ask`).  
> This document describes the Sprint 067 intelligence-pipeline module.  
> See [`docs/platform/rc-packages.md`](../platform/rc-packages.md).

## Purpose

Conversational strategic reasoning over the Executive Cognitive Stack.

The Copilot does **not** replace dashboards. It orchestrates existing intelligence domains and returns unified, explainable answers.

## Namespace verification

Intelligence DAG package: `intelligence/executive-copilot/`.  
Product package (RC-5): `platform/executive-copilot/` — do not conflate the two.

## Pipeline position

```
… → wisdom
     → synthesis
     → briefing
     → executive-memory
     → decision-intelligence
     → executive-predictive
     → executive-autonomous
     → executive-copilot
```

Hard DAG predecessor: `executive-autonomous`.  
Soft-reads: synthesis, briefing, executive-memory, decision-intelligence, executive-predictive, executive-autonomous.

## Architecture

- `engine/` — copilot, conversation, context builder, response orchestrator
- `planners/` — retrieval / reasoning / execution handoff plans
- `skills/` — explain, summarize, compare, investigate, forecast, recommend
- Soft-read lights only — no imports of peer engines

## Orchestration flow

1. Detect intent from the question  
2. Plan which domains to retrieve  
3. Assemble soft-read context  
4. Dispatch skill  
5. Attach evidence, domain trace, confidence, uncertainties  
6. Suggest follow-ups  
7. If execution prep is needed → reference Autonomous plans (`humanAuthorizationRequired: true`)

## Governance boundaries

| Allowed | Forbidden |
|---|---|
| Explain | Auto-execute org actions |
| Recommend | Bypass Autonomous approvals |
| Prepare | Hard-code person names for approvals |
| Investigate | Duplicate domain engine logic |

`governance.mayAutoExecute` is always `false`.  
`governance.routesExecutionThroughAutonomous` is always `true`.

## Explainability model

Every answer includes:

- Executive summary  
- Supporting evidence (domain-tagged)  
- Contributing domains + domain trace  
- Confidence  
- Known uncertainties  

## UI foundation

`src/components/executive-copilot/`:

- CopilotPanel
- ConversationView
- EvidenceDrawer
- DomainTrace
- RecommendationCard
- FollowUpSuggestions

## Extension guide

1. Add a skill under `skills/` and wire it in `response-orchestrator.ts`.  
2. Extend intent detection in `planners/retrieval-plan.ts`.  
3. Keep soft-read contracts in `types.ts`.  
4. Preserve hard DAG on `executive-autonomous`.  
5. Never add side-effecting execution.

## Example conversations

**Q:** Why did enrollment decline in Florida?  
**A:** Investigation assembling briefing risks, synthesis correlations, memory lessons, predictive signals, and recommended next steps.

**Q:** Which recommendation has the highest expected ROI?  
**A:** Ranks Decision Intelligence options by ROI/overall score with comparison cards.

**Q:** Help me prepare for tomorrow's board meeting.  
**A:** Board prep package: briefing, open decisions, risks, pending approvals, forecasts, recent changes.

## Tests

```bash
npx vitest run tests/unit/intelligence/executive-copilot.test.ts
```
