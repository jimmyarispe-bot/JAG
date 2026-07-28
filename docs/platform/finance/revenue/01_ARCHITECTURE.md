# JAG Revenue™ & Payables™ — Architecture (P-011)

## Purpose

Complete the **operational accounting cycle** on top of P-008–P-010:

- Purchasing → receiving → AP bills → vendor payments  
- Contracts / subscriptions → billing → AR → collections → revenue recognition  

## Canonical model

`FinanceEngine` remains the single financial model.  
`RevenueEngine` and `PayablesEngine` are operational facades — they write foundation invoices, bills, payments, vendors, and customers.

```text
FinanceEngine
├── treasury (P-009)
├── reconciliation (P-010)
├── revenue (P-011)      → RevenueEngine
└── payablesOps (P-011)  → PayablesEngine
```

## Packages

| Path | Role |
|------|------|
| `packages/platform/finance/revenue/` | Contracts, billing, AR, collections, recognition, portal |
| `packages/platform/finance/payables/` | Purchasing, POs, receiving, AP payments, 1099 |
| `packages/platform/finance/operations/events.ts` | Twin + Evidence + Memory sinks |

## Guards

No financial statements, forecasting, EBITDA, or AI CFO in this sprint.

## AcademyOS

Tuition, scholarships, grants, ESA, vouchers, etc. are **configurable funding sources** — not hardcoded education workflows. AcademyOS must consume these engines.
