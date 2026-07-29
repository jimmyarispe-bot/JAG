# 08 — Runtime Integration Review

**Phase Ω-7A — Architectural validation**  
**Authority:** [JAG_CONSTITUTION.md](../../../../JAG_CONSTITUTION.md) · [UNIVERSAL_ORGANIZATION_MODEL.md](../../../../UNIVERSAL_ORGANIZATION_MODEL.md) · Runtime specs `00`–`10` · Implementation docs `01`–`07`  
**Scope:** Validation only — no features, domain adapters, UI, or business logic  
**Package under review:** `src/lib/jag/runtime/**`  
**Test baseline:** 88 unit tests passing (`tests/unit/jag/runtime/`)

---

## 1. Executive finding

**Final verdict: GO WITH CONDITIONS**

The JAG Runtime is a coherent, universal operating layer. Subsystems communicate through contracts; extension is registration-only; Core contains no Education or industry packages. A first domain adapter (Education, Healthcare, Manufacturing, Legal, or Government) can plug in **without changing JAG Core**, provided the conditions in §8 are honored.

Ω-7A does **not** authorize AcademyOS productization or portal expansion.

---

## 2. Architecture validation

### 2.1 Intended dependency direction

```text
JAG Core (Runtime Kernel + subsystems)
    ↓
Contracts (framework-agnostic types)
    ↓
Registered Providers (interfaces only in Core)
    ↓
Domain Adapters (outside Core — not present yet)
```

### 2.2 Observed structure

| Layer | Location | Role |
|-------|----------|------|
| Kernel | `kernel/`, `pipeline/`, `registry/`, `events/`, `errors/`, `telemetry/` | Lifecycle, orchestration |
| Contracts | `contracts/` | Shared I/O shapes |
| Subsystems | `identity/`, `context/`, `intent/`, `cognition/`, `experience/`, `action/` | Stage runtimes |
| Providers | `*Provider` interfaces + registry registration | Extension points |
| Domain adapters | **None in Core** | Correct |

### 2.3 Dependency validation

| Check | Result |
|-------|--------|
| Runtime imports AcademyOS / Education packs | **PASS** — no matches |
| Runtime imports `src/app`, React, CSS, routes | **PASS** — none (comment-only “no React”) |
| Runtime imports Supabase / DB clients | **PASS** — none |
| Runtime imports domain SoR libs | **PASS** — none |
| Cross-imports stay inside `src/lib/jag/runtime` | **PASS** |
| Reverse imports (domain → Core contracts only) | **N/A** — no domain adapters yet; Core does not pull domains |
| Registry / pipeline import subsystem types | **PASS (internal)** — Core-internal coupling; not a domain reverse dep |

**Finding:** Dependency direction is constitutional. No redesign required.

---

## 3. Pipeline validation

### 3.1 Canonical stage order

Declared in `types/stages.ts` and enforced by pipeline merge:

```text
Identity → Context → Intent → Cognition → Experience → Action
  → Domain → Evidence → Memory → Twin
```

### 3.2 Stage communication

| Stage | Contract I/O | Wired |
|-------|--------------|-------|
| Identity | `RuntimeIdentity` via `IdentityProvider` | Yes (`installIdentityRuntime`) |
| Context | `ContextSnapshot` → `RuntimeOrganizationalContext` | Yes |
| Intent | `RuntimeIntent` via signals / `IntentProvider` | Yes |
| Cognition | `CognitiveResult` → cognition bag | Yes |
| Experience | `ExperienceModel` → `RuntimeExperience` | Yes |
| Action | `ActionExecutionRequest` → `RuntimeActionResult` | Yes |
| Domain / Evidence / Memory / Twin | Skeleton stages | **Placeholder only** |

Stages exchange data through `RuntimeContext` state and typed events — not through domain modules.

### 3.3 Pipeline validation result

| Check | Result |
|-------|--------|
| Order matches constitution / Ω-0B | **PASS** |
| Stages pluggable via registry | **PASS** |
| Contract-only inter-stage data | **PASS** |
| Post-Action publication runtimes | **PARTIAL** — stage ids exist; no publication engines yet |

---

## 4. Constitutional compliance (per subsystem)

| Subsystem | No Education | No domain imports | No business rules | No UI | No DB mutations | No duplicate engines |
|-----------|--------------|-------------------|-------------------|------|-----------------|----------------------|
| Kernel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Identity | ✓ | ✓ | ✓ (resolve only) | ✓ | ✓ | ✓ (consumes providers) |
| Context | ✓ | ✓ | ✓ | ✓ | ✓ (in-memory store only) | ✓ |
| Intent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (no LLM) |
| Cognition | ✓ | ✓ | ✓ (orchestrates) | ✓ | ✓ | ✓ (no engines shipped) |
| Experience | ✓ | ✓ | ✓ (compose only) | ✓ | ✓ | ✓ |
| Action | ✓ | ✓ | ✓ (dispatch only) | ✓ | ✓ (providers may write later) | ✓ |

**In-memory ContextStore / IntentHistory / ActionAudit** are Runtime-local state, not Organizational SoR mutations. Acceptable.

---

## 5. Extension validation

| Subsystem | Registration API | Hardcoded providers in Core |
|-----------|------------------|-----------------------------|
| Identity | `registerIdentityProvider` | **None** |
| Context | `registerContextProvider` | **None** |
| Intent | `registerIntentProvider` | **None** |
| Cognition | `registerCognitiveProvider` | **None** |
| Experience | `registerExperienceContributor` (+ widget registry) | **None** |
| Action | `registerActionContributor` (+ catalog) | **None** |
| Domain packages | `registerDomainPackage` | **None** |

