# 05 — Layering and Boundaries

**Phase:** AcademyOS 1.0 Release Phase A (read-only)  
**Date:** 2026-07-17

---

## 1. Constitutional boundaries (primary)

Source of truth: `docs/architecture/PLATFORM_CONSTITUTION.md`.

| Product | Gate | Purpose |
|---------|------|---------|
| **JAG** | `JAG_ACCESS` | Founder executive intelligence & stewardship |
| **AcademyOS** | `ACADEMYOS_ACCESS` + module permissions | Organization-scoped school operations |

**Boundary rule:** Each route/feature has one primary product surface for authorization. Cross-links allowed; shared entitlement without catalog permission is not.

Engineering standards forbid hardcoded role-string gates; permissions are the only policy surface.

---

## 2. Technical layering (observed)

| Layer | Location | Responsibilities | May depend on |
|-------|----------|------------------|---------------|
| L0 Presentation | `src/app`, `src/components` | Routing, layouts, UI | L1, L2 |
| L1 Product domains | `src/lib/{admissions,finance,hr,...}` | Use cases, server actions, queries | L2, L4 |
| L2 Platform services | `src/lib/platform/{identity,events,...}` | Cross-cutting engines, registries | L3 (selectively), L4 |
| L3 OIOS intelligence | `src/lib/platform/intelligence/**` | Domain DAG, DI, soft lights | `intelligence/common`, leaf types, limited platform graph |
| L4 Infrastructure | `src/lib/supabase/**`, env, vault | Clients, crypto, env schema | External SDKs |
| L5 Data | `supabase/migrations` | Schema, RLS, grants | — |

### Dependency direction grade: **B+**

Generally respected. Residual issues are dual stacks and “intelligence” product sprawl rather than inverted layers (UI logic inside migrations, etc.).

---

## 3. Separation of concerns — assessment

### Strong

- RSC pages thin; interactive UI isolated in client components/shells  
- Middleware owns session + catalog route authz  
- Platform registries validated at build  
- Intelligence leaf types / soft lights preserve package isolation  
- IAM foundation (org isolation, break-glass, delegation) exists as platform modules with tests  

### Weak / porous

| Concern | Issue | Severity |
|---------|-------|----------|
| Intelligence meaning | OIOS vs AIP vs Network vs EDI vs FI | High |
| Finance meaning | Ops finance vs platform finance/accounting | Medium (ADR) |
| Workflow meaning | `workflow` vs `workflows` | High |
| Exec demo vs tenant truth | `exec-demo-org` default scope | Critical (product boundary) |
| Layout vs middleware authz | Dual checks (good defense-in-depth) but can drift | Medium |
| Components importing deep lib paths | Acceptable in monolith; no public package API per domain | Low |

---

## 4. Domain boundary map

```
AcademyOS ERP domains
├── Admissions (+ portal apply)
├── Students / SIS / SSIS
├── Instruction / Teacher
├── Scheduling
├── HR / Employees
├── Finance (ops) + Scholarships
├── Compliance / Certification
├── Work / Workload / Tasks
├── Configuration / Admin / Branding
├── Enterprise Data / Integrations hub
├── Cloud platform / Operations platform
└── Network / Mission Control (ops intelligence UI)

JAG / Executive
├── /exec Command Center (OIOS consumption)
├── platform/executive-* services
├── edi (Executive Decision Intelligence product tables)
└── dashboard/executive + ceo surfaces

AI / Intelligence platforms
├── OIOS DAG (library + exec)
├── AIP (intelligence-platform)
└── Intelligence Network
```

### Finding BND-01 (High)

**Description:** Domain boundaries are documented constitutionally but **not consistently named in code folders/routes**, causing parallel domains that appear to own the same capability (“intelligence”, “executive”, “workflow”).  
**Impact:** Coupling through misunderstanding; duplicate features.  
**Recommendation:** Publish and enforce a domain ownership matrix in engineering standards; rename ambiguous packages.  
**Affected files:** Listed under TD-H1 / D-06 / D-07 in companion reports.

### Finding BND-02 (Critical)

