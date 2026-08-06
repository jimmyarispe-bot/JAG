# Greenfield composition: migration 175 email exclusion

**Classification:** `175_EMAIL_EXCLUSION_SAFE = YES`

## What migration 175 establishes

`175_complete_auth_user_provisioning.sql` adds:

1. **Schema:** `auth_provisioning_config`, provisioning RPCs/triggers extending `174`
2. **Catalog baseline:** `TEAM_MEMBER` role, `ACADEMYOS_ACCESS` permission, role-permission mappings
3. **Runtime config (singleton row):** `founder_bootstrap_emails text[]` listing emails that receive FOUNDER when *later* provisioned from Auth

The historical Auth identity is **not created** by 175. The email appears only as a membership test against `founder_bootstrap_emails` when an Auth user is provisioned:

```sql
v_is_founder := exists (
  select 1 from unnest(v_bootstrap_emails) as e
  where lower(btrim(e)) = lower(v_email)
) or metadata bootstrap_role/role = founder;
```

## What greenfield composition changes

Historical migration file `175` remains immutable.

Composition replaces the config array:

```text
array[jimmy@theacademyway.org, jimmy.arispe@theacademyway.org]
→
array[jimmy@theacademyway.org]
```

## Why this is safe for canonical greenfield state

| Concern | Impact of exclusion |
|---------|---------------------|
| Schema / functions / triggers | None |
| Permission / role catalogs | None |
| Seed Founder (`jimmy@` via `056`/`155`) | Retained — still FOUNDER |
| Auto-FOUNDER if historical Auth email later appears | Removed (intentional) |
| Required GA authorization objects | Unaffected |

Removing `jimmy.arispe@…` changes only **historical/runtime founder bootstrap configuration** for a production-specific Auth identity. It does **not** change canonical authorization catalogs or the deterministic seed Founder path.

Greenfield remains able to grant FOUNDER via:

- seed identity `jimmy@theacademyway.org`, or
- Auth user metadata `bootstrap_role` / `role` = `founder` (still supported by 175 logic)

## Fail-closed builder requirements

- Pin source blob of `175`
- Require the exact historical array pattern to appear once
- Apply exactly one transformation occurrence
- Fail if pattern absent, duplicated, or residual prohibited email remains in executable composed SQL
