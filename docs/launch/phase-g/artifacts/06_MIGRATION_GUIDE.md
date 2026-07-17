# 6. Migration Guide

## Location

`supabase/migrations/` — sequential SQL through **`172_b1_security_remediation.sql`**.

## Mandatory security migrations

| Migration | Purpose |
|-----------|---------|
| `171_a1_architecture_security_rls.sql` | A.1 architecture/security RLS |
| `172_b1_security_remediation.sql` | B.1: `security_invoker` on `rpt_%`, finance school RLS, storage policies, rate-limit RPC |

**Every environment** (dev/staging/prod) must apply these before claiming B.1/GA security posture.

## Procedure

1. Backup / confirm PITR.  
2. `supabase db push` (or approved pipeline) against target.  
3. Verify migration history includes 171 and 172.  
4. Smoke with non-service-role user (RLS).  
5. Record evidence in RC1 re-certification.

## RC evidence

Apply + verify on staging: **not completed** in this Phase G run.
