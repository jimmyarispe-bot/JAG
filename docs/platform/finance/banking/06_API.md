# Banking & Treasury APIs

Base: `/api/finance/banking`

Legacy aggregate route remains at `/api/finance/banking` (P-008). Nested routes (P-009):

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/connections` | Institutions, connections, providers, rotation |
| GET/POST | `/accounts` | Treasury bank accounts |
| GET/POST | `/transactions` | Transactions, matches, exceptions |
| GET/POST | `/statements` | Import preview → validate → commit → rollback |
| GET/POST | `/transfers` | Transfer request / approve / execute |
| GET | `/cash` | Cash position, optional concentration plan, notifications |

All routes require a Platform session and `organizationId` (query for GET, body for POST).

## Engine entry

```ts
import { createTreasuryEngine, createFinanceEngine } from "@finance";

const treasury = createTreasuryEngine();
// or
const finance = createFinanceEngine();
finance.treasury.cashPosition(orgId);
```
