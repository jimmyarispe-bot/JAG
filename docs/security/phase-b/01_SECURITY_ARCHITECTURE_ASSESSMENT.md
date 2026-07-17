# Security Architecture Assessment — Phase B

## Model (intended)

```
Browser / future mobile
  → Next middleware (session + catalog permissions)
  → Page guards / API guards / Server Action asserts
  → Supabase Auth JWT
  → Postgres RLS (tenant + permission + classification)
  → Platform audit / activity
```

## Strengths

- Permission catalog + `authorize` / `hasPermission` pattern (A.1 improved layouts).  
- RLS widely enabled on product tables.  
- Classification helpers for medical / special_education on core SpEd/medical tables.  
- Private storage buckets for admissions docs.  
- Cron route fails closed without `CRON_SECRET`.  
- Migration `171` designed to close PAJ/ULR/payroll open policies.

## Weaknesses

| Area | Assessment |
|------|------------|
| Defense in depth | Too many mutations trust RLS alone |
| MFA | Readiness only — not in auth path |
| Transport hardening | No CSP/HSTS/frame-ancestors |
| Rate limiting | Scholarship-only, in-memory |
| Privileged clients | Service-role preference in generic server helper |
| Reporting layer | Views may bypass table RLS |
| Grant surface | Migration 058 grants broad table/function access to roles |
| AI | Context API accepts caller-controlled tenant IDs |

## Alignment with platform constitution

AuthZ must be permission-based — **largely followed** in new code; residual role fallback exists when permission infra fails (`permissions.ts`). Hardcoded role lists for MFA are deprecated but enforcement is absent.

## Maturity

| Capability | Level |
|------------|-------|
| Identity | Intermediate |
| AuthZ engine | Intermediate |
| Tenant isolation | Intermediate (gaps) |
| App hardening | Early |
| Privacy controls | Intermediate (gaps) |
| Incident forensics | Early |
