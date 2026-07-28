# Security

## Roles

`read` · `create` · `approve` · `post` · `reconcile` · `close_period` · `financial_administrator` · `controller` · `cfo` · `auditor`

Higher roles imply lower capabilities (e.g. CFO implies post/approve/create/read).

## Audit

Every mutating action records: user, timestamp, previous value, new value, optional approval id.

## Governance awareness

Finance foundation is designed to sit under Organizational Constitution spending/approval rules (UOM). Constitution enforcement remains in `@organization` advice; Finance enforces financial role gates.
