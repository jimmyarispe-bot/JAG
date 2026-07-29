# Education Intelligence Planner

Builds an **execution plan** for Education cognitive contributors.

## Role

Given Intent + Context + contributor catalog, produce:

- Ordered contributor list  
- Dependency graph / stages  
- Skipped contributors + reasons  
- Expected outputs  

**Does not** execute contributors or run the Intelligence Graph.

## Usage

```ts
import { createEducationPlanner } from "@/lib/domains/education";

const planner = createEducationPlanner();
const { ok, plan, selections } = planner.plan({
  intent: {
    intentId: "education.enroll",
    domainHints: ["education"],
    actionCandidates: [],
    confidence: 1,
    source: "explicit",
    signals: [],
    conflicts: [],
    requiresClarification: false,
    resolvedAt: new Date().toISOString(),
  },
});

// Host runs plan.orderedContributorIds, then feeds results to the Graph.
```

## Docs

[`docs/domains/education/intelligence/05_INTELLIGENCE_PLANNER.md`](../../../../../docs/domains/education/intelligence/05_INTELLIGENCE_PLANNER.md)
