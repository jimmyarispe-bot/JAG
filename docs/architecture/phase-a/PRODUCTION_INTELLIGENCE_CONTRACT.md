# Production Intelligence Contract

| Field | Value |
|-------|--------|
| **Document** | Production Intelligence Contract |
| **Status** | **Ratified** (Phase A.1 Wave 0 — C-A3) |
| **Date** | 2026-07-17 |
| **Authority** | Governs what may be claimed as production intelligence for AcademyOS / JAG |
| **Companions** | [PLATFORM_CONSTITUTION.md](../PLATFORM_CONSTITUTION.md) · [phase-a/07_PRIORITIZED_REMEDIATION_PLAN.md](./07_PRIORITIZED_REMEDIATION_PLAN.md) · Exec operating mode (`src/lib/exec/scope.ts`) |

---

## 1. Purpose

This contract prevents overclaiming “enterprise / production intelligence.” It defines:

1. Which intelligence **surfaces and modules** are production-bound vs library/demo  
2. **Durability** semantics (what survives restart / multi-instance)  
3. **Authorization** gates  
4. **Provenance** requirements operators must see  

Until Wave 1 closes C-A1 (persist **or** signed session-only acceptance), terminal OIOS wisdom/collective outputs are **not** durable multi-tenant production intelligence.

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Production-bound** | Live tenant path with authz, org scope, and honest provenance; may still be session-scoped until persistence lands |
| **Library-complete** | Domain package + unit tests exist; not alone a production product claim |
| **Demo mode** | Explicit `EXEC_OPERATING_MODE=demo` using synthetic tenant `exec-demo-org` (blocked in production unless `ALLOW_EXEC_DEMO_MODE=true`) |
| **Tenant mode** | Authenticated organization scope via `getExecRuntime()` |
| **dataMode** | Widget provenance: `live` \| `cached` \| `model-baseline` \| `synthetic` |

---

## 3. Product surface map

| Surface | Path / package | Production posture | Notes |
|---------|----------------|--------------------|-------|
| Executive Command Center | `/exec/**`, `src/lib/exec/**` | **Production-bound (conditional)** | Requires `JAG_ACCESS`; mode + provenance banner mandatory (C-A2) |
| AcademyOS ops modules | `/dashboard/**` (admissions, finance, HR, SIS, …) | **Production-bound** | School/org RLS; not OIOS wisdom |
| AIP (prompt/provider/queue) | `src/lib/intelligence-platform/**`, dashboard AIP routes | **Production-bound (governance)** | LLM governance — **not** a second OIOS |
| EDI / Financial Intelligence product tables | `src/lib/edi/**`, `src/lib/financial-intelligence/**` | **Production-bound (supporting)** | Supporting tables; not terminal wisdom truth |
| Intelligence Network / benchmarks | `src/lib/intelligence-network/**` | **Comparative / library** | Must not be labeled as org wisdom |
| OIOS domain libraries (39 modules) | `src/lib/platform/intelligence/**` | **Library-complete** | DAG complete; persistence deferred (C-A1) |

---

## 4. Module production matrix (OIOS DAG)

Authoritative IDs: `INTELLIGENCE_MODULE_IDS` in  
`src/lib/platform/intelligence/infrastructure/types.ts`.

| Tier | Modules | Claim allowed |
|------|---------|---------------|
| **A — Exec-consumed (conditional)** | `oios-core`, `organization-health`, `organization-dna`, `wisdom`, `opportunity`, `legal-compliance-risk`, `predictive` (Ask soft path), connector-enriched financial/ops soft-lights | May power `/exec` **with** provenance; **not** “durable enterprise memory” |
| **B — Library / pipeline** | Remaining modules through `collective` (market, competitive, environmental, ethical, systems, …) | Library + pipeline only until productized with durability + UX provenance |
| **C — Explicitly non-claims** | Any baseline/template-only late domain without live feed | Must render as `model-baseline` or `synthetic` — never implied live |

**Terminal rule:** `wisdom` and `collective` are **library-complete and exec-visible**, not durable production records, until Wave 1 persistence or a signed session-only addendum.

---

## 5. Durability

| Concern | Current contract |
|---------|------------------|
| OIOS assessment repositories | **Process-local** (`Map` / in-memory) — lost on restart; not multi-instance consistent |
| Exec connector caches | Process-local connector stores; `live`/`cached` only after sync for that org scope |
| Operational AcademyOS tables | **Durable** via Supabase + RLS (school/org) |
| Retention / replay / approvals for wisdom | **Not implemented** — do not claim SLA or audit retention for OIOS judgments |

**Marketing / sales rule:** Do not describe wisdom/collective as durable, multi-tenant, enterprise-grade intelligence memory until C-A1 is closed.

---

## 6. Authorization

| Surface | Gate |
|---------|------|
| `/exec/**` | `JAG_ACCESS` via `requireJagAccess()` + authenticated session |
| Executive dashboard intelligence | `executive.intelligence` / `executive.dashboard` (catalog) — product surface per constitution |
| Cross-org | Forbidden without platform authority / audited elevation |
| Demo mode in production | Requires `ALLOW_EXEC_DEMO_MODE=true` **and** explicit `EXEC_OPERATING_MODE=demo` |

Constitution P1 applies: permission engine only — no role-string gates in feature code.

---

## 7. Provenance

| Requirement | Implementation |
|-------------|----------------|
| Shell-level mode banner on all `/exec` pages | `ExecShell` + `getExecRuntime()` (`demo` \| `tenant`) |
| Widget-level data mode | `DataModeBadge` / `dataMode` on view models (`live` \| `cached` \| `model-baseline` \| `synthetic`) |
| No silent demo tenant | Production blocks unresolved demo scope (C-A2) |
| Tenant name must match scope | Runtime `organizationName` comes from the same resolver as intelligence `organizationId` |

**Operator rule:** If badges say baseline/synthetic, treat outputs as decision support models — not factual ledger truth.

---

## 8. Environment controls

| Variable | Purpose |
|----------|---------|
| `EXEC_OPERATING_MODE` | `demo` \| `tenant` (optional; default prefers tenant when context exists) |
| `ALLOW_EXEC_DEMO_MODE` | Production opt-in for demo mode only |

Defined in `src/lib/platform/env/schema.ts`.

---

## 9. Acceptance / ratification

| Criterion | Status |
|-----------|--------|
| Written contract lists prod vs library modules | **Met** (this document) |
| Durability stated honestly | **Met** (§5) |
| Authz stated | **Met** (§6) |
| Provenance required on exec | **Met** (C-A2 + §7) |
| C-A1 persistence | **Open** — Wave 1 |
| Full GO for “enterprise intelligence” marketing | **Blocked** until C-A1 + ops gates |

**Ratified for Wave 0:** Leadership may describe AcademyOS as enterprise-capable for **school operations** and **library-complete** for OIOS, with Exec intelligence as **conditional / provenance-labeled**, not durable multi-tenant wisdom.

---

## 10. Change control

Amendments require Architecture + Product sign-off. Persistence or session-only formal acceptance updates §4–§5 and closes C-A1 under Wave 1 Option A or B.
