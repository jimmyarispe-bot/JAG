# Executive Synthesis Intelligence (Sprint 061)

**Version:** 0.1.0  
**Module id:** `synthesis`  
**Codename:** Executive Synthesis Intelligence

## Purpose

Reasoning layer above every existing intelligence domain. It does not duplicate Finance, HR, Operations, or Wisdom — it correlates their *outputs* into explainable, prioritized executive understanding.

## Quick start

```ts
import { createSynthesisIntelligence } from "@/lib/platform/intelligence/synthesis";

const { service } = createSynthesisIntelligence({
  createId: (p) => `${p}-1`,
  now: () => new Date("2026-07-18T12:00:00.000Z"),
});

const result = service.build({
  requestId: "syn-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  signals: [
    { domain: "finance", score: 42, direction: "down", narrative: "Cash declining" },
    { domain: "human-capital", score: 38, direction: "down", narrative: "Teacher vacancies up" },
    { domain: "customer", score: 45, direction: "down", narrative: "Enrollment slowing" },
  ],
});

console.log(result.brief.executiveSummary);
console.log(result.insights[0].rootCause.likelyCause);
```

## Capabilities

1. Cross-domain correlation  
2. Root-cause analysis (cause, evidence, confidence, alternatives)  
3. Executive prioritization (severity, urgency, impacts, horizon)  
4. Opportunity detection  
5. Recommendations with expected impact  
6. Contradiction detection  
7. Trend windows (daily → YoY)  
8. Executive Brief model  
9. Explainability on every insight  

## Extensibility

Register plug-in analyzers without modifying the engine:

```ts
engine.registerAnalyzer({
  id: "campus-florida",
  name: "Florida Campus Analyzer",
  version: "0.1.0",
  analyze(ctx) {
    return { correlations: [/* ... */] };
  },
});
```

## Docs

See [docs/intelligence/executive-synthesis.md](../../../../../docs/intelligence/executive-synthesis.md).
