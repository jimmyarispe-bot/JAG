# Certification-1 — Clean Historical Replay Failure Evidence

**Disposition:** `deleted` (2026-08-05) — free-tier project limit required freeing a slot before creating The JAG Greenfield Certification. Pause was preferred but CLI only exposed `projects delete`; deletion occurred after Phase 30/31 diagnostics were complete. This document preserves the unique clean-replay failure evidence.

This evidence was **not** previously committed as a standalone artifact; it is reconstructed from Phase 30/31 certified session results against the disposable project.

---

## Project identity

| Field | Value |
|-------|-------|
| Name | The JAG Migration Certification |
| Ref | `deggsksfzhzuoprkacbx` |
| Region | `us-east-2` |
| Status at diagnosis | `ACTIVE_HEALTHY` |
| Environment class | Disposable certification (non-production) |

Production deny ref (never targeted for write): `ybcpaffklggaloxhnqkl`

---

## Initial state (Phase 29/30 pre-write)

| Field | Value |
|-------|-------|
| Remote applied migration count | `0` |
| Dry-run | exit 0 — proposed full chain `001 → 212` |
| First proposed | `001_phase1_core_foundation.sql` |
| Last proposed | `212_jag_org_scoped_authorization.sql` |

---

## Controlled write (Phase 30)

| Field | Value |
|-------|-------|
| Command | `supabase db push --linked` (exactly once) |
| Exit code | `1` |
| First migration applied | `001_phase1_core_foundation.sql` |
| Last successfully applied | `156_sprint002_executive_kpi_snapshots.sql` |
| Failing migration | `158_sprint002_authenticated_founder_repair.sql` |
| Sanitized failure | `ERROR: Authenticated Founder repair aborted: auth.users missing for jimmy.arispe@theacademyway.org` |
| Remote migration count after | `156` |
| Highest remote migration | `156` |
| First remaining local-only | `158` |

Successful range recorded on remote: **`001` through `156`** (version `157` absent from local chain).

---

## Safety confirmations

| Check | Result |
|-------|--------|
| Migration history repaired | **NO** |
| Database reset | **NO** |
| Manual SQL / seeds | **NO** |
| Historical Auth fixture created (`jimmy.arispe@…` / `d346c418-…`) | **NO** |
| Production targeted / modified | **NO** |
| Migration `158` marked applied | **NO** |

---

## Phase 31 diagnostic conclusion

- Classification: **CLASS B — HISTORICAL ENVIRONMENT REPAIR**
- Migration `158` requires pre-existing Auth identity `d346c418-26d0-47b0-8655-ce64173dffb1` / `jimmy.arispe@theacademyway.org`
- No migration `001–156` creates that Auth identity
- Later migrations `159–212` have **no schema dependency** on `158`
- Immutable blob of `158`: `540b99a23210795f6b6eba9bfd472f39a7997746`
- Production had `158` applied → in-place edit of `158` forbidden
- Remediation direction (later approved): greenfield baseline path, not editing `158`

---

## Why this evidence matters

Certification-1 proved that **full historical replay against an empty Supabase project fails at immutable migration `158`** without fabricating historical Auth state. That failure is the empirical justification for the dual-path Database Evolution Contract and `GA_BASELINE_212`.
