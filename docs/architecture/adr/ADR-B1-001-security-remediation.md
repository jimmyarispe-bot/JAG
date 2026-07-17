# ADR-B1-001 — Phase B.1 Security Remediation Approach

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-17 |

## Context

Phase B found Critical/High issues (view RLS bypass, finance over-broad RLS, MFA off, service-role client default, weak rate limits, simulated payments, AI IDOR).

## Decision

1. Prefer additive migration `172` over rewriting historical migrations.  
2. Use `security_invoker` on reporting views rather than revoking all grants.  
3. Gate finance tables with permission + school helpers.  
4. Enforce MFA via route guard with env-controlled hard enrollment (`ENFORCE_MFA`).  
5. Rate limit with optional Upstash, durable Supabase RPC, memory fallback.  
6. Never use service role as vault key in production.

## Consequences

- Environments must apply `171`+`172`.  
- Privileged users may hit `/login/mfa-required` until enrolled.  
- Dev can enable `ALLOW_SQUARE_PLANNED` only outside production.
