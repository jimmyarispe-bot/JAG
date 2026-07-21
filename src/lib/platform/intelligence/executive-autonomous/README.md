# Autonomous Intelligence (Sprint 066)

**Module id:** `executive-autonomous`  
**Package:** `src/lib/platform/intelligence/executive-autonomous/`  
**Version:** 0.1.0

Transforms Decision Intelligence recommendations into prepared execution plans.

> The system prepares. Humans approve. Nothing auto-executes.

## Quick start

```ts
import { createExecutiveAutonomousIntelligence } from "@/lib/platform/intelligence/executive-autonomous";

const { service } = createExecutiveAutonomousIntelligence();
const result = service.build({
  requestId: "auto-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  decisionResult: { /* DecisionIntelligenceResultLight */ },
  predictiveResult: { /* ExecutivePredictiveResultLight */ },
});
```

## Docs

See [docs/intelligence/autonomous-intelligence.md](../../../../../docs/intelligence/autonomous-intelligence.md).
