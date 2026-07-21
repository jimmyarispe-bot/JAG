# RC-3 — Audit Logging Matrix

## Correlation

| Field | Source |
|-------|--------|
| `requestId` / `traceId` | Middleware headers + `@/lib/observability` logger |
| Structured JSON logs | `logStructured` / `logger.*` |

## Critical events

| Event class | Mechanism | Status |
|-------------|-----------|--------|
| Authentication / failed login | `platform_security_events` (`logSecurityEvent`) | Present |
| Permission / role changes | `logSecurityEvent` + identity server-actions | Present |
| Impersonation | `logSecurityEvent` | Present |
| Administrative config changes | `logSecurityEvent` `school_config_change` | **Added RC-3** on configuration actions |
| Financial operations | `recordActivity` + `writePlatformAudit` | Present |
| Admissions decisions | activity + admissions audit tables | Present |
| Integration API gateway | `ihub_api_audit_log` | Present (gateway); not all hub UI actions |
| Data export | security `export` event (where wired) | Partial — confirm per export path |
| Queue / cron | Vercel + route logs | Present |

## Gaps / residuals

| ID | Gap | Priority |
|----|-----|----------|
| SEC-AUD-01 | Immutable finance audit store | Low (B.1 residual) |
| RC3-AUD-01 | Trace IDs not dual-written into every DB audit row | Medium — logs carry them; DB rows often metadata-only |
| RC3-AUD-02 | Some Integration Hub server actions may skip gateway audit | Medium — inventory in RC-4/RC-5 |

## Config change coverage (RC-3)

`src/lib/configuration/actions.ts` now audits:

- Section save / fields save  
- Module enable/disable  
- Go-live launch  
- Package import  
- Version rollback  
