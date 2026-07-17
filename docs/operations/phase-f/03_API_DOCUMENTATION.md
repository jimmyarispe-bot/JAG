# API Documentation — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Catalog HTTP API routes, Server Actions, workers, and integration docs endpoints as implemented |
| **Scope** | `src/app/api/**`, `src/lib/**/actions.ts`, platform queues, Supabase RPCs (index) |
| **Audience** | Engineers, integrators, security |
| **Prerequisites** | Authenticated session for most routes; `CRON_SECRET` for cron |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

**Versioning:** No public URL version prefix (`/api/v1`). Treat breaking changes as release-coordinated. JSON self-docs exist for some hubs (`/api/*/docs`).

---

## Authentication & authorization (all routes)

| Mechanism | Detail |
|-----------|--------|
| Session | Supabase Auth cookie via `createAuthClient()` |
| API guard | `guardApiRoute(supabase, permission?)` → 401 / password-reset / 403 |
| Cron | `Authorization: Bearer ${CRON_SECRET}` on queue processor |
| Public | `/api/health`, `/api/ready` (ready checks env only) |

Error shape (typical): `{ error: string }` with HTTP 401/403/429/500.

---

## 1. HTTP API route catalog

| Method | Path | Purpose | AuthZ (typical) |
|--------|------|---------|-----------------|
| GET | `/api/health` | Liveness | Public |
| GET | `/api/ready` | Readiness (Supabase env) | Public |
| GET, POST | `/api/platform/process-queues` | Drain platform automation queues | Cron Bearer **or** `mission_control.access` |
| GET | `/api/platform/search` | Global search | Authenticated + permissions |
| GET | `/api/portal/calendar.ics` | Portal calendar feed | Portal auth |
| GET | `/api/compliance/calendar.ics` | Compliance calendar | Compliance perms |
| GET | `/api/compliance/reports` | Compliance reports | Compliance perms |
| GET | `/api/admissions/funding-export` | Admissions funding export | Admissions/finance perms |
| POST, GET | `/api/admissions/process-communications` | Process admissions comms | Admissions automation |
| GET | `/api/ssis/funding-export` | SSIS funding export | Students/finance perms |
| POST | `/api/scholarship` | Scholarship API | Scholarship perms + rate limit |
| GET | `/api/finance/board-export` | Finance board export | Finance perms |
| GET | `/api/executive/board-export` | Executive board export | Executive perms |
| GET | `/api/edi/board-report` | EDI board report | EDI perms |
| GET | `/api/edi/reports` | EDI reports | EDI perms |
| GET | `/api/financial-intelligence/reports` | FI reports | FI perms |
| POST | `/api/financial-intelligence/import` | FI import | FI perms |
| GET | `/api/configuration/export` | Config export | Config perms |
| GET | `/api/data/export` | EDP export | Data platform perms |
| POST | `/api/data/import` | EDP import | Data platform perms |
| GET | `/api/data/docs` | EDP API metadata JSON | Implementation-defined |
| GET | `/api/integrations/docs` | Integration Hub docs JSON | Implementation-defined |
| GET | `/api/intelligence/docs` | Intelligence API docs JSON | Implementation-defined |
| GET | `/api/cloud/docs` | Cloud platform docs JSON | Implementation-defined |
| GET, POST | `/api/intelligence/context` | AI context | Intelligence perms — **validate tenant IDs** |
| GET | `/api/network/reports` | AIN reports | Network perms |
| GET | `/api/work/reports` | Work reports | Work perms |
| GET | `/api/certification/reports` | Certification reports | Cert perms |

**Source of truth for handlers:** `src/app/api/**/route.ts`. Re-scan after adding routes.

### Example — queue processor

```http
GET /api/platform/process-queues
Authorization: Bearer <CRON_SECRET>
```

```json
{ "success": true, "processedAt": "2026-07-17T00:00:00.000Z" }
```

### Example — health

```http
GET /api/health
```

```json
{ "status": "ok", "probe": "liveness" }
```

---

## 2. Server Actions index

Mutations primarily live in `src/lib/**/actions.ts` (38 files). Invoked from UI via Next.js Server Actions — **not** versioned REST.

| File | Domain |
|------|--------|
| `src/lib/admissions/actions.ts` (+ case, portal, communications, automation, handoff) | Admissions |
| `src/lib/students/actions.ts`, `ssis/actions.ts` | SIS |
| `src/lib/scheduling/actions.ts` | Scheduling |
| `src/lib/teacher/actions.ts`, `instruction/actions.ts` | Teacher |
| `src/lib/finance/actions.ts`, `financial-intelligence/actions.ts` | Finance |
| `src/lib/hr/actions.ts` | HR |
| `src/lib/portal/actions.ts` | Portal |
| `src/lib/scholarships/actions.ts` | Scholarships |
| `src/lib/executive/actions.ts`, `edi/actions.ts` | Executive |
| `src/lib/compliance/actions.ts` | Compliance |
| `src/lib/configuration/actions.ts` | Config |
| `src/lib/enterprise-data/actions.ts` | EDP |
| `src/lib/intelligence-platform/actions.ts`, `intelligence-network/actions.ts` | AI / network |
| `src/lib/integration-hub/actions.ts` | Integrations |
| `src/lib/certification/actions.ts` | Certification |
| `src/lib/cloud-platform/actions.ts`, `operations-platform/actions.ts` | SaaS consoles |
| `src/lib/work/actions.ts` | Work |
| `src/lib/performance/actions.ts` | Performance |
| `src/lib/platform/notes|tags|relationships|workflow|automation|operational-loop/actions.ts` | Platform |

**AuthZ pattern:** Callers should use permission helpers; many actions also rely on RLS. Phase B: do not trust client `schoolId` without membership assert.

**Wave F.1:** Per-action input/output tables (OpenAPI-style) generated from source.

---

## 3. RPC / database functions

Defined in SQL migrations (examples: `can_access_school`, admissions inquiry RPCs, reporting helpers).  

**Inventory method:**

```bash
rg -n "create or replace function" supabase/migrations
```

**Security:** Treat `SECURITY DEFINER` and public `GRANT EXECUTE` as high risk — review Phase B + migration reviews before exposing new RPCs.

---

## 4. Webhooks & background workers

| Kind | Implementation |
|------|----------------|
| Scheduled job | Vercel cron → `/api/platform/process-queues` schedule `0 0 * * *` (`vercel.json`) |
| Queue processing | `processAllPlatformQueues` in `src/lib/platform/automation/process-queues.ts` |
| Admissions communications | `/api/admissions/process-communications` |
| Integration webhooks | Integration Hub modules (connector-specific) |

---

## 5. Rate limiting & validation

| Control | Implementation |
|---------|----------------|
| Rate limit | In-memory `src/lib/platform/api-rate-limit.ts` (scholarship and select routes) — **not multi-instance durable** |
| Input validation | Per-route; inconsistent DTO layer |
| Pagination | Per-handler |

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| 401 | Session cookie / login |
| 403 | Missing permission or must-reset-password |
| Cron 401 | `CRON_SECRET` mismatch or unset (fail closed) |
| 429 | Rate limit — wait `Retry-After` |

## Related documents

- `docs/security/phase-b/04_API_SECURITY_REPORT.md`
- `architecture/04_SECURITY_AND_INTEGRATION.md`
- `13_MONITORING_AND_OPERATIONS.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Route + actions index; deep I/O pending F.1 |
