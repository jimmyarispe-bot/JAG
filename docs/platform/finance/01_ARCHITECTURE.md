# JAG Finance™ Foundation — Architecture (P-008)

JAG Finance™ is the **canonical financial operating model** for the Organizational Intelligence Operating System. It is not a thin “accounting module.” All later financial intelligence (CFO™, forecasting, cash runway, EBITDA, board reporting, AI reasoning) **must** use this model.

## Package

`packages/platform/finance/` (`@finance`) · `FinanceEngine`

## In scope (foundation)

Multi-entity · Chart of accounts · General ledger · Banking imports · Vendors/Customers · Payables/Receivables · Treasury transfers · Budgets · Attachments · Audit · Permissions

## Explicitly out of scope (later)

- Bank reconciliation  
- AI CFO / conversational finance  
- Forecasting engines  
- EBITDA / QoE / valuation  

## Guards

```ts
FINANCE_FOUNDATION_GUARDS.includesReconciliation // false
FINANCE_FOUNDATION_GUARDS.includesAiCfo          // false
FINANCE_FOUNDATION_GUARDS.includesForecasting    // false
FINANCE_FOUNDATION_GUARDS.includesEbitda         // false
```
