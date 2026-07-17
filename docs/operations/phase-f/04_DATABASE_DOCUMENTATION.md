# Database Documentation — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Document how AcademyOS schema is defined, migrated, secured, and operated |
| **Scope** | Supabase PostgreSQL, migrations, RLS, types |
| **Audience** | Engineers, DBAs, security |
| **Prerequisites** | Supabase CLI or dashboard access; never use service role in client |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

---

## Source of truth

| Artifact | Path |
|----------|------|
| Migrations | `supabase/migrations/*.sql` (**count files for current N**) |
| Local config | `supabase/config.toml` |
| App types | `src/types/database.ts` (manual mirror — keep in sync) |
| RLS findings | `docs/security/phase-b/03_RLS_VALIDATION_REPORT.md` |
| Critical hardening | `171_a1_architecture_security_rls.sql` (verify applied in every env) |

**ERD:** Not checked into repo. Generate for a given env with schema tools (Supabase Studio, `supabase db dump`, or IDE ERD) after migrations apply. Wave F.1 tracks committed ERD export.

---

## Naming standards (observed)

| Object | Convention |
|--------|------------|
| Tables | `snake_case` plural or domain prefix (`financial_`, `rpt_`) |
| Migrations | `NNN_description.sql` monotonic |
| RLS helpers | `can_access_school`, membership functions |
| Views | Often `rpt_*` for reporting — **security_invoker risk** (Phase B) |
| Policies | `{table}_{action}_{audience}` patterns vary by era |

---

## Procedures

### Apply migrations (typical)

1. Ensure target project selected (`supabase link` or dashboard).  
2. Review pending files vs remote version.  
3. Apply: `supabase db push` (or CI-approved migration pipeline).  
4. Verify `171` (and later) present.  
5. Update `src/types/database.ts` if schema changed.  
6. Smoke: `/api/ready`, login, one staff + one portal read.

### Inspect schema

- Supabase Table Editor / SQL  
- `rg "create table" supabase/migrations`  
- Studio → Policies for RLS  

### Indexes / FKs / constraints

Defined inside migrations. Search:

```text
create index
references 
unique (
alter table
```

### Backup / restore

See `10_DISASTER_RECOVERY_PLAN.md` and `runbooks/13_DATABASE_BACKUP_RESTORE.md`.

---

## RLS operating rules

1. Default deny via RLS enabled on tenant tables.  
2. App must use user-scoped clients for request paths (Phase B: service-role default is High risk).  
3. Never grant broad `authenticated` SELECT on sensitive views without `security_invoker`.  
4. Permission catalog in app **complements** RLS — both required.

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Empty datasets for valid user | Check `user_schools` / membership + RLS policy |
| Works with service role only | App using wrong client — security incident risk |
| Migration drift | Compare `supabase migration list` / remote history |
| Type errors after migrate | Update `database.ts` |

## Related documents

- `architecture/03_DATA_GRAPH_AND_AI.md`
- `runbooks/13_DATABASE_BACKUP_RESTORE.md`
- `docs/security/phase-b/03_RLS_VALIDATION_REPORT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Standards + ops; full ERD deferred F.1 |