**Description:** Exec intelligence defaults to demo organization scope rather than authenticated tenant context.  
**Impact:** Boundary between demo/library and multi-tenant product is blurred at runtime.  
**Recommendation:** Bind exec runs to authorized org from authz snapshot; keep demo mode explicit and gated.  
**Affected files:**  
`src/lib/exec/intelligence.ts`  
`src/lib/exec/load-wisdom.ts`  
`src/app/exec/**`

### Finding BND-03 (Medium)

**Description:** Intentional dual stacks (graph/finance) are ADR-bounded but not mechanically enforced.  
**Impact:** Gradual boundary erosion.  
**Recommendation:** ESLint import restrictions or `knip`/custom checks for forbidden paths.  
**Affected files:** ADR paths + dual package roots.

---

## 5. Shared services boundaries

Platform services barrel (`src/lib/platform/services/index.ts`) correctly positions cross-cutting engines. Rules for consumers:

| Do | Don't |
|----|-------|
| Record activity via activity engine | Invent parallel audit tables per feature without platform review |
| Publish via events registry | Ad-hoc cross-module EventEmitters |
| Authorize via identity engine | Check `roles.includes(...)` |
| Attach evidence via KEE | Store unexplained blobs without entity linkage |
| Use ULR/PAJ for learning model | Fork skill graphs per module |

**Cohesion note:** `src/lib/platform/` is large (many sibling packages). Cohesion is good *within* packages; the platform folder itself is a **federation**, not a single module — acceptable if ownership is clear.

---

## 6. AuthN / AuthZ layering

```
Edge (middleware)
  session + password reset + catalog route permissions
    → Layout guards / page guards / MFA enforce
      → Server actions / API routes (permission + tenant-access)
        → RLS (database last line of defense)
```

**Assessment:** Correct layered defense. Residual enterprise risk is **coverage consistency** (every action asserting tenant scope) rather than missing architecture. Security Phase B/B.1 documents this in depth; architecture Phase A records it as a boundary discipline requirement.

**Affected core files:**  
`middleware.ts`  
`src/lib/platform/identity/**`  
`src/lib/auth/**`  
`src/app/**/layout.tsx`  
`supabase/migrations/*rls*.sql`

---

## 7. Module cohesion & coupling summary

| Area | Cohesion | Coupling | Notes |
|------|----------|----------|-------|
| Admissions | High | Medium | Mature domain with registry validators |
| Platform events/decision/workflow | High | Medium | Registry-centric |
| OIOS late domains | High internally | High to pipeline order | Soft reads add conceptual coupling |
| Identity | High | High fan-in | Desired |
| Exec surface | Medium | High to full DI graph | Loads entire intelligence container |
| AIP | Medium | Low to OIOS | Too disconnected from DAG (product confusion) |

---

## 8. Extensibility model

**Good:** New platform capabilities via registry + migration + validator; new OIOS domains via package + adapter + registration layer (heavy but consistent).  
**Constrained:** Frozen intelligence packages discourage structural cleanup; dual stacks require ADR updates for extension.  
**Risk:** Extending “intelligence” without choosing the correct lineage (OIOS vs AIP vs EDI).

---

## 9. Layering findings index

| ID | Severity | Title |
|----|----------|-------|
| BND-02 | Critical | Exec demo org vs tenant boundary |
| BND-01 | High | Parallel intelligence/executive naming boundaries |
| LAY-01 | High | Dual workflow package boundary |
| BND-03 | Medium | Unenforced ADR dual stacks |
| LAY-02 | Medium | Layout/middleware permission drift potential |
| LAY-03 | Low | Monolith deep imports without public package APIs |
| LAY-04 | Informational | Platform folder as federation (acceptable) |

**LAY-01** files: `src/lib/platform/workflow/**`, `src/lib/platform/workflows/**`  
**LAY-02** files: `middleware.ts`, `src/app/dashboard/**/layout.tsx`, `src/lib/platform/identity/route-authorization.ts`  
**LAY-03** files: widespread `@/lib/...` imports from `src/app` / `src/components`  
**LAY-04** files: `src/lib/platform/**`
