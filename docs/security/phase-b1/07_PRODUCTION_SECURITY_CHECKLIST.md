# Production Security Checklist — Post B.1

- [ ] Migrations `171` and `172` applied on production  
- [ ] `VAULT_ENCRYPTION_KEY` set (≥32 chars); no reliance on service role for vault  
- [ ] `CRON_SECRET` set  
- [ ] `ENFORCE_MFA=true` (or accept risk with written exception)  
- [ ] Privileged users enrolled in MFA  
- [ ] `ALLOW_SQUARE_PLANNED` **unset** in production  
- [ ] Optional: `UPSTASH_REDIS_REST_*` for multi-instance rate limits  
- [ ] Optional: `TURNSTILE_SECRET_KEY` + site key on apply form  
- [ ] Security headers verified on production URL (CSP/HSTS)  
- [ ] Cross-tenant RLS checks (org A vs B) recorded  
- [ ] Backup / secret rotation runbooks reviewed  
- [ ] `npm audit` reviewed; no Critical deps  

## Go criteria

All Critical code fixes shipped **and** migrations applied **and** cross-tenant checks green → Security GO for subsequent phases.  
Without live RLS evidence → **Conditional** only.
