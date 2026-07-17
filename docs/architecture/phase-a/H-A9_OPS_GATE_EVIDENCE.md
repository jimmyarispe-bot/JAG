# H-A9 — Migrations 171+172 Ops Gate Evidence

| Field | Value |
|-------|--------|
| **Finding** | H-A9 — Ops dependency for security architecture integrity |
| **Wave** | Phase A.1 Wave 0 |
| **Date** | 2026-07-17 |
| **Checklist** | [07_PRODUCTION_SECURITY_CHECKLIST.md](../../security/phase-b1/07_PRODUCTION_SECURITY_CHECKLIST.md) |

---

## 1. Repo authority (verified)

| Migration | Path | Status |
|-----------|------|--------|
| 171 | `supabase/migrations/171_a1_architecture_security_rls.sql` | **Present** (A.1 Critical RLS — ULR/PAJ/payroll) |
| 172 | `supabase/migrations/172_b1_security_remediation.sql` | **Present** (B.1 — security_invoker views, finance RLS, storage, rate-limit RPC) |

Head of tree (local inventory): migrations through **`172_b1_security_remediation.sql`**.

Verification command (no DB required):

```bash
node scripts/verify-security-migrations-present.mjs
```

---

## 2. Apply procedure (every environment)

```bash
# Linked project
supabase db push
# or targeted history check
supabase migration list
```

Confirm both versions appear as **applied** on Local / Staging / Production.

### Post-apply SQL smoke (service role / SQL editor)

```sql
-- Expect rows for 171 and 172 in migration history (Supabase schema_migrations / CLI list)
select * from supabase_migrations.schema_migrations
where version in ('171', '172')
order by version;

-- B.1 finance helper exists
select proname from pg_proc where proname = 'can_access_finance_school';
```

---

## 3. Environment apply matrix

| Environment | 171 applied | 172 applied | Evidence | Owner | Date |
|-------------|-------------|-------------|----------|-------|------|
| Local / linked CLI | Pending credentials | Pending credentials | `supabase migration list` unauthorized (401) during Wave 0 run | Ops | — |
| Staging | ☐ | ☐ | Attach CLI output or SQL result | Ops | — |
| Production | ☐ | ☐ | Attach CLI output or SQL result | Ops | — |

**Wave 0 agent run (2026-07-17):** Repo files verified. Remote apply **not executed** — `supabase migration list` returned `Unauthorized` / missing `SUPABASE_DB_PASSWORD`. Ops must complete matrix before Security GO.

---

## 4. Security B.1 checklist linkage

| Checklist item | Wave 0 status |
|----------------|---------------|
| Migrations `171` and `172` applied on production | **Ops pending** — evidence slots above |
| Remaining checklist rows (`VAULT_ENCRYPTION_KEY`, MFA, RLS live checks, …) | Unchanged — see Security B.1 checklist |

**Architecture cannot mark the checklist fully green without live env evidence.** This package attaches the gate evidence template and repo verification so Ops can close H-A9 without ambiguity.

---

## 5. Done means (H-A9)

1. `scripts/verify-security-migrations-present.mjs` exits 0 in CI/local  
2. Staging + Production migration list shows 171 + 172 applied  
3. Cross-tenant RLS spot-checks recorded in `docs/security/phase-b1/05_VALIDATION_TEST_RESULTS.md`  
4. `07_PRODUCTION_SECURITY_CHECKLIST.md` migration row checked with evidence link  

Until (2)–(4): H-A9 remains **ops-open**; codebase remediations for 171/172 are **landed**.
