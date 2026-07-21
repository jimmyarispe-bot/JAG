# Decision Intelligence (Sprint 064)

**Version:** 0.1.0  
**Module id:** `decision-intelligence`  
**Package:** `src/lib/platform/intelligence/decision-intelligence/`

> Path note: Early cognitive `intelligence/decision` (DecisionResolver) stays frozen.
> This domain uses `decision-intelligence`.

## Purpose

Recommend — do not autonomously execute. Given an issue, generate multiple options,
score them transparently, surface trade-offs, and explain why the top option wins,
using Synthesis/Briefing context and Executive Memory history.

## Quick start

```ts
import { createDecisionIntelligence } from "@/lib/platform/intelligence/decision-intelligence";

const { service } = createDecisionIntelligence();
const result = service.build({
  requestId: "di-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  issue: {
    kind: "staffing",
    title: "Teacher shortage at Florida campus",
    domains: ["human-capital", "customer", "finance"],
  },
});
```

## Pipeline

```
Wisdom → Synthesis → Briefing → Executive Memory → Decision Intelligence
```

## Docs

See [docs/intelligence/decision-intelligence.md](../../../../../docs/intelligence/decision-intelligence.md).
