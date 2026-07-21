# Changelog (release quality cycle)

Product and platform changes tracked for maintainers. Module-level changelogs under `src/lib/platform/intelligence/*/CHANGELOG.md` remain domain-specific.

## [RC-6 quality cycle] — 2026-07

### RC-6.02 — Code quality

- Removed production `console.log` / `console.info` from critical paths.
- Replaced orchestrator TODOs with tracked GitHub issues.
- Shared configuration form fields extracted.
- Type hygiene: reduced avoidable `any` / `@ts-ignore` in authz overlay paths.

### RC-6.03 — Executive UI

- Executive nav limited to shipped routes; removed “Coming soon” stubs.
- Ask JAG → `/exec/ask`; `/exec/graph` redirects to Mission Control.
- Empty states for KPI / compliance / benchmarks; Mission Control loading UI.
- Admin stubs redirect to live Cloud / Integrations / Users.

### RC-6.04 — Security

- OAuth state HMAC-bound; callbacks bind user/org/permission.
- Hub sandbox/lab gated with `canManageIntegrationHub`.
- Config API organization access checks + audit.
- Credential rotate emits security audit events.
- Finance school scope via `requireActorSchool`.
- `/api/ready/deep` requires cron/ops auth; cron secrets use `timingSafeEqual`.
- Admissions queue GET → POST with auth.
- Migration `181_rc604_integration_connections_org_rls.sql` (renumbered from colliding `179`).

### RC-6.05 — Performance

- ECC builds via direct `createExecutiveCommandCenter().service.build()` (no full ~50-module platform walk).
- Dynamic import for Interactive Command Center + Mission Control view.
- KPI school-scope-first queries; EDI concurrency + batched Mission Control; insights batch insert.
- CRM/Finance publish chunked; finance forms context memoized.
- Migration `180_rc605_executive_perf_indexes.sql`.

### RC-6.06 — Documentation

- Migration head and logging contract updated.
- Dual-stack Copilot / ECC docs clarified.
- Maintainer map: `docs/platform/rc-packages.md`.
- Audit pack: Quality, Security, Performance, Documentation (this folder).

## Earlier

See Phase F / G / H packs under `docs/operations/phase-f/` and `docs/launch/` for pre–RC-6 certification history.
