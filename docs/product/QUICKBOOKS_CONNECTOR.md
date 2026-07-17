# QuickBooks Online Production Connector — Sprint D2

**Status:** Complete  
**Location:** `src/lib/platform/integrations/connectors/quickbooks/`  
**Contract:** Shared `Connector` via Integration Platform + Management  

## Principle

QuickBooks Online remains the accounting system of record.  
JAG synchronizes, normalizes, validates, caches, and reasons — it does not replace QBO CRUD.

## Authentication

| Capability | Support |
|------------|---------|
| OAuth 2.0 | Yes |
| Sandbox / Production | `environment` setting |
| Company selection | Companies listed at authenticate; `companyId` on config |
| Token refresh | `refreshToken()` via client |
| Disconnect / reconnect | Clears store on disconnect; reconnect via Management |

Helpers: `quickbooksOAuthConfig()`, `QUICKBOOKS_OAUTH_SCOPES`.

## Entities synchronized

Company, accounts (chart + hierarchy + active/inactive), customers, vendors, items, invoices (draft/sent/paid/overdue), bills (open/paid/overdue), payments, bill payments, journal entries, expenses, deposits, transfers, credit memos, budgets, classes, locations, attachments.

## Normalization

Every accepted record includes:

- Internal JAG id (`jag_<type>_<hash>`)
- External QuickBooks id
- Organization id
- `sourceSystem: "quickbooks"`
- Sync timestamp
- Version
- Company id

## Intelligence mapping (no new domains)

Soft lights for: financial, executive/health, predictive, opportunity, wisdom inputs, systems, resilience.

## Monitoring

Store tracks last sync, duration, API latency, records imported, failures, retry count, token expiration, health, rate limits — visible via `/exec/integrations` health monitor rows.

## ECC data modes

Widgets use existing badge with:

- **Live** — fresh sync in this request  
- **Cached** — store already had normalized data  
- **Synthetic / model-baseline** — no QuickBooks feed  

QuickBooks owns accounting metrics (cash, AR/AP, EBITDA, budget vs actual) when present; Square remains payment POS; AcademyOS remains SIS/HRIS.

## Client

`createDemoQuickBooksClient()` ships production-shaped SoR data (including pagination). Swap in a live Intuit HTTP client implementing `QuickBooksClient` without changing the connector contract.

## Success criteria

Connect → authenticate (OAuth + company) → sync through Integration Management; ECC consumes live/cached QuickBooks financial signals without modifying intelligence packages, the OIOS graph, or ECC architecture.