**Finding:** Extension model is registration-only. Core has no hardcoded Finance/Learning/Education/Healthcare knowledge.

**Note:** Legacy parallel APIs remain (`registerExperienceProvider`, `registerActionProvider`) as fallbacks when the full subsystem runtime is not installed. They are migration affordances, not domain hardcoding.

---

## 6. Read / write separation

| Subsystem | Mutates domain SoR? | Dispatches ActionProvider? |
|-----------|---------------------|----------------------------|
| Identity | No | No |
| Context | No | No |
| Intent | No | No |
| Cognition | No | No |
| Experience | No | No |
| Action | No (Core) — **dispatches** to registered adapters | **Yes** |

**Finding:** Write-plane isolation holds. Only Action Runtime invokes execution providers.

---

## 7. Evidence chain

Action `validateExecutionRequest` requires:

| Gate | Enforced |
|------|----------|
| Identity | **Yes** — `ACTION_REQUIRES_IDENTITY` |
| Context | **Yes** — `ACTION_REQUIRES_CONTEXT` |
| CognitiveResult (`briefId`) | **Yes** — `ACTION_REQUIRES_COGNITION` |
| Evidence refs (≥1) | **Yes** — `ACTION_REQUIRES_EVIDENCE` |
| Intent | **No** — `intent` is optional on `ActionExecutionRequest` |
| Permission | **Yes** — `ActionAuthorization` |
| Registered provider | **Yes** — `ACTION_PROVIDER_MISS` |

**Gap (Condition C1):** The Ω-7A checklist asks for Intent before Action. Intent is carried when present (pipeline / audit) but not hard-rejected if missing. Tighten before or with the first mutating domain adapter.

**Gap (Condition C2):** If Action Runtime is **not** installed, legacy `RuntimeActionProvider` skeleton path can run without cognition/evidence gates. First domain must use `installActionRuntime` + `registerActionContributor` only.

---

## 8. Domain independence simulation

Hypothetical packs: Healthcare · Manufacturing · Legal · Government · Education.

Required Core changes to add any of them:

| Change type | Required? |
|-------------|-----------|
| New Runtime subsystem | **No** |
| Core business rules | **No** |
| Education/Healthcare imports in Core | **No** |
| Pipeline reorder | **No** |
| New contracts (optional pack-specific attrs) | **No** — use `attributes` / provider catalogs |

**Expected adapter surface (outside Core):**

1. `IdentityProvider` (+ optional party facets in attributes)  
2. `ContextProvider` (context families / profiles)  
3. `IntentProvider` (+ catalog entries)  
4. `CognitiveProvider` (engine adapters)  
5. `ExperienceProvider` / widgets  
6. `ActionProvider` (+ catalog permissions)  
7. Later: Evidence / Memory / Twin publishers  

**Answer: NONE — no JAG Core changes required** for a well-formed domain adapter.

---

## 9. Open risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R1 | Intent not hard-gated on Action | Medium | Condition C1 |
| R2 | Legacy Action/Experience provider paths skip full gates | Medium | Condition C2 — forbid legacy path for domain writes |
| R3 | Evidence / Memory / Twin publication stages are no-ops | Medium | Implement publication adapters with first domain (not Core forks) |
| R4 | Dual registration APIs may confuse integrators | Low | Document “contributor” APIs as canonical in domain guide |
| R5 | No dedicated CI import-boundary rule for `src/lib/jag/runtime` | Low | Add lint/test when first domain lands |
| R6 | In-memory audit/history not durable | Low | Platform audit adapter at integration time |

---

## 10. Recommended changes

**Required before / with first domain adapter (conditions):**

1. **C1** — Reject Action execution when `intent` is missing (or explicitly allowlisted system actions).  
2. **C2** — Document and enforce: mutating domains must `installActionRuntime`; do not use legacy `registerActionProvider` for writes.  
3. **C3** — Provide a short “Domain Adapter Checklist” (registration only; no Core PRs for domain logic).

**Not required for GO:**

- Implementing Evidence/Memory/Twin engines inside Core  
- Building AcademyOS or Education adapters in this phase  
- Portal / UI work  
- Removing legacy provider APIs immediately (deprecate later)

**No constitutional violation found that demands an emergency Core refactor in Ω-7A.**

---

## 11. Final verdict

### GO WITH CONDITIONS

| Criterion | Status |
|-----------|--------|
| Runtime validated as universal OS layer | **Met** |
| No Core changes required for a domain pack | **Met** |
| Ready for first domain adapter | **Met under C1–C3** |
| AcademyOS / UI / engines in this phase | **Forbidden — STOP** |

### Conditions summary

1. Harden Action Intent requirement (or document system-action exception).  
2. Use Action Runtime contributor path only for domain mutations.  
3. Ship domain adapter checklist; keep Core free of domain code.

### Explicit stop

Do **not** build AcademyOS, Education widgets, or portal products next.  
Await human approval, then proceed to the first **domain adapter** under the conditions above.

---

## 12. Evidence appendix

| Artifact | Signal |
|----------|--------|
| `src/lib/jag/runtime/**` | No Education/AcademyOS/React/DB imports found |
| `RUNTIME_PIPELINE_STAGE_IDS` | Full pipeline order present |
| Action `validateExecutionRequest` | Identity · Context · Cognition · Evidence gated |
| Registry registration APIs | All six subsystems + domain package registration |
| `tests/unit/jag/runtime/*` | **88** tests passing at review time |
| Implementation docs `01`–`07` | Subsystem contracts documented |
