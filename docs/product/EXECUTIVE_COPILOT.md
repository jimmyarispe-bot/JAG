# Executive Copilot — E1

**Status:** Complete  
**Location:** `src/lib/platform/copilot/`  
**ECC surface:** `/exec/ask` (Ask JAG)

## Principle

JAG becomes an **executive reasoning system**, not only a dashboard.

Every recommendation answers:

1. What happened?
2. Why did it happen?
3. Why does it matter?
4. What should I do?
5. Why now?
6. What are the alternatives?
7. What are the risks?
8. How confident are we?

**No hallucinated evidence.** Connector links that are offline are explicitly marked ungrounded.

## Architecture (composition only)

```
Connected systems
  AcademyOS → QuickBooks → Square → Plaid → Google Workspace
        ↓
Existing intelligence (wisdom, opportunity, predictive, OIOS, …)
        ↓
Executive Copilot (conversation + recommendation + evidence + simulator)
        ↓
Ask JAG / Morning brief
```

**Does not:** create intelligence domains, modify the OIOS graph, or change connector architecture.

## Package layout

| Path | Role |
|------|------|
| `types.ts` / `contracts.ts` | DTOs + engine contract |
| `context/connectors.ts` | Feed → connector snapshots |
| `evidence/chain.ts` | Canonical evidence chain |
| `recommendation/framework.ts` | Eight-question + explainability |
| `conversation/*` | Intent routing, session memory, engine |
| `brief/morning.ts` | Automatic morning brief |
| `simulator/*` | “What happens if…” catalog + builder |
| `orchestrator.ts` | Public `createCopilotEngine` |

ECC wiring: `src/lib/exec/load-ask.ts` → `src/app/exec/ask/`.

## Conversation modes

Daily Brief · Ask Anything · Explain Recommendation · Scenario Analysis · Compare Options · Why? · Why Not? · What Changed? · Show Evidence · Summarize This Week / Month · Prepare Board Meeting · Decision Simulator

## Recommendation fields

Executive Summary · Evidence · Supporting systems · Confidence · Trade-offs · Alternatives · Financial / Human / Risk / Ethical / Long-term impact · Suggested action · Expected outcome · Evidence chain · Explainability bundle

## Evidence chain

Ordered and required:

`AcademyOS → QuickBooks → Square → Plaid → Google Workspace → Intelligence Domains → Reasoning → Recommendation`

## Explainability

Explain → Show evidence → Show assumptions → Show calculations → Show confidence → Show alternatives

## Session memory

Within a session: organization, executive role, recent questions, current decisions, pending actions.

## Decision simulator

Reuses **predictive** + **wisdom** (no new domains):

- Raise tuition 5%
- Delay hiring
- Add a new campus
- Reduce expenses
- Increase salaries
- Custom “what if…”

## Example

**Q:** Why is cash down this month?

**Flow:** Analyze QuickBooks + Plaid + Square (+ forecast) → produce evidence-backed explanation with confidence, alternatives, and risks.

## Validation

```bash
npx tsc --noEmit
npm test
npm run build
```
