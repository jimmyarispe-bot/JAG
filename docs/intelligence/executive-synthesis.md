# Executive Synthesis Intelligence (Sprint 061)

**Version:** 0.1.0  
**Module id:** `synthesis`  
**Package:** `src/lib/platform/intelligence/synthesis/`  
**Status:** New domain — reasoning layer above existing intelligence

## Purpose

Executive Synthesis Intelligence is JAG’s cross-domain reasoning engine. It does **not** replace Finance, HR, Operations, Wisdom, or any peer package. It consumes their contract/light outputs and produces explainable executive understanding:

> “What does the organization mean?”

Isolated signals (revenue ↓, turnover ↑, complaints ↑) become synthesized narratives with root cause, priority, recommendations, and explainability.

## Architecture

```
Upstream domains (lights / contracts)
            │
            ▼
   SynthesisAnalyzerRegistry  ← plug-in analyzers
            │
            ▼
   SynthesisOrchestrator / ExecutionPipeline
     ingest → analyze → root_cause → score → recommend → brief → explain
            │
            ▼
   SynthesisResult + ExecutiveBrief
```

| Area | Path |
|------|------|
| Engine | `engine/synthesis-engine.ts`, `synthesis-orchestrator.ts`, `execution-pipeline.ts` |
| Analyzers | `analyzers/*` (correlation, contradiction, trend, opportunity, risk) |
| Root cause | `root-cause/*` |
| Recommendations | `recommendations/*` |
| Briefing | `briefing/*` |
| Scoring | `scoring/*` |
| Registry | `registry.ts` |

Hard DAG predecessor: **`wisdom`**. Soft-reads many upstream context keys without importing peer engines.

## Pipeline

1. **Ingest** — normalize `DomainSignalLight[]` (+ optional `WisdomResultLight`)
2. **Analyze** — run registered plug-in analyzers
3. **Root cause** — likely cause, evidence, alternatives, affected domains
4. **Score** — severity, urgency, confidence, business/financial/operational impact, strategic alignment, priority, time horizon
5. **Recommend** — actions, expected impact, effort, dependencies, risks
6. **Brief** — `ExecutiveBrief` for morning/overnight reuse
7. **Explain** — why, domains, confidence, supporting + contradictory evidence

## Analyzer registration

```ts
engine.registerAnalyzer({
  id: "my-analyzer",
  name: "My Analyzer",
  version: "0.1.0",
  analyze(ctx) {
    return { correlations: [/* ... */] };
  },
});
```

Future domains register analyzers without modifying the engine core.

## Scoring

Every insight includes:

| Score | Meaning |
|-------|---------|
| Severity | How bad the cluster is |
| Urgency | How soon action is needed |
| Confidence | Strength of evidence |
| Business / Financial / Operational Impact | Impact dimensions |
| Strategic Alignment | Relevance to strategy / wisdom |
| Priority | `critical` \| `high` \| `medium` \| `low` \| `informational` |
| Time Horizon | `immediate` \| `near_term` \| `medium_term` \| `long_term` |

## Explainability model

Every synthesized conclusion includes:

- **Why** the conclusion was reached
- **Contributing domains**
- **Confidence**
- **Supporting evidence**
- **Contradictory evidence** (when present)

Executives never see a naked conclusion.

## Executive Brief schema

`ExecutiveBrief` fields:

- `executiveSummary`
- `topRisks` / `topOpportunities`
- `decisionsNeeded` / `criticalAlerts`
- `emergingTrends` / `crossDomainCorrelations`
- `recommendedActions`
- `confidenceSummary` (`overall`, `byDomain`)
- `insights[]`
- `overnightSummary`
- `version` / `generatedAt` / `scope`

This is the foundation for Founder/CEO morning briefings (Sprint 062+).

## Example synthesized insight

**Inputs**

- Finance: cash declining  
- Human capital: teacher vacancies increasing  
- Customer: enrollment slowing  

**Output (narrative)**

Staffing instability is the most plausible shared driver linking instructional continuity, parent confidence, and financial / enrollment pressure — with priority scoring, recommended war-room actions, and full explainability.

## Extension guide

1. Keep peer packages frozen — soft-read lights only.
2. Add a `SynthesisAnalyzer` via `engine.registerAnalyzer` or DI options.
3. Register new OIOS/module ids only when introducing a new first-class domain.
4. Prefer extending analyzers/scoring over rewriting the orchestrator.

## Integration

- `INTELLIGENCE_MODULE_IDS` includes `synthesis`
- OIOS catalog: active, deps `["organization-dna", "wisdom"]`
- DI: `createSynthesisIntelligence()`, `createIntelligenceService().synthesis`
- Platform adapter: `infrastructure/modules/synthesis.ts` → `context.set("synthesis", result)`

## Validation

```bash
npx vitest run tests/unit/intelligence/synthesis.test.ts
npm run typecheck
npm run perf:audit
npm run perf:regression
```
