# 10 — Runtime Implementation Plan

**Planning only.** This phase (Ω-0B) does **not** implement. Coding begins only after architectural approval.

Authority: [07_SUPREME_ARCHITECTURE_REVIEW.md](../architecture/07_SUPREME_ARCHITECTURE_REVIEW.md) · [06_PHASE_OMEGA_ROADMAP.md](../architecture/06_PHASE_OMEGA_ROADMAP.md)

---

## 1. Preconditions (from Ω-0A)

Before any Runtime code:

- [ ] Human **GO** on Ω-0A conditions  
- [ ] No new portal products  
- [ ] Soft-read only for contested Finance/Twin consolidations  
- [ ] Law 7 evidence gating in cognition path  
- [ ] No package moves in Ω-1  

---

## 2. Phased delivery

### Phase Ω-1 — Experience Orchestrator (first Runtime slice)

**Implement:** Experience Runtime + thin Identity/Context/Intent/Cognition/Action adapters.

| Deliverable | Notes |
|-------------|-------|
| Pipeline skeleton | Identity→…→Experience compose |
| Context Profile map for legacy surfaces | Soft map; keep routes |
| CognitiveBrief v0 | Merge existing role orchestrator reads; evidence gate |
| WorkspaceModel | Widget composition over existing shells |
| Action adapter | Dispatch to existing server actions / workflows |

**Do not:** new engines, portal apps, education package moves, Finance merges.

### Phase Ω-2 — Core contract hardening

| Deliverable | Notes |
|-------------|-------|
| Evidence Ledger contract name + writers converge | Soft-read first |
| Single Twin runtime naming + domain adapters | |
| Memory API as sole write path from Action | |
| Finance soft-read consolidation prep | Per Ω-0A |

### Phase Ω-3 — Domain Package narrative

| Deliverable | Notes |
|-------------|-------|
| Education pack registers Context/Intent/Widget/Action | |
| Remove education-as-Core bleed (labeled items) | |

### Phase Ω-4 — Full Cognitive Runtime

| Deliverable | Notes |
|-------------|-------|
| CognitiveContributor registry | |
| Conflict detection + reasoning traces | |
| Budgets / partial briefs | |

### Phase Ω-5 — Full Action Runtime

| Deliverable | Notes |
|-------------|-------|
| Unified Action catalog | |
| Undo tokens + approval bridge | |
| Outbox for Evidence/Memory/Twin | |

### Phase Ω-6 — Language & legacy absorption

| Deliverable | Notes |
|-------------|-------|
| Portal → Context language pass | |
| Retire redundant role orchestrators | After parity |

---

## 3. Suggested module layout (future)

```text
src/jag/runtime/
  identity/
  context/
  intent/
  cognition/
  experience/
  action/
  pipeline/
  events/
packages/*/manifest  → registers extensions
```

Exact paths TBD at Ω-1 kickoff; must not contradict Core package ownership.

---

## 4. Migration of existing role orchestrators

| Current | Target |
|---------|--------|
| `src/lib/*/experience` role orchestrators | CognitiveContributor + Experience widgets under Context Profiles |
| `/portal`, `/dashboard/*` | Legacy surface hosts of WorkspaceModel |
| Studio decision UX | Remains Studio; may share CognitiveContributor interface |

Merge **logically** before deleting code.

---

## 5. Validation gates (when coding exists)

- Runtime contract tests (pipeline order, evidence gate)  
- `authorize` on Action path  
- No new `ENTITY_RELEASE_STATUS` claims without CRUD gates  
- `npm run validate:release` for any module shipping claims  

---

## 6. Explicit non-work (Ω-0B complete)

This document set is **done** when specs 00–10 exist and are committed.

**STOP.** Do not begin Ω-1 coding until approval.

---

## 7. Approval checklist

- [ ] Runtime overview accepted  
- [ ] Six subsystem specs accepted  
- [ ] Pipeline & events accepted  
- [ ] Extension model accepted  
- [ ] Ω-1 slice boundary accepted  
- [ ] **GO** to implement Ω-1
