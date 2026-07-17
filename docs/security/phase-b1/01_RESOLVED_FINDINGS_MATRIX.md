# Resolved Findings Matrix — B.1

| Phase B ID | Severity | Status | Evidence |
|------------|----------|--------|----------|
| C-01 | Critical | **Fixed** | `172` security_invoker |
| C-02 | Critical* | **Ops** | Apply `171`+`172` per env |
| H-01 | High | **Fixed** | Finance RLS helper |
| H-02 | High | **Fixed** | MFA enforce + page |
| H-03 | High | **Fixed** | Split Supabase clients |
| H-04 | High | **Fixed** | Durable rate limit |
| H-05 | High | **Fixed** | Security headers |
| H-06 | High | **Fixed** | Storage policies |
| H-07 | High | **Fixed** | square_planned blocked |
| H-08 | High | **Fixed** | Tenant asserts + AI bind |
| H-09 | High | **Fixed** | Parent medical projection |
| SEC-AUTH-02 | High | **Fixed** | Inquiry honeypot/RL/Turnstile |
| SEC-PLAT-01 | High | **Fixed** | Notes/relationships org RLS |
| SEC-APP-02 | High | **Partial** | Portal inquiry hardened; broader action audit → B.2 |
| Live RLS suite | High | **Partial** | Unit tests; JWT A/B pending |
