# 01 — JAG CFO™ Architecture (P-013)

## What it is

JAG CFO™ is a **financial reasoning engine**. It is not an accounting system and not a dashboard. It continuously evaluates organizational financial health, opportunities, risks, trends, scenarios, and recommendations.

## What it consumes

- FinanceEngine (system of record)
- TreasuryEngine · RevenueEngine · PayablesEngine · ReconciliationEngine
- FinancialReportingEngine · FinancialPlanningEngine
- OrganizationEngine (context)
- Digital Twin · Evidence Ledger · Organizational Memory

## What it does not do

- Duplicate ledger / treasury / revenue calculations
- Duplicate reporting statement engines
- Modify accounting records (recommends only)

## Package layout

```
packages/platform/cfo/
  metrics/              # Canonical metric registry (sole calculation surface)
  analysis/ cash/ ebitda/ forecast/ runway/
  valuation/ quality-of-earnings/ risk/
  board/ recommendations/ scenario-analysis/
  benchmarks/ insights/ assistant/ events/
  engine.ts             # ChiefFinancialOfficerEngine
```

## Rule

**Never calculate financial values outside the canonical metric registry.** Downstream modules call `evaluateMetrics` / `metricValue`.
