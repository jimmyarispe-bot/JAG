# Plaid Production Connector — D4

**Status:** Complete  
**Location:** `src/lib/platform/integrations/connectors/plaid/`  
**Contract:** Shared `Connector` via Integration Platform + Management  

## Principle

Plaid remains the banking connectivity provider.  
Financial institutions remain systems of record.  
JAG synchronizes, normalizes, validates, caches, reconciles, and reasons — it does not replace bank ledgers.

## Authentication (Plaid Link)

| Capability | Support |
|------------|---------|
| Plaid Link | `createLinkToken` + `exchangePublicToken` |
| Sandbox | `environment: "sandbox"` |
| Development | `environment: "development"` |
| Production | `environment: "production"` |
| Institution selection | Institutions listed at authenticate; `institutionId` on config |
| Token refresh / Item reconnect | `refreshToken()` |
| Disconnect / reconnect | `disconnect()` clears cache; resume + authenticate + sync restores |

Helpers: `plaidLinkConfig()`, `PLAID_LINK_PRODUCTS`.

## Entities synchronized

| Domain | Object types |
|--------|----------------|
| Institutions | institution (+ connection status) |
| Accounts | checking, savings, credit cards, loans, lines of credit |
| Transactions | deposits, withdrawals, ACH, wires, checks, card |
| Transfers | inter-account transfers |
| Balances | available, current, pending |
| Liabilities | mortgages, student loans, auto loans, credit cards |
| Investments | holdings, securities, investment_performance |
| Identity | account owner |

## Normalization

Every accepted record includes:

- Internal JAG id (`jag_<type>_<hash>`)
- External Plaid id
- `sourceSystem: "plaid"`
- Sync timestamp
- Version
- Organization id
- Institution id
- Account id (when applicable)

## Pagination & monitoring

`list()` returns `{ records, nextCursor }`. Connector walks pages per object type.

Store monitoring (Integration Center):

- Last sync / duration
- Institution health
- API latency
- Accounts / transactions imported
- Failures / retry count
- Link expiration
- Overall health

## Live / Cached / Synthetic

`ensurePlaidSynced()` returns `{ snapshot, freshlySynced }`.

ECC uses `plaidDataMode()` → **Live** on fresh sync, **Cached** when store already has data, **Synthetic** / model-baseline when no Plaid feed.

## Intelligence mapping (no new domains)

`intelligence-feed.ts` soft lights for existing domains only:

| Feed signal | Domains |
|-------------|---------|
| Available / current cash / working capital | financial |
| Liquidity / burn / forecast | predictive, resilience |
| Brief bullets + timeline | executive / wisdom soft inputs |
| Health blend | health |

## Cross-system cash reconciliation

When Plaid is connected with Square and/or QuickBooks, `reconcilePlaidCash()` compares:

- Square deposits → bank merchant deposits
- QuickBooks cash accounts → bank balances
- Outstanding / missing / duplicate deposits
- ACH timing
- Returned payments
- Bank fees
- Merchant deposit labeling

Surfaced in Executive Brief, Home finance / timeline, and Risk Center.

## ECC widgets driven by Plaid

Cash position, available cash, working capital, burn rate, liquidity, bank balances, cash forecast, treasury, executive brief, timeline — prefer Plaid banking data when present; badges show Live / Cached / Synthetic.

## Tests

`tests/unit/integrations/plaid/connector.test.ts`

## Docs

- This file
- `docs/product/D4_IMPLEMENTATION_SUMMARY.md`
