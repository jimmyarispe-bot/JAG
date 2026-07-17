# Security & Integration Architecture — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Operational index of security and integration architecture |
| **Scope** | AuthN/Z, RLS, secrets, connectors, webhooks |
| **Audience** | Security, eng, ops |
| **Prerequisites** | Phase B reports reviewed |
| **Version** | 1.0.0 |

---

## Security architecture (implementation pointers)

| Concern | Where implemented | Ops doc |
|---------|-------------------|---------|
| Auth sessions | Supabase Auth + `@supabase/ssr` | Phase B auth review |
| Permissions | `src/lib/platform/identity/` catalog + guards | IAM_FOUNDATION |
| Page authz | `requireAuthorizedRoute` / page-guard | — |
| API authz | `guardApiRoute` | API docs |
| RLS | Migrations + Phase B RLS report | DB docs |
| Secrets | Env + vault crypto | `07_SECRETS_MANAGEMENT_REVIEW.md` |
| MFA | Readiness only (`mfa.ts`) — **not enforced** | Phase B NO-GO items |
| Security headers | Gaps documented Phase B | Wave B.1 |

**Do not claim production security clearance** until Phase B Wave B.1 closes.

Canonical: `docs/architecture/SECURITY_MODEL.md`, `docs/security/phase-b/SECURITY_REPORT.md`.

---

## Integration architecture

| Hub | Path | Registry |
|-----|------|----------|
| Integration Hub UI | `/dashboard/integrations` | `src/lib/integration-hub/` |
| Connector registry doc | `docs/architecture/INTEGRATION_CONNECTOR_REGISTRY.md` | |
| Connectors (product docs) | QuickBooks, Plaid, Square, Google Workspace, AcademyOS | `docs/product/*_CONNECTOR.md` |
| Vault | Integration Hub vault + `VAULT_ENCRYPTION_KEY` | Prefer dedicated key over service role |
| Webhooks / sync | Hub modules + API routes under integrations | |
| Cron / queues | `processAllPlatformQueues` via `/api/platform/process-queues` | Monitoring guide |

Runtime docs endpoints:

- `GET /api/integrations/docs`
- `GET /api/data/docs`
- `GET /api/cloud/docs`

---

## Infrastructure architecture

| Item | Implementation |
|------|----------------|
| Hosting | Vercel |
| Data plane | Supabase (managed Postgres, Auth, Storage) |
| Email | SendGrid |
| Observability | Health/ready probes; Sentry/OTel **not** in package.json (future) |
| CDN / images | Next config (Phase C.1 compress / image formats) |

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| 403 on API | Permission key + password-reset gate |
| Connector auth fail | Vault key + connector health UI |
| Suspected tenant leak | Follow Phase B pen-test plan; escalate security incident |

## Related documents

- `../runbooks/11_INCIDENT_RESPONSE.md`
- `../17_COMPLIANCE_DOCUMENTATION.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
