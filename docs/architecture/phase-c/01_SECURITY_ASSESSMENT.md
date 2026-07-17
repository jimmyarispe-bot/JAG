# 01 — Security Assessment

**Phase:** C · **Date:** 2026-07-17  
**Companions:** `docs/security/phase-b1/**` · Phase A.1 H-A9 evidence

---

## Security score: **76 / 100**

| Band | Meaning |
|------|---------|
| 90–100 | Live ops proven + code hardened |
| **70–89** | **Code hardened; ops evidence incomplete (this phase)** |
| &lt;70 | Critical code gaps remain |

---

## Control review

### Authentication — **Strong (code)**

| Control | Evidence | Status |
|---------|----------|--------|
| Supabase session via SSR cookies | `middleware.ts`, `server-auth.ts` | Pass |
| Password reset gate | `must-reset-password.ts` in middleware | Pass |
| MFA for privileged users | `mfa-enforce.ts`, `/login/mfa-required` (B.1) | Pass (code); enrollment evidence ops |
| Public vs protected paths | `isPublicApiPath`, middleware matcher | Pass |

### Authorization — **Strong (code)**

| Control | Evidence | Status |
|---------|----------|--------|
| Permission catalog engine | `authorization-service`, route catalog | Pass |
| Route middleware authz | `authorizeRoute` + `loadAuthzSnapshot` | Pass |
| Founder / JAG gate | `requireJagAccess`, constitution P2 | Pass |
| Finance gate | `financial-security.ts` | Pass |
| API guard | `api-guard.ts` | Pass |

### Tenant isolation / RLS — **Conditional**

| Control | Evidence | Status |
|---------|----------|--------|
| Migration 171 (A.1 RLS) | `supabase/migrations/171_*.sql` | In-repo |
| Migration 172 (B.1) | `172_b1_security_remediation.sql` | In-repo |
| CI presence check | `verify-security-migrations-present.mjs` | Pass |
| Live apply + A/B RLS | H-A9 evidence matrix | **Ops open** |
| Tenant assert helpers | `tenant-access.ts` | Pass (code) |

### Secrets — **Strong (code)**

| Control | Evidence | Status |
|---------|----------|--------|
| Env schema + boot validation | `env/schema.ts`, `instrumentation.ts` | Pass |
| Vault encryption key prod-required | schema + vault crypto | Pass |
| Service role not vault default | B.1 remediation | Pass |
| Cron bearer | `process-queues` + `CRON_SECRET` | Pass |

### Server Actions / API — **Good**

| Control | Evidence | Status |
|---------|----------|--------|
| Protected APIs require session | middleware `isProtectedApi` | Pass |
| Cron dual auth (secret \|\| permission) | `process-queues/route.ts` | Pass |
| Rate limiting | `api-rate-limit.ts` (Upstash → RPC → memory) | Pass |
| AI/context tenant bind | B.1 H-08 | Pass (code) |

### Headers / payments — **Strong**

| Control | Evidence | Status |
|---------|----------|--------|
| CSP, HSTS, frame deny, nosniff | `next.config.ts` | Pass |
| `square_planned` blocked in prod | B.1 H-07 | Pass |
| Exec demo gated in prod | A.1 C-A2 `ALLOW_EXEC_DEMO_MODE` | Pass |

---

## Findings summary

| Severity | Open | Notes |
|----------|-----:|-------|
| Critical (code) | 0 | B.1 Critical addressed in repo |
| Critical (ops) | 1 | 171/172 not evidenced on live DBs |
| High | 1–2 | Live RLS suite; privileged MFA enrollment proof |
| Medium | 2 | npm audit moderate PostCSS/Next; multi-instance rate limit needs Upstash for HA |
| Low / Info | several | OIOS non-durable (product contract, not authz) |

---

## Remediation references (already shipped)

See `docs/security/phase-b1/SECURITY_REMEDIATION_REPORT.md` (C-01…H-09 family).

---

## Phase C code delta (security-adjacent)

- `/api/ready` fails when production-required secrets missing (hardens misconfig detection).
