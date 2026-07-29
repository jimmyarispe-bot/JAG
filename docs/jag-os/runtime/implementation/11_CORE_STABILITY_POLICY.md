# 11 — Core Stability Policy

**Phase Ω-7B — Architectural freeze**  
**Authority:** [JAG_CONSTITUTION.md](../../../../JAG_CONSTITUTION.md)  
**Applies to:** `src/lib/jag/runtime/**` and Runtime public contracts  
**Effective:** After Ω-7B merge

---

## 1. Freeze declaration

**JAG Core enters architectural freeze.**

Allowed in Core without constitutional review:

- Bug fixes
- Security patches
- Clarifying documentation
- Test coverage for existing contracts
- Non-breaking type narrowing that preserves runtime behavior

**Not allowed** without explicit constitutional review:

- New Runtime subsystems or engines
- New pipeline stages or stage reordering
- Domain / Education / industry logic in Core
- UI, portals, or presentation frameworks in Core
- Alternate execution paths around contributor registration
- Weakening Action gates (Identity · Context · Intent · Cognition · Evidence)

New capabilities belong in **Runtime extensions** or **domain packages**.

---

## 2. JAG Core public contracts

Stable public surface (import from `@/lib/jag/runtime`):

| Area | Examples |
|------|----------|
| Kernel | `createJagRuntime`, `JagRuntime`, `run` options / results |
| Pipeline | Stage ids / order (`RUNTIME_PIPELINE_STAGE_*`) |
| Registry | Contributor registration + domain package registration |
| Subsystem installers | `installIdentityRuntime` … `installActionRuntime` |
| Contracts | `RuntimeIdentity`, `RuntimeOrganizationalContext`, `RuntimeIntent`, `RuntimeExperience`, `RuntimeAction`, evidence/memory/twin refs |
| Adapter contracts | `DomainAdapter`, `*Contributor` types |
| Action | `ActionExecutionRequest`, `RuntimeActionResult`, `RuntimeActionRejected`, gate codes |
| Events / errors / telemetry | Published event type constants, `RuntimeError` hierarchy |

Internal modules under subsystem folders may refactor **if** public contracts remain compatible.

---

## 3. Stable APIs (extension guarantees)

Domain packs may rely on:

1. **Contributor registration** as the only participation model.  
2. **Pipeline order:** Identity → Context → Intent → Cognition → Experience → Action → Domain → Evidence → Memory → Twin.  
3. **Action gates** rejecting incomplete requests with typed codes.  
4. **`DomainAdapterRegistrationApi`** remaining a stable subset of registry contributor methods.  
5. **Attributes bags** for pack-specific opaque data without Core type changes.

Core guarantees it will **not**:

- Import domain packages
- Hard-code industry catalogs
- Bypass Action Runtime for writes
- Soft-fail authorization (must reject)

---

## 4. Versioning policy

| Field | Meaning |
|-------|---------|
| `runtimeContractVersion` on extensions / adapters | Semver of the Runtime contract the pack targets |
| Patch (`x.y.Z`) | Bugfix / docs; no contract change |
| Minor (`x.Y.0`) | Additive, backward-compatible APIs (new optional fields, new contributor kinds) |
| Major (`X.0.0`) | Breaking contract change — requires constitutional review + migration guide |

Until a formal Runtime semver tag is published, treat Ω-7B contracts as **1.0.0-rc** freeze baseline.

---

## 5. Backward compatibility expectations

| Change | Expectation |
|--------|-------------|
| Remove a public method / type | **Breaking** — major + review |
| Add optional field to result/request | Compatible |
| Add new contributor registration API | Compatible |
| Rename with deprecated alias retained ≥1 minor | Compatible during deprecation window |
| Strengthen validation (more rejects) | Allowed when constitutionally required (documented); packs must update |
| Weaken validation | **Forbidden** without review |

Deprecated aliases (`registerIdentityProvider`, etc.) may be removed only after a documented deprecation window and major bump.

---

## 6. Change control

1. Propose Core change with constitutional citation.  
2. Prefer domain/extension solution first.  
3. If Core change is justified: document in Runtime implementation series + update this policy if guarantees change.  
4. Run Runtime unit tests (`tests/unit/jag/runtime`).  
5. Do not mark domain work “complete” by forking Core.

---

## 7. Relationship to domain checklist

Every domain package must pass [DOMAIN_ADAPTER_CHECKLIST.md](../DOMAIN_ADAPTER_CHECKLIST.md).  
Passing the checklist does **not** authorize Core changes.

---

## 8. Summary

```text
Core = frozen contracts + orchestration
Extensions / Domains = new capability
Constitutional review = only path to Core evolution
```
