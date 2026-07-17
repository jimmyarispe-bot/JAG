# 04 — Duplication Analysis

**Phase:** AcademyOS 1.0 Release Phase A (read-only)  
**Date:** 2026-07-17

> Historical baseline: `docs/architecture/audit/DUPLICATE_CODE_REPORT.md` (pre-stabilization).  
> This Phase A analysis updates severity after A2–A3 commons extraction.

---

## 1. Executive summary

Duplication remains concentrated in the **OIOS intelligence domain layer**, but the **highest-severity primitive duplication** (scoring helpers, Map repository shells, publisher registries) has been **partially consolidated** into:

`src/lib/platform/intelligence/common/`

What remains is mostly:

1. Structural boilerplate inside frozen domain packages (engines, projections, learning loops)  
2. Intentional dual product stacks (finance, executive-graph)  
3. Parallel “intelligence” product lineages at the application level  
4. Naming collisions that amplify perceived duplication  

---

## 2. Status of prior Critical duplication

| Pattern (historical) | Pre-A2–A3 | Current (Phase A) | Severity now |
|----------------------|-----------|-------------------|--------------|
| `clamp` / scoring helpers ×27–36 | Critical | Shared via `common/numeric`, `bands`, etc.; many models import common | **Low–Medium** residual |
| In-memory RepositoryStore ×~33 | Critical | Shared `common/in-memory-repository.ts`; domains still wrap it | **High** (ephemeral semantics), Medium (code clone) |
| RegistryStore ×~26 | High | Shared `common/publisher-registry.ts` | **Low–Medium** |
| `ResultLightBase` ×~16 | Critical | Still redefined in domain `types.ts` | **Medium** |
| `create-service` monolith | High | Split to `registration/*` | **Resolved** (Informational) |
| `area-factory` / engine shells | High | Still structural clones in late domains | **Medium–High** |

---

## 3. Remaining duplication clusters

### D-01 — ResultLightBase and light DTO shells (Medium)

- **Description:** ~16 domain `types.ts` files still declare private/local `ResultLightBase` (or equivalent) plus many `*ResultLight` extensions.
- **Impact:** Light DTO drift; harder cross-domain tooling.
- **Recommendation:** Move base to `common/result-lights.ts`; domains extend only.
- **Affected files:**  
  `src/lib/platform/intelligence/competitive/types.ts`  
  `src/lib/platform/intelligence/political/types.ts`  
  `src/lib/platform/intelligence/environmental/types.ts`  
  `src/lib/platform/intelligence/wisdom/types.ts`  
  `src/lib/platform/intelligence/institutional-memory/types.ts`  
  `src/lib/platform/intelligence/resilience/types.ts`  
  `src/lib/platform/intelligence/impact/types.ts`  
  `src/lib/platform/intelligence/economic/types.ts`  
  `src/lib/platform/intelligence/systems/types.ts`  
  `src/lib/platform/intelligence/reputation/types.ts`  
  `src/lib/platform/intelligence/ethical/types.ts`  
  `src/lib/platform/intelligence/cultural/types.ts`  
  `src/lib/platform/intelligence/behavioral/types.ts`  
  `src/lib/platform/intelligence/collective/types.ts`  
  `src/lib/platform/intelligence/ecosystem/types.ts`  
  `src/lib/platform/intelligence/stakeholder/types.ts`

### D-02 — Engine / projection / learning-loop shells (Medium–High)

- **Description:** Near-copy `*-forecast-engine`, `*-trend-engine`, `*-scenario-engine`, `early-warning-engine`, `closed-learning-loop`, `projection` patterns across late sprints.
- **Impact:** Multiplicative bug-fix cost; generator temptation.
- **Recommendation:** Shared parameterized engines when freeze rules allow; until then treat as accepted frozen debt.
- **Affected files:**  
  `src/lib/platform/intelligence/**/*-forecast-engine.ts`  
  `src/lib/platform/intelligence/**/*-trend-engine.ts`  
  `src/lib/platform/intelligence/**/*-scenario-engine.ts`  
  `src/lib/platform/intelligence/**/early-warning-engine.ts`  
  `src/lib/platform/intelligence/**/closed-learning-loop.ts`  
  `src/lib/platform/intelligence/**/projection.ts`

### D-03 — Dual CompetitiveIntelligence (High — naming)

- **Description:** Same class name in market submodule and competitive domain.
- **Impact:** Import ambiguity; false “duplicate feature” perception.
- **Recommendation:** Rename market class; keep domain package name.
- **Affected files:**  
  `src/lib/platform/intelligence/market/competitive-intelligence.ts`  
  `src/lib/platform/intelligence/competitive/competitive-intelligence.ts`  
  `src/lib/platform/intelligence/competitive/competitive-engine.ts`  
  `src/lib/platform/intelligence/competitive/service.ts`

### D-04 — Intentional dual executive-graph packages (Medium — accepted with ADR)

