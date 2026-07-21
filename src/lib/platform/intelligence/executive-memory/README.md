# Executive Memory Intelligence (Sprint 063)

**Version:** 0.1.0  
**Module id:** `executive-memory`  
**Package:** `src/lib/platform/intelligence/executive-memory/`

> Path note: Sprint 009 already owns `intelligence/memory/`. This domain uses
> `executive-memory` so that package stays frozen.

## Purpose

Persist executive reasoning as structured, relational memory — decisions, briefs,
risks, opportunities, initiatives, outcomes, and lessons — so JAG can recall and
improve over time.

## Quick start

```ts
import { createExecutiveMemoryIntelligence } from "@/lib/platform/intelligence/executive-memory";

const { service } = createExecutiveMemoryIntelligence();
const result = service.build({
  requestId: "mem-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  briefingResult: { /* BriefingResultLight */ },
});

const recall = service.recall({ text: "staffing", kinds: ["risk", "decision"] });
```

## Pipeline

```
Wisdom → Synthesis → Briefing → Executive Memory
```

## Docs

See [docs/intelligence/executive-memory.md](../../../../../docs/intelligence/executive-memory.md).
