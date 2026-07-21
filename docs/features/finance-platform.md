# Finance, Billing & Revenue Platform

AcademyOS RC7 — financial operations platform for tuition, invoices, payments, scholarships, discounts, payment plans, aging, refunds, reporting, and future accounting integrations.

Built on the existing Release-6 billing foundation (`family_billing_accounts`, `invoices`, `payments`, `tuition_plans`, `payment_plans`) without replacing SIS / portal finance surfaces.

## Architecture

| Layer | Location |
|-------|----------|
| Schema (RC7) | `supabase/migrations/194_finance_revenue_platform.sql` |
| Legacy foundation | Migrations `054`, `088`, `089`, `102` |
| Platform module | `src/lib/finance-platform/` |
| Existing actions | `src/lib/finance/actions.ts`, `tuition-engine.ts`, `queries.ts` |
| Dashboard | `/dashboard/finance` (Operations default + legacy tabs) |
| Payment adapters | Square / Stripe via Workflow extension API |
| Accounting adapters | QuickBooks Online, Xero, NetSuite, Sage (stubs) |

```
Enrollment / Tuition plan
        │
        ▼
 Family financial account
        │
        ├── Invoice (draft → sent → partial → paid / overdue / voided)
        ├── Scholarships / discounts / credits
        ├── Payment plans → installments
        ├── Payments (cash, check, ACH, card, scholarship, grant, credit)
        └── Aging + refunds + EI + Communications + Workflows
```

## Financial model

### Family accounts (`family_billing_accounts`)

First-class account fields:

- Account number  
- Primary responsible party  
- Current balance / available credits  
- Payment plan link  
- Status  
- Aging bucket  
- **audit_id**

### Tuition engine

Supports billing models: **monthly · quarterly · annual · per-course · one-time**.

`calculateEnrollmentCharges` / `generateTuitionInvoiceFromPlan` compute period charges from enrollment plans and apply sibling / scholarship / state funding credits.

### Invoices

Statuses: draft, pending, sent, partially paid, paid, overdue, voided, archived.

Lifecycle: create, edit (draft/pending), void, duplicate, archive, delete (policy-controlled unlocked drafts only).

### Payments

Methods: cash, check, ACH, credit card, scholarship, grant, credit balance, manual adjustment.

Card/ACH charges go through deferred Square / Stripe adapters (`chargeViaProvider`).

### Scholarships

`applyScholarshipToInvoice` integrates with `scholarship_applications`, decrements `remaining_award_balance`, prevents over-allocation, supports multiple awards per student.

### Discounts

Rules: sibling, staff, promotional, manual, percentage, flat — with stacking priority / allows_stacking.

### Payment plans

Installment generation (monthly or custom due dates) into `payment_plan_installments`.

### Credits & refunds

Refund queue (`billing_refunds`): requested → approved / rejected → completed.  
Credits land on account `credit_balance` + `billing_credits`.

### Aging

Buckets: Current, 30, 60, 90, 120+.  
Computed live and optionally snapshotted to `billing_aging_snapshots`.

## Permissions

| Role | Access |
|------|--------|
| Founder / CEO | Full |
| Finance (`FINANCE_ACCESS` / `finance.billing`) | All financial records |
| School Leader | School financial reporting |
| Parents | Own family account (portal) |
| Teachers | No financial access |
| Students | No financial access |

Helpers: `canViewFinance`, `canEditFinance`, `canManageAllFinance`, `canViewSchoolFinanceReporting`.

## Revenue lifecycle

1. Ensure family financial account  
2. Generate tuition invoice from plan / enrollment  
3. Apply scholarships & discounts  
4. Send invoice → Communications + EI  
5. Collect payment → ledger + EI + reminder fan-out  
6. Age open balances / escalate overdue via workflows  
7. Refunds / credits with audit trail  

## Workflow integration

| Action | Effect |
|--------|--------|
| `generate_invoice` | Tuition invoice from plan |
| `apply_scholarship` | Apply award to invoice |
| `send_billing_reminder` | Communications queue |
| `mark_invoice_paid` | Manual settlement |
| `issue_refund_request` | Refund queue |
| `escalate_overdue_account` | Mark overdue + notify |

Triggers cover invoice/payment/account/scholarship/discount/refund events.

## Communications

Automatic fan-out via `platform_communications`:

- Invoice created  
- Payment received  
- Payment overdue  
- Scholarship applied  
- Refund processed  
- Payment plan reminder  

## Executive Intelligence events

| Event | When |
|-------|------|
| `finance.account.created` | Family account created |
| `invoice.created` / `invoice.sent` | Invoice lifecycle |
| `invoice.paid` / `invoice.overdue` | Settlement / aging |
| `payment.received` / `payment.failed` | Payment outcomes |
| `scholarship.applied` | Award applied to invoice |
| `discount.applied` | Discount application |
| `refund.created` / `refund.completed` | Refund queue |

Feeds Timeline, Knowledge Graph, Forecasting, and revenue dashboards via `recordActivity`.

## Extension interfaces

**Payments (deferred):** Square, Stripe  
**Accounting (deferred):** QuickBooks Online, Xero, NetSuite, Sage  

No live gateway or GL sync in RC7.

## Reports

Operations dashboard + `buildFinanceReports`:

- Revenue  
- Aging  
- Scholarships  
- Collections  
- Outstanding balance  
- Cash received  
- Projected revenue  

## API

Server actions in `src/lib/finance/actions.ts` (legacy create/record flows) and
`src/lib/finance-platform/server-actions.ts` (void, archive, delete, scholarships,
discounts, refunds, installments, aging snapshots).

## Security

Finance surfaces remain gated by `FINANCE_ACCESS` / `requireFinanceAccess()` on
`/dashboard/finance`. Teachers and students are denied by `canViewFinance`.
Parents use portal family finance only.

## Acceptance (RC7)

- Family financial accounts are first-class  
- Tuition engine supports multiple billing models  
- Invoice lifecycle follows CRUD Standard  
- Multi-type payments + provider stubs  
- Scholarships auto-apply with over-allocation guards  
- Discounts + payment plans operational  
- Aging + reporting implemented  
- Workflow + EI + Communications wired  
- Accounting extension interfaces only  
- Existing finance / portal functionality intact  
