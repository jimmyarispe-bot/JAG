# Reconciliation APIs

Base: `/api/finance/reconciliation`

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/open` | List/open periods; optional auto-match bootstrap |
| GET/POST | `/match` | Auto/manual match, suggestions |
| GET/POST | `/exceptions` | Exceptions + adjustments |
| GET/POST | `/approve` | Stage approvals + finalize |
| POST | `/close` | Close or reopen |
| GET | `/history` | Audit trail + Digital Twin signals + analytics |

## Engine entry

```ts
import { createReconciliationEngine, createFinanceEngine } from "@finance";

const recon = createReconciliationEngine();
// or
createFinanceEngine().reconciliation.openPeriod({ ... });

recon.subscribeSignals((e) => {
  // Digital Twin / Risk / Performance / Innovation / Mr. JAG
});
```
