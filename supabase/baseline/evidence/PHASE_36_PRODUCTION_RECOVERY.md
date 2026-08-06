# PHASE 36 — Production recovery readiness

**Project ref:** `ybcpaffklggaloxhnqkl` (The JAG, us-east-2)  
**Verification time (UTC):** 2026-08-06T02:36:35Z  
**Production data mutated:** NO  
**PITR enabled:** NO

## Platform backup / PITR inspection

Command/mechanism:

- `supabase backups list --project-ref ybcpaffklggaloxhnqkl -o json`
- Management API `GET /v1/projects/{ref}/database/backups`
- Management API `GET /v1/projects/{ref}/billing/addons`
- Management API `GET /v1/organizations/{org}`

Observed:

| Field | Value |
| --- | --- |
| Organization plan | `free` |
| `walg_enabled` | true |
| `pitr_enabled` | false |
| Listed platform backups | none (`backups: []`) |
| `physical_backup_data` | empty |
| Selected addons | none |

PITR enable attempt (supported Management API):

```text
PATCH /v1/projects/ybcpaffklggaloxhnqkl/billing/addons
addon_type=pitr
addon_variant=pitr_7
→ HTTP 400
message: Organization is not entitled to the selected PITR duration.
```

Available PITR variants listed by API (not entitled on free plan): `pitr_7`, `pitr_14`, `pitr_28`.

**Plan change required for native PITR:** upgrade organization from Free to Pro/Team/Enterprise, then enable PITR add-on (and typically ≥ Small compute per Supabase docs).

## Verified recovery mechanism selected

Because native PITR / platform backup inventory could not be established on the Free plan, Phase 36 used the official Supabase CLI backup path documented for backup/restore:

`supabase db dump --linked`

Artifacts stored **outside the git repository** (operator recovery directory):

`~/JAG-GA-RECOVERY/ybcpaffklggaloxhnqkl/`

| Artifact | Bytes | SHA-256 | Created (UTC) |
| --- | --- | --- | --- |
| `schema-2026-08-06T02-32-57Z.sql` | 1,301,955 | `BA622A2B8B91449DAA0F884897E4FEE957F87A21F5988E69C9FA8F722242131E` | 2026-08-06T02:33:28Z |
| `data-2026-08-06T02-36-06Z.sql` | 4,248,417 | `AEE6F2C5D8FACCE086F4CD2395FC7C9EC984C46327144BAC00E1589752812EDE` | 2026-08-06T02:36:35Z |

Commands:

```bash
supabase db dump --linked -f <schema-file>
supabase db dump --linked --data-only --use-copy -f <data-file>
```

Both completed with exit code `0`. Meta JSON files with the same hashes sit beside the dumps.

### Recovery availability

- Restore path: load schema then data into a scratch/restored Postgres via `psql` / Supabase CLI restore workflow (official backup-restore docs).
- Data-only dump emitted circular FK warnings; restore may require `--disable-triggers` or prefer full dump strategy if a rebuild is needed.
- Retention: operator-controlled local retention (not Supabase platform retention). Treat as pre-migration recovery point for Phase 35 Stage B authorization.

## Result

`RECOVERY_READINESS = PASS`

Mechanism: **verified official CLI logical backup (schema + data)** with concrete hashes and timestamps.

Native `PITR_ENABLED = FALSE` remains a residual platform-gap on Free plan; it is not accepted as the primary gate for Phase 36 because a concrete verified backup exists.
