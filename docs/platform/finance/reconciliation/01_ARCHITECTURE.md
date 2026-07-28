# JAG Reconciliation™ — Architecture (P-010)

## Purpose

Convert imported financial activity into **verified accounting records** through matching, exception handling, adjustments, approvals, and period close.

Out of scope: financial statements, forecasting, EBITDA, AI CFO.

## Package layout

```
packages/platform/finance/reconciliation/
  engine/          → ReconciliationEngine (engine.ts)
  matching/        confidence-scored candidate generation
  rules/           tolerances & weights
  exceptions/      exception lifecycle
  suggestions/     review queue
  workflows/       auto/manual match, adjustments, close
  approvals/       reconciler → CFO stages
  periods/         open / attach statement
  history/         full audit trail
  analytics/       status & rates
  events.ts        Digital Twin signal source
```

## Engines

| Engine | Role |
|--------|------|
| `FinanceEngine.reconciliation` | Access from finance facade |
| `ReconciliationEngine` | Period → match → approve → close |

## Digital Twin integration

Every material reconciliation action publishes standardized signals:

- `reconciliation.period_opened`
- `reconciliation.auto_matched`
- `reconciliation.manual_match`
- `reconciliation.exception_created`
- `reconciliation.adjustment_posted`
- `reconciliation.period_closed`

Subscribers (`subscribeSignals`) enable Risk, Performance, Innovation, and Mr. JAG to react without coupling to Finance internals.

## Guards

`RECONCILIATION_GUARDS` asserts reconciliation-only scope and Digital Twin signal source readiness.
