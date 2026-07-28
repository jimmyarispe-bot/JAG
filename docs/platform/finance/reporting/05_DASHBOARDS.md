# 05 — Dashboards & Executive KPIs

## Dashboard kinds

`executive` · `finance` · `department` · `program` · `campus` · `grant` · `project`

All dashboards are **drill-down ready** (`drillDownReady: true`) via statement source refs.

## Executive KPIs

Revenue · Expenses · Operating Margin · Net Income · Cash · AR · AP · Collections · Vendor Spend · Enrollment / Grant / Scholarship / Program revenue (from configurable funding sources) · Custom KPIs.

**EBITDA:** `ebitdaPlaceholder: null` only — no EBITDA calculation in P-012.

## Dimensions

Define any key (`campus`, `department`, `grant`, `teacher`, …). Nothing is hardcoded. Tag journals (or other records) with dimension values; statements accept `dimensionFilters`.

## Exports

Formats: `pdf` · `excel` · `csv` · `json` · `api`  
PDF/Excel are content placeholders suitable for downstream renderers; CSV/JSON are fully populated.

## API

`POST /api/finance/reporting/dashboard`
