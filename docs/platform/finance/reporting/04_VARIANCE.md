# 04 — Variance Analysis

## Modes

| Mode | Baseline | Actual |
|------|----------|--------|
| `budget_vs_actual` | Budget lines | Ledger balances |
| `forecast_vs_actual` | Forecast line amounts | Ledger balances |
| `prior_year` | Prior year period | Current period |
| `prior_period` | Compare period key | Current period |

## Metrics

Each row includes:

- `baseline` / `actual`
- `dollarVariance` (actual − baseline)
- `percentVariance` (null when baseline is 0 and actual ≠ 0)

## Events

`finance.variance_computed` → Digital Twin · Evidence Ledger · Organizational Memory.

## API

`POST /api/finance/reporting/variance`
