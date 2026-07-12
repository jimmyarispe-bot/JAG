# Executive Decision Intelligence — Architecture

**Sprint:** 026  
**Package:** `src/lib/platform/intelligence/executive-decision/`  
**Version:** `0.1.0`

## Purpose

Enable executives to ask “what if?” against a live organizational reasoning graph and receive actionable recommendations with evidence, multi-dimensional impact, risks, dependencies, and confidence.

## Layering

```
Sprint 012 Decision Intelligence (domain resolver)
        ↑ complementary (pipeline domain) — not replaced

Sprint 026 Executive Decision Intelligence
        ↑ consumes
Sprint 025 Executive Graph Analyzer
        ↑ consumes signals from
Financial · Founder · Executive · Organization Health
```

## Pipeline

1. **Resolve graph context** — use provided `graph`/`analysis`, or `buildAndAnalyze(graphInput)`
2. **Derive baseline** — enrollment, revenue, payroll, health, risk/opportunity
3. **Simulate scenarios** — apply shocks → ImpactForecast → optional TradeoffAnalyzer / StrategyEngine
4. **Generate recommendations** — map simulations (+ graph recommendations) into full recommendation DTOs
5. **Project** — flatten for briefing / UI
6. **Record history** — in-memory audit trail

## Recommendation contract

```ts
interface ExecutiveDecisionRecommendation {
  executiveSummary: string;
  supportingEvidence: DecisionEvidenceItem[];
  financialImpact: FinancialImpact;
  operationalImpact: OperationalImpact;
  missionImpact: MissionImpact;
  risks: DecisionRiskItem[];
  dependencies: DecisionDependencyItem[];
  confidenceScore: DecisionConfidenceScore;
  // ...
}
```

## Determinism

- Pure shock application and scoring (no LLM)
- Injectable `now` / `createId` for tests
- Graph analysis confidence blended into decision confidence

## Extension points

| Hook | Use |
|------|-----|
| `buildAndAnalyze` | Custom graph stack |
| `simulator` / `recommendations` / `strategy` | Override engines |
| `history` / `scenarioRepository` | Swap persistence |
| `createPresetScenario` | Add org-specific presets |

## Circular import policy

- `contracts.ts` and `types.ts` are leaves (no implementation imports)
- Implementations may import contracts/types/models/scoring
- Package may import `executive-graph` types + factory
- `executive-graph` must not import `executive-decision`
