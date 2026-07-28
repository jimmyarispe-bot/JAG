# 06 — Reporting & Planning API

## Reporting

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/finance/reporting/statements` | List / generate statements |
| GET/POST | `/api/finance/reporting/dashboard` | List / build dashboards |
| POST | `/api/finance/reporting/trial-balance` | Generate trial balance |
| GET/POST | `/api/finance/reporting/variance` | List / compute variance |

### Statement POST body

```json
{
  "organizationId": "org.1",
  "kind": "income_statement",
  "periodKey": "2026-07",
  "scope": "consolidated",
  "dimensionFilters": { "campus": "north" },
  "comparative": true,
  "comparePeriodKey": "2026-06"
}
```

## Planning

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/finance/planning/budgets` | List / create / version budgets |
| GET/POST | `/api/finance/planning/forecasts` | List / create forecasts |
| GET/POST | `/api/finance/planning/scenarios` | List / create / compare scenarios |

### Budget version

```json
{
  "organizationId": "org.1",
  "action": "version",
  "budgetId": "pbud:…",
  "lines": [{ "accountId": "…", "amount": 12000 }]
}
```

## Programmatic

```ts
import {
  createFinanceEngine,
  createFinancialReportingEngine,
  createFinancialPlanningEngine,
} from "@finance";

const finance = createFinanceEngine();
const reporting = finance.reportingOps; // or createFinancialReportingEngine()
const planning = finance.planning;      // or createFinancialPlanningEngine()
```
