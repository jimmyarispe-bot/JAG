# Revenue & Payables APIs

## Revenue

| Method | Path |
|--------|------|
| GET/POST | `/api/finance/revenue/contracts` |
| GET/POST | `/api/finance/revenue/invoices` |
| GET/POST | `/api/finance/revenue/payments` |
| GET/POST | `/api/finance/revenue/collections` |

## Payables

| Method | Path |
|--------|------|
| GET/POST | `/api/finance/payables/purchase-orders` |
| GET/POST | `/api/finance/payables/bills` |
| GET/POST | `/api/finance/payables/payments` |

## Engine entry

```ts
import { createFinanceEngine, createRevenueEngine, createPayablesEngine } from "@finance";

const finance = createFinanceEngine();
finance.revenue.createInvoice({ ... });
finance.payablesOps.createPurchaseOrder({ ... });
```
