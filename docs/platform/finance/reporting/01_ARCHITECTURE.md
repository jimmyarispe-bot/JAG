# 01 — Financial Reporting & Planning Architecture (P-012)

## Purpose

P-012 adds the **financial reporting and planning layer** on top of the canonical **FinanceEngine**. It prepares data structures and services that **JAG CFO™ (P-013)** will reason over.

## Rules

1. **FinanceEngine remains the only financial model.**
2. Reporting **consumes** ledger, AP/AR, treasury, revenue, and payables — it does not duplicate them.
3. Planning **consumes** FinanceEngine budgets/accounts — it does not create a second ledger.
4. Every figure is drill-down ready to source journals / invoices / bills.
5. Every report, budget, forecast, scenario, and variance publishes to Digital Twin, Evidence Ledger, and Organizational Memory via `publishOperationalFinanceEvent`.

## Packages

```
packages/platform/finance/reporting/
  financial-statements/   # BS, IS, CF, equity, TB, GL, activity
  general-reporting/      # scope helpers
  dashboards/             # executive / finance / dept / …
  executive-kpis/         # KPI pack (EBITDA placeholder only)
  variance/               # budget/forecast/prior comparisons
  dimensions/             # unlimited reporting dimensions
  exports/                # PDF/Excel/CSV/JSON/API placeholders
  foundation.ts           # P-008 dashboard + TB hint
  engine.ts               # FinancialReportingEngine

packages/platform/finance/planning/
  budgets/ forecasts/ scenarios/
  planning-model/ allocations/ assumptions/
  engine.ts               # FinancialPlanningEngine
```

## Engines

| Engine | Role |
|--------|------|
| `FinanceEngine` | Canonical model; exposes `.reportingOps` and `.planning` |
| `FinancialReportingEngine` | Statements, variance, KPIs, dashboards, dimensions, exports |
| `FinancialPlanningEngine` | Budgets, forecasts, scenarios, assumptions, allocations |

## Out of scope (P-013)

AI CFO · EBITDA calculations · cash runway · valuation · QoE · board narrative · conversational finance · financial recommendations.
