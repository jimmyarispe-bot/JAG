# Square Production Connector — D3

**Status:** Complete  
**Location:** `src/lib/platform/integrations/connectors/square/`  
**Contract:** Shared `Connector` via Integration Platform + Management  

## Principle

Square remains the payment and commerce system of record.  
JAG synchronizes, normalizes, validates, caches, reconciles, and reasons — it does not replace Square POS / payments CRUD.

## Authentication

| Capability | Support |
|------------|---------|
| OAuth 2.0 | Yes (`authMethods: ["oauth2"]`) |
| Sandbox | `environment: "sandbox"` → `connect.squareupsandbox.com` |
| Production | `environment: "production"` → `connect.squareup.com` |
| Merchant selection | Merchants listed at authenticate; `merchantId` stored on config |
| Token refresh | `refreshToken()` via Square client |
| Disconnect / reconnect | `disconnect()` clears cache; resume + authenticate + sync restores |
| Connection health | `healthCheck()` + remote latency / rate-limit remaining |

Helpers: `squareOAuthConfig()`, `SQUARE_OAUTH_SCOPES`.

## Entities synchronized

| Domain | Object types |
|--------|----------------|
| Payments | payment, refund, deposit, fee, tip, tax |
| Customers | customer, customer_group |
| Orders | order, order_line_item |
| Catalog | catalog_item, catalog_category, catalog_variation |
| Invoices | draft / open / paid / overdue |
| Subscriptions | active / cancelled / renewing |
| Gift cards | balances, purchases, redemptions |
| Team | employee |
| Locations | location, device, register |

## Normalization

Every accepted record includes:

- Internal JAG id (`jag_<type>_<hash>`)
- External Square id
- `sourceSystem: "square"`
- Sync timestamp
- Version
- Organization id
- Merchant id
- Location id (when applicable)

## Pagination & monitoring

Demo/client `list()` returns `{ records, nextCursor }`. Connector walks pages per object type.

Store monitoring (Integration Center):

- Last sync / duration
- API latency
- Records imported
- Failures / retry count
- Token expiration
- Health
- Webhook status
- Last payment imported

## Live / Cached / Synthetic

`ensureSquareSynced()` returns `{ snapshot, freshlySynced }`.

ECC uses `squareDataMode()` → **Live** on fresh sync, **Cached** when store already has data, **Synthetic** / model-baseline when no Square feed.

## Intelligence mapping (no new domains)

`intelligence-feed.ts` soft lights for existing domains only:

| Feed signal | Domains |
|-------------|---------|
| Payment volume / deposits / fees / refunds | financial, revenue |
| Customers / LTV / groups | customer |
| Open invoices / MRR / catalog / top products | opportunity |
| Active subs / daily sales / revenue forecast | predictive |
| Brief bullets + timeline | executive / wisdom soft inputs |
| Health blend | health |

## Cross-system reconciliation

When both Square and QuickBooks have synced data, `reconcileSquareQuickBooks()` compares:

- Square deposits vs QuickBooks deposits
- Square payments vs QuickBooks payment receipts / invoices
- Square refunds vs QuickBooks credit memos
- Revenue timing (latest payment days)
- Missing postings
- Duplicate QB payment amounts

Surfaced in:

- Executive Brief (`load-brief.ts`)
- Risk Center financial category (`load-risks.ts`)
- Home finance / timeline / risks (`load-home.ts`)

## ECC widgets driven by Square

Revenue today, daily sales, cash flow, payment / refund trends, customer growth, top products, executive brief, timeline, opportunity center, revenue forecast — prefer Square commerce data when present; badges show Live / Cached / Synthetic.

## Tests

`tests/unit/integrations/square/connector.test.ts` — auth, normalize, sync, pagination, refunds, reconciliation, retry/error paths.

## Docs

- This file
- `docs/product/D3_IMPLEMENTATION_SUMMARY.md`
