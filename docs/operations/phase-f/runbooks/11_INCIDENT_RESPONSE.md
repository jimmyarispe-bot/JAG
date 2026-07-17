# Runbook — Incident Response

| Field | Value |
|-------|-------|
| **Purpose** | Detect, triage, mitigate, communicate, and close production incidents |
| **Scope** | Availability, data integrity, security, performance |
| **Audience** | On-call, eng leads, support |
| **Prerequisites** | Access to Vercel, Supabase, logs; escalation contacts |
| **Version** | 1.0.0 |

---

## Severity definitions

| Sev | Definition | Response target |
|-----|------------|-----------------|
| SEV-1 | Full outage, data breach, cross-tenant leak | Immediate all-hands |
| SEV-2 | Major feature down (auth, portal, finance writes) | &lt; 30 min ack |
| SEV-3 | Degraded / partial | Business hours |
| SEV-4 | Minor / cosmetic | Backlog |

Align with `../16_SUPPORT_READINESS.md`.

---

## Procedures — General incident

1. **Detect** — alert, user report, health fail.  
2. **Ack** — declare severity; open incident doc/channel.  
3. **Stabilize** — rollback app (`12_DEPLOYMENT.md`), disable cron if harmful, feature-flag if available.  
4. **Diagnose** — Vercel logs, Supabase logs, recent deploys/migrations.  
5. **Resolve** — fix forward or restore.  
6. **Verify** — health/ready + critical user journeys.  
7. **Communicate** — status to stakeholders.  
8. **Postmortem** — within 5 business days for SEV-1/2.

---

## Procedures — Security incident

1. Treat as SEV-1 if tenant isolation or PII exposure suspected.  
2. Preserve logs; avoid destructive cleanup until evidence captured.  
3. Rotate compromised secrets (`14_SECRETS_AND_CERTIFICATES.md`).  
4. Follow Phase B pen-test / isolation checks.  
5. Legal/privacy notification per `../17_COMPLIANCE_DOCUMENTATION.md`.  
6. Do not discuss speculative breach details externally.

---

## Troubleshooting quick links

| Symptom | Check |
|---------|-------|
| 5xx spike | Vercel deployment, Supabase status |
| Auth loop | Supabase Auth, cookies, `NEXT_PUBLIC_APP_URL` |
| Empty data | RLS / migrations / wrong project keys |
| Queue backlog | `15_QUEUE_RECOVERY.md` |

## Related documents

- `../13_MONITORING_AND_OPERATIONS.md`
- `docs/security/phase-b/14_PENETRATION_TEST_PLAN.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
