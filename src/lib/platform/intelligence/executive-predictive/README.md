# Predictive Intelligence (Sprint 065)

**Module id:** `executive-predictive`  
**Package:** `src/lib/platform/intelligence/executive-predictive/`  
**Version:** 0.1.0

> Path is `executive-predictive` because Sprint 028 already owns `predictive-intelligence/` (module id `predictive`). Do not regenerate that package.

Transforms JAG from a reactive system into a predictive executive platform. Forecasts are advisory — not guarantees.

## Quick start

```ts
import { createExecutivePredictiveIntelligence } from "@/lib/platform/intelligence/executive-predictive";

const { service } = createExecutivePredictiveIntelligence();
const result = service.build({
  requestId: "pred-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  historicalSignals: [/* ... */],
});
```

## Docs

See [docs/intelligence/predictive-intelligence.md](../../../../../docs/intelligence/predictive-intelligence.md).
