# Greenfield Bootstrap Operating Procedure

## New environment

```bash
npm run db:baseline:build
npm run db:baseline:verify

# Link a disposable/empty non-production project (never Production ybcpaffklggaloxhnqkl)
supabase link --project-ref <empty-non-prod-ref>

npm run db:bootstrap:greenfield -- --project-ref <empty-non-prod-ref>
npm run db:migrate:forward -- --dry-run
```

Flow:

```text
certified greenfield baseline → future migrations
```

## Existing environment

```text
historical migration lineage → future migrations
```

Use approved ops `supabase db push` against the environment under change-control. Do not use the greenfield bootstrap against Production.

## Baseline apply semantics

- Baseline SQL is applied as a multi-statement Management API request (not one wrapping transaction).
- Success requires: SQL apply exit success **and** application-owned provenance row **and** completeness fingerprints (`npm run db:bootstrap:verify`).
- Partial baselines must be rejected. Absence of `supabase_migrations.schema_migrations` is expected and is not a failure.

## Never

- Replay historical repair migrations against greenfield merely to satisfy history
- Fabricate Auth identities (including `jimmy.arispe@theacademyway.org` / `d346c418-…`)
- Edit applied migrations
- Fabricate `supabase_migrations.schema_migrations` rows for unexecuted historical versions
- Target Production with greenfield bootstrap or this certification harness

## Certification (every release)

1. Existing-environment forward upgrade dry-run / staged apply evidence  
2. New-environment greenfield bootstrap to current cutoff  
3. Convergence checks at current release state  
4. Forward-migration compatibility on both paths  

## Artifacts

| Path | Purpose |
|------|---------|
| `supabase/baseline/GA_BASELINE_212.sql` | Generated initialization SQL |
| `supabase/baseline/manifest.json` | Provenance + inclusion/exclusion |
| `scripts/greenfield/*` | Build, verify, bootstrap, forward apply |
