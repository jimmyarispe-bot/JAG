# Financial Intelligence Connectors

**Sprint:** 077  
**Package:** `src/lib/platform/integrations/connectors/finance/`  
**Catalog ids:** `quickbooks`, `stripe`, `square`, `plaid`  
**Versions:** QuickBooks/Plaid/Stripe `1.0.0`, Square `1.1.0` (all non-placeholder)

## Mission

Normalize accounting, payments, commerce, and banking systems into shared financial canonical entities, build a **Financial Knowledge Graph**, and feed Accounting / Finance / Forecasting / Executive Brief / Portfolio / Digital Twin soft signals — plus ECC widgets for cash, revenue, burn, AR/AP, and subscriptions.

> Existing B4 production connectors under `connectors/quickbooks`, `connectors/square`, and `connectors/plaid` remain the SoR sync path for those vendors. This package adds Platform Core connectors, a unified finance store, KG/ECC layers, and promotes **Stripe** from placeholder to production.

## Package structure

```
finance/
├── quickbooks/            # customers, vendors, bills, invoices, payments, accounts
├── stripe/                # customers, payments, refunds, subscriptions
├── square/                # transactions, orders, catalog, customers
├── plaid/                 # accounts, transactions, balances, cash flow
├── mapping/               # canonical types + knowledge graph
├── normalization/
├── services/              # store, demo client, PlatformConnector factory
├── intelligence/          # financial graph, ECC widgets, executive feed
├── b4-connector.ts        # Stripe (and optional) B4 adapter
├── registry.ts
└── index.ts
```

## Knowledge Graph kinds

Financial Transaction · Customer · Vendor · Account · Payment · Invoice · Subscription

Node ids: `fin:{Kind}:{externalId}`.

## ECC widgets

| Widget kind | UI |
|-------------|----|
| `cash_position` | `CashPosition` |
| `revenue` | `Revenue` |
| `burn_rate` | `BurnRate` |
| `receivables` | `Receivables` |
| `payables` | `Payables` |
| `subscriptions` | `Subscriptions` |

Builders: `buildFinanceEccWidgets`, `buildFinancialGraph`, `buildFinanceExecutiveFeed`.

## Registration

```ts
import {
  createIntegrationPlatformCore,
  registerFinancePlatformConnectors,
  buildFinanceEccWidgets,
  buildFinanceExecutiveFeed,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
registerFinancePlatformConnectors(platform);
await platform.syncNow("quickbooks", "quickbooks-org-finance-demo", "full");
await platform.syncNow("stripe", "stripe-org-finance-demo", "full");
await platform.syncNow("square", "square-org-finance-demo", "full");
await platform.syncNow("plaid", "plaid-org-finance-demo", "full");

const widgets = buildFinanceEccWidgets("exec-demo-org");
const feed = buildFinanceExecutiveFeed("org-finance-demo");
```

Also registered via `createOiosOperatingSystem()` and B4 `registerAllConnectors` (Stripe via `createFinanceB4Connector`).
