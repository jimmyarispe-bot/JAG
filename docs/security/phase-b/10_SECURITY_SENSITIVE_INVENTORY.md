# Phase 1 — Security-Sensitive Component Inventory

## Application surfaces

| Surface | Location | Notes |
|---------|----------|-------|
| Web (Next.js) | `src/app/**` | Primary product |
| Middleware | `middleware.ts` | Auth + catalog route authz |
| Server Actions | ~32 `**/actions.ts` with `"use server"` | High attack surface |
| API routes | ~28 under `src/app/api/**` | Mix of exports, cron, docs, probes |
| Mobile native app | **None** | Epic 14 gap — N/A |
| Background jobs | `process-queues` + module automations | Cron + Mission Control |

## Identity & auth

| Component | Path |
|-----------|------|
| Session / roles | `src/lib/auth/session.ts` |
| Auth client (user JWT) | `src/lib/supabase/server-auth.ts` |
| Privileged client risk | `src/lib/supabase/server.ts` (prefers service role) |
| MFA (no enforcement) | `src/lib/platform/identity/mfa.ts` |
| SSO (architecture) | `src/lib/platform/identity/sso.ts` |
| Permissions / authorize | `src/lib/platform/identity/*` |
| Portal access | `src/lib/platform/identity/portal-access.ts` |
| Page / API guards | `page-guard.ts`, `api-guard.ts`, `route-authorization.ts` |

## Sensitive data domains (DB)

Payroll/HR · Finance/billing · Scholarships · Medical · SpEd · PAJ progress · Student docs · Admissions docs · Messages · Audit · FI reports · Executive exports

## Storage buckets

| Bucket | Migration | Notes |
|--------|-----------|-------|
| Admissions application docs | `065` | Private; path-scoped policies |
| `student-documents` | `078` | Private; **no storage.objects policies found in migrations** |

## Public / anon entry points

- `/api/health`, `/api/ready`
- Integration/cloud/data/intelligence docs routes
- `create_public_inquiry` SECURITY DEFINER RPC
- `list_schools_for_public_inquiry`
- Funding RPCs granted to anon (invoker — verify)

## Platform services (security-relevant)

Identity · Organizations · Authorization · Audit · Notifications · Workflow · Automation queues · Parent communication · Classification · Digital signatures · Vault crypto