- **Description:** `platform/executive-graph` vs `intelligence/executive-graph`.
- **Impact:** Onboarding and wrong-import risk.
- **Recommendation:** Enforce ADR-A1-001; do not “dedupe” blindly.
- **Affected files:**  
  `src/lib/platform/executive-graph/**`  
  `src/lib/platform/intelligence/executive-graph/**`  
  `docs/architecture/adr/ADR-A1-001-executive-graph-packages.md`

### D-05 — Intentional dual finance stacks (Medium — accepted with ADR)

- **Description:** Operational `lib/finance` vs `platform/finance` / `platform/accounting`.
- **Impact:** Feature landing in wrong stack.
- **Recommendation:** Enforce ADR-A1-002 ownership matrix.
- **Affected files:**  
  `src/lib/finance/**`  
  `src/lib/platform/finance/**`  
  `src/lib/platform/accounting/**`  
  `docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md`

### D-06 — Dual workflow packages (High — cognitive)

- **Description:** `platform/workflow` (B-04 platform engine) vs `platform/workflows` (executive workflow engine).
- **Impact:** Frequent wrong imports.
- **Recommendation:** Rename executive package. **Done (Phase B H-A2):** canonical `@/lib/platform/executive-workflows`; `@/lib/platform/workflows` is a compatibility shim.
- **Affected files:**  
  `src/lib/platform/workflow/**`  
  `src/lib/platform/workflows/**`

### D-07 — Parallel application “intelligence” products (High — product duplication)

- **Description:** Overlapping user-facing concepts across OIOS Exec, AIP hub, Intelligence Network, EDI, FI.
- **Impact:** Duplicate dashboards/metrics narratives; unclear authoritative KPI.
- **Recommendation:** Product IA consolidation — not a blind code merge.
- **Affected files:**  
  `src/lib/platform/intelligence/**`  
  `src/lib/intelligence-platform/**`  
  `src/lib/intelligence-network/**`  
  `src/lib/edi/**`  
  `src/lib/financial-intelligence/**`  
  `src/app/dashboard/intelligence/**`  
  `src/app/dashboard/executive/**`  
  `src/app/dashboard/finance/intelligence/**`  
  `src/app/exec/**`

### D-08 — Profile workspace patterns (Low–Medium)

- **Description:** Students / families / employees / admissions case profiles share structural patterns (sections, header extras, workspace shells).
- **Impact:** Some repeated UI wiring; partially mitigated by `platform/profile` and workspace design system.
- **Recommendation:** Continue converging on platform profile registry; avoid new bespoke shells.
- **Affected files:**  
  `src/lib/students/profile/**`  
  `src/lib/families/profile/**`  
  `src/lib/employees/profile/**`  
  `src/lib/admissions/profile/**`  
  `src/components/platform/profile-workspace/**`  
  `src/lib/platform/profile/**`

### D-09 — Report/export API handlers (Low)

- **Description:** Multiple `*/reports/route.ts` and board-export handlers with similar authz + streaming patterns.
- **Impact:** Inconsistent error/authz handling risk.
- **Recommendation:** Shared report-route helper (authz + rate limit + content type).
- **Affected files:**  
  `src/app/api/**/reports/route.ts`  
  `src/app/api/**/board-export/route.ts`  
  `src/app/api/**/board-report/route.ts`

### D-10 — Collaboration engine filenames (Low)

- **Description:** Repeated `collaboration-engine.ts` across domains.
- **Impact:** Navigation noise.
- **Recommendation:** Domain-prefixed filenames.
- **Affected files:**  
  `src/lib/platform/intelligence/**/collaboration-engine.ts`

---

## 4. What should NOT be “deduplicated”

| Area | Why keep separate |
|------|-------------------|
| Product `actions.ts` per domain | Clear mutation boundaries; server-action locality |
| Domain contracts/types per OIOS package | Freeze + leaf discipline |
| ADR dual stacks | Different product ownership |
| Portal vs dashboard components | Different UX/authz contexts |

---

## 5. Duplication score (Phase A)

| Dimension | Score (0–10) | Notes |
|-----------|-------------:|-------|
| Primitive consolidation | 7 | Commons exist and are used |
| Structural domain boilerplate | 4 | Still heavy in late packages |
| Product surface uniqueness | 5 | Parallel intelligence stories |
| Intentional dual-stack clarity | 6 | ADRs present; enforcement soft |
| **Overall duplication health** | **5.5** | Improved vs pre-stabilization ~3 |

---

## 6. Recommended consolidation order

1. Provenance + persistence strategy (reduces “fake product” duplication of dashboards).  
2. Rename colliding/ambiguous packages (`workflows`, CompetitiveIntelligence).  
3. Extract `ResultLightBase`.  
4. Parameterize late engines only if freeze policy allows.  
5. Leave ADR dual stacks until a dedicated convergence epic.
