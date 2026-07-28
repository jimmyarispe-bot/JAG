# 06 — JAG CFO™ API

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/cfo/analysis` | Metric defs / financial analysis |
| GET/POST | `/api/cfo/ebitda` | Adjustments + EBITDA compute |
| GET/POST | `/api/cfo/runway` | Cash runway |
| GET/POST | `/api/cfo/valuation` | Valuation approaches |
| GET/POST | `/api/cfo/qoe` | Quality of earnings |
| GET/POST | `/api/cfo/scenarios` | Scenario analysis |
| GET/POST | `/api/cfo/recommendations` | Recommendation engine |
| GET/POST | `/api/cfo/board` | Board pack |
| GET/POST | `/api/cfo/assistant` | Conversational CFO |

## Programmatic

```ts
import { createChiefFinancialOfficerEngine } from "@cfo";

const cfo = createChiefFinancialOfficerEngine();
const snap = cfo.evaluateMetrics({ organizationId, periodKey: "2026-07" });
const ebitda = cfo.computeEbitda({ organizationId, userId, periodKey: "2026-07" });
const answer = cfo.ask({ organizationId, userId, question: "How much cash runway do we have?" });
```
