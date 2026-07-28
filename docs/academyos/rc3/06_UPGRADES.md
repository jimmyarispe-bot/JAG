# AcademyOS RC-3 — Upgrades

## Upgrade path

RC-2 → RC-3 → RC-4 → Certified → Released (Studio-governed).

## Migration ordering

Supabase migrations under `supabase/migrations` must remain lexicographically ordered by numeric prefix. `validateUpgrade()` asserts ordering before recommending cutover.

## Compatibility

AcademyOS `1.0.0` requires Platform and SDK `1.x`.

## Rollback

Documented **rollback** steps:

1. Redeploy previous application artifact.
2. If a migration is irreversible, restore the pre-upgrade database backup.
3. Re-run deployment + health validation.
4. Record the incident in Studio release notes.

## Upgrade checklist

- [ ] `validateUpgrade()` passed
- [ ] Release notes reviewed
- [ ] Backup completed
- [ ] Staging restore verification completed
- [ ] Studio RC-3 gates green
- [ ] Communications plan for operators
- [ ] Rollback owner on-call

## Release notes (RC-3)

Operational readiness only — no new AcademyOS business modules. Adds operations engines, APIs, demo organization seed, and RC-3 runbooks.
