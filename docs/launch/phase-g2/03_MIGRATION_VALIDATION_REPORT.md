# 3. Migration Validation Report

| Field | Value |
|-------|-------|
| **Status** | **DESKTOP REVIEW ONLY** — not applied/verified on staging/prod in this window |

## Repository inventory

- Migrations directory: `supabase/migrations/`
- Security-critical head migrations required on every env:
  - `171_a1_architecture_security_rls.sql`
  - `172_b1_security_remediation.sql`

## Validation matrix

| Check | Desktop | Staging | Production |
|-------|---------|---------|------------|
| Migration ordering (numeric filenames) | Pass (review) | Not evidenced | Not evidenced |
| Rollback scripts | Prefer forward-fix; no blind reverse | Not rehearsed | Not rehearsed |
| Schema integrity | Not live-validated | | |
| Indexes / constraints | Present in migrations; not soak-tested | | |
| RLS policies | Code/migration review (B.1) | Live soak open | |
| DB functions / triggers / views | Present; `rpt_%` security_invoker in 172 | | |
| Seed data | Exists in earlier migrations | | |
| Backup completed | Not evidenced | | |
| Restore tested | Not evidenced (F1-03) | | |
| Rollback tested | Not evidenced | | |
| Migration timing documented | Estimate TBD at dress rehearsal | | |

## Recommendation

Run RC3.5 dress rehearsal: backup → migrate → smoke → restore drill → document timings before GA.
