# Updated Threat Model — Post B.1

| Field | Value |
|-------|-------|
| **Purpose** | Refresh threat assumptions after B.1 hardening |
| **Audience** | Security / architects |
| **Version** | 1.0.0 |

## Trust boundaries

1. Browser → Vercel (Next.js) — CSP/HSTS/frame deny  
2. App → Supabase Auth/DB/Storage — user JWT + RLS (+ finance permission)  
3. Cron → Queue API — Bearer `CRON_SECRET`  
4. Public inquiry → RPC — rate limit + honeypot (+ optional Turnstile)  
5. Vault — dedicated `VAULT_ENCRYPTION_KEY` in production  

## Reduced threats (B.1)

| Threat | Mitigation |
|--------|------------|
| Finance data via school membership | Finance permission RLS |
| Report view privilege escalation | security_invoker views |
| Service-role accidental RLS bypass | Client split |
| Simulated payments in prod | Hard fail |
| AI cross-tenant context | Org/school/student bind |
| Storage anonymous read | Private bucket policies |
| Login / inquiry flooding | Durable rate limits |

## Residual threats

| Threat | Status |
|--------|--------|
| Unapplied migrations | Ops |
| Missing live A/B RLS proof | Testing gap |
| MFA lockout if ENFORCE_MFA without enrollment UX | Ops/enable carefully |
| Moderate npm transitive CVE | Supply chain |

## Related

- `docs/architecture/SECURITY_MODEL.md`
- Phase B package
