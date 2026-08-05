# Database Evolution Contract

**Status:** Canonical (Phase 34)  
**Cutoff (GA candidate):** `212` (`212_jag_org_scoped_authorization.sql`)  
**Greenfield baseline ID:** `GA_BASELINE_212`

Companion: [`PLATFORM_CONTRACT.md`](./PLATFORM_CONTRACT.md) § Database Evolution Contract.

---

## Dual-path model

```text
PATH 1 — EXISTING DATABASE
historical migrations → cutoff → future migrations

PATH 2 — NEW DATABASE
certified greenfield baseline → same cutoff → future migrations
```

These paths must converge to equivalent schema, functions, policies, permissions, and deterministic catalog/baseline data at the same cutoff.

---

## Historical Migration Lineage

Used for already-deployed databases (including Production).

Rules:

- Applied migrations are immutable (no checksum rewriting).
- Upgrades are forward-only via `supabase/migrations/`.
- Historical repairs remain historical evidence (e.g. `158`).
- Do not fabricate `supabase_migrations.schema_migrations` rows.
- Do not edit applied SQL to make greenfield succeed.

---

## Greenfield Baseline

Used only to initialize a new empty environment.

Rules:

- Represents canonical state at an explicit cutoff (`GA_BASELINE_212` → cutoff `212`).
- Is an initialization artifact — not historical execution evidence.
- Receives its own baseline identity and provenance (`platform_schema_baselines`).
- Must contain no runtime production data, production Auth identities, or secrets.
- Must be reproducible from repository sources via `npm run db:baseline:build`.
- Must be independently certified via `npm run db:bootstrap:greenfield`.

Excluded historical repairs are declared in `supabase/baseline/manifest.json`.

---

## Future migrations

Every migration after the cutoff must be valid for both:

1. Historical-upgrade-equivalent state  
2. Greenfield-baseline state  

Greenfield forward applies use `npm run db:migrate:forward` and record only versions `> cutoff` in `platform_forward_migrations`. They must not fabricate historical ledger rows for `001–cutoff`.

Production/historical upgrades continue to use the approved `supabase db push` ops path (not this certification harness against Production).

---

## Operating procedure

See [`docs/operations/GREENFIELD_BOOTSTRAP.md`](../operations/GREENFIELD_BOOTSTRAP.md).

## Never

- Replay historical repair migrations against greenfield merely to satisfy history
- Fabricate Auth identities (including `jimmy.arispe@theacademyway.org`)
- Edit applied migrations
- Fabricate migration ledger entries for unexecuted historical versions
