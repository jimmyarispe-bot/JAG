# Billing & Finance

AcademyOS billing — invoices, payments, and immutable financial records.

## Architecture

| Layer | Location |
|-------|----------|
| Finance / billing libs | `src/lib` finance modules |
| Dashboard | `/dashboard/finance` |

## Permissions

Finance and leadership roles. Parents may view own balances via portal where enabled.

## Data Model

Invoices and payments are **immutable** end-state records. Prefer void, write-off, and refund over delete.

## Workflows

- `invoice.created` / `billing.invoice_created`
- `payment.received` / `billing.payment_received`
- `billing.overdue`

## API

Finance server actions for invoice/payment flows. Extension points for Square / QuickBooks via Integration Hub (deferred adapters).

## Events

Registered in Activity / EI catalog for invoice and payment lifecycle.
