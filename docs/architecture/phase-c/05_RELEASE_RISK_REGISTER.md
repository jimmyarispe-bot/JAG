# 05 — Release Risk Register (Phase C)

**Phase:** C · **Date:** 2026-07-17

Severity: **Critical · High · Medium · Low · Informational**

---

## Critical

### C-C1 — Migrations 171/172 not evidenced on live environments

| Field | Content |
|-------|---------|
| **Description** | Security remediations exist in repo; staging/production apply not proven in H-A9 matrix |
| **Impact** | Deployed DB may lack finance/view/storage hardening → tenant or finance exposure |
| **Mitigation** | Apply + attach CLI/SQL evidence before production claim |
| **Owner** | Ops / DBA |

### C-C2 — Durable OIOS intelligence still process-local (product claim risk)

| Field | Content |
|-------|---------|
| **Description** | C-A1 open; Production Intelligence Contract forbids durable claims |
| **Impact** | Marketing/support overclaim; restart loss |
| **Mitigation** | Keep contract labels; Wave 1 persist or signed session-only |
| **Owner** | Product + Architecture |

---

## High

### H-C1 — Live cross-tenant RLS suite incomplete

| Field | Content |
|-------|---------|
| **Description** | Unit/security tests exist; JWT org A vs B soak not fully evidenced |
| **Mitigation** | Execute Phase E / B.1 manual matrix; record results |
| **Owner** | Security |

### H-C2 — Privileged MFA enrollment not inventory-proven

| Field | Content |
|-------|---------|
| **Description** | Enforce path exists; production enrollment checklist unchecked |
| **Mitigation** | Admin audit of privileged users before GA |
| **Owner** | Ops / IAM |

---

## Medium

### M-C1 — npm audit moderate (PostCSS via Next)

| Field | Content |
|-------|---------|
| **Description** | `postcss <8.5.10` transitive via Next; `audit fix --force` would downgrade Next unsafely |
| **Mitigation** | Track Next upgrade channel; accept Moderate until upstream |
| **Owner** | Eng |

### M-C2 — In-memory rate limit on single instance

| Field | Content |
|-------|---------|
| **Description** | Without Upstash/RPC durability, multi-instance limits diverge |
| **Mitigation** | Set `UPSTASH_REDIS_REST_*` for HA production |
| **Owner** | SRE |

### M-C3 — Readiness historically under-checked secrets

| Field | Content |
|-------|---------|
| **Description** | Fixed in Phase C: production ready probe requires core secrets |
| **Mitigation** | Done in `/api/ready` |
| **Owner** | Eng |

---

## Low / Informational

| ID | Note |
|----|------|
| L-C1 | Mega-barrel still exists (compat) — Phase B reduced coupling |
| L-C2 | Dual finance / executive-graph stacks intentional (ADR) |
| I-C1 | CI unit suite gated (A.1 H-A10 closed) |
| I-C2 | Security headers present in Next config (B.1) |

---

## Residual risk after Phase C docs

Architecture/security **code** posture supports CONDITIONAL GO. Remaining Critical items are **ops evidence** and **product durability claims**, not missing middleware/IAM foundations.
