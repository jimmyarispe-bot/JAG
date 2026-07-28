# JAG Treasury™ & Banking — Architecture (P-009)

## Purpose

Operational banking and treasury for **how money enters, leaves, and moves** through the organization.

This layer is **not**:

- AI CFO
- Forecasting
- Financial analysis / EBITDA
- Bank reconciliation (matching infrastructure only)

## Package layout

```
packages/platform/finance/banking/
  connections/   institutions/   accounts/
  transactions/  statements/     imports/   exports/
  treasury/      cash/           payments/  transfers/
  rules/         matching/       exceptions/
  security/      notifications/
  engine.ts      facade.ts       store.ts   types.ts
```

## Engines

| Engine | Role |
|--------|------|
| `FinanceEngine` | P-008 ledger, AP/AR, budgets; exposes `treasury` (`TreasuryEngine`) |
| `TreasuryEngine` | P-009 connections, transactions, imports, transfers, cash, rules, matching |

## Data stores

- Finance store: bank accounts, legacy statement imports, simple transfers
- Banking store: institutions, connections, transactions, import batches, transfer requests, rules, matches, exceptions, notifications, policies

## Guards

`TREASURY_GUARDS` asserts operational scope and explicitly disables reconciliation, forecasting, AI CFO, and EBITDA.
