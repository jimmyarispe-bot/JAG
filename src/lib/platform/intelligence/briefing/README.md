# Executive Briefing Intelligence (Sprint 062)

**Version:** 0.1.0  
**Module id:** `briefing`  
**Depends on:** Executive Synthesis Intelligence (`synthesis`)

## Purpose

Transform synthesis outputs into an actionable executive briefing:

- What changed?
- What matters?
- What requires a decision?
- What should I do next?

Every card is actionable (Open Investigation, View Evidence, Assign Owner, Create Initiative, Schedule Review, Dismiss) via UX-003/004 ActionChip contracts.

## Quick start

```ts
import { createBriefingIntelligence } from "@/lib/platform/intelligence/briefing";

const { service } = createBriefingIntelligence();
const result = service.build({
  requestId: "br-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  role: "founder",
  greetingName: "Jimmy",
  synthesisResult: { /* SynthesisResultLight */ },
});

console.log(result.briefing.greeting);
console.log(result.briefing.sections.todaysFocus);
```

## Docs

See [docs/intelligence/executive-briefing.md](../../../../../docs/intelligence/executive-briefing.md).
