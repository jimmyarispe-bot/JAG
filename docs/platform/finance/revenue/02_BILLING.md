# Billing & Revenue

## Modes

Manual · Recurring · Milestone · Usage · Contract

## Contracts & subscriptions

Contracts carry kind (`fixed`, `milestone`, `subscription`, `usage`, `grant`, `district`, …), recognition basis, and optional `fundingSourceId`.

Subscriptions generate invoices via `billSubscription` / `billCustomer({ mode: "recurring" })`.

## Configurable funding sources

Kinds include `tuition`, `scholarship`, `grant`, `esa`, `voucher`, `district_contract`, `medicaid`, `therapy`, `transportation`, `meal`, plus `standard` / `custom`.

`seedEducationFundingPresets` installs education-oriented presets for tenants that need them — still metadata-configurable, never exclusive to AcademyOS.

## Customer portal

`customerPortal({ organizationId, customerId })` returns invoice history, payments, outstanding balance, payment link hint, and downloadable attachments.
