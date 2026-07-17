# Reliability Guide

## Expected behavior

- Auth failures redirect to login without leaking resource existence where practical  
- Permission denials return Forbidden / hidden sections — never partial sensitive payloads  
- Env validation fails fast in production when secrets missing  
- Rate limits return 429 with Retry-After  

## Failure modes to monitor (ops)

| Signal | Action |
|--------|--------|
| Elevated 5xx | Check Supabase connectivity + recent deploy |
| Auth spike 401/403 | Session/cookie or permission mapping drift |
| Queue lag | Inspect platform queue processors / cron |
| AI timeouts | Fallback copy + audit trail |

## Recovery checklist

1. Verify Supabase status / reconnect  
2. Restart app instances (Vercel redeploy)  
3. Re-run cron once after restore  
4. Confirm no cross-tenant anomalies via org A/B spot check  

Full DR evidence remains a Phase F / E.1 ops gap.
