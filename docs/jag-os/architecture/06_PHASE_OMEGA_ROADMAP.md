# 06 — Phase Ω Roadmap

**Phase Ω-0 complete when this pack is reviewed.**  
**Authority:** [00_CANONICAL_ARCHITECTURE.md](./00_CANONICAL_ARCHITECTURE.md)  
**Rule:** Do not reorder without Constitutional Review.

---

## Exact implementation order (AFTER audit review)

### Phase Ω-0 — Canonical Architecture Audit ✅ (this pack)

| Deliverable | Status |
|-------------|--------|
| Four-layer architecture defined | Done |
| Core / Domain / Composition / Legacy inventories | Done |
| Violations documented (no fixes) | Done |
| Roadmap locked | Done |
| Code / UI / business logic changes | **Forbidden** |

**STOP for architectural review.** Do not start Ω-1 until approved.

---

### Phase Ω-1 — JAG Experience Orchestrator™ (composition only)

| In scope | Out of scope |
|----------|--------------|
| Compose workspace from Universal Formula inputs | New engines |
| Widget / action registry | New role portals |
| Evidence-backed briefing + next actions | Education SoR changes |
| Universal command interface (thin) | Fixing all P1 duplicates |
| Context profile model (Teacher, Parent, …) | Moving packages |

**Exit:** One OS entry can render a composed experience for at least two contexts without hard-coded portal shells.

---

### Phase Ω-2 — Canonical Core ownership freeze

| Focus | Target |
|-------|--------|
| Finance | Single owner: `packages/platform/finance` + `cfo` |
| Knowledge / Graph | KnowledgeEngine canonical; retire duplicate product KGs |
| Communications | Core notification/comms; domain templates only |
| Twin / Memory / Evidence | Single runtime + adapters |
| Organization | UOM `@organization` canonical |
| Workflow / Decision | One framework each |

**Exit:** `src/jag/canonical/owners.ts` + this pack agree; no new parallel engines allowed by CI/docs gate.

---

### Phase Ω-3 — Education Intelligence package consolidation

| Focus | Target |
|-------|--------|
| Packaging | Unify `packages/academyos` · `src/applications/academyos` · `src/packages/academy` ownership story |
| Mis-homed Core | Relocate PAJ/ULR/parent-communication/SchoolContext docs+code ownership to Education |
| Admissions engines | Automation/comms → configure Core Workflow/Comms |
| Learning | SoR remains Education; LI facade remains non-SoR |

**Exit:** Education is clearly one Domain Package; Core has no education SoR.

---

### Phase Ω-4 — Legacy surface absorption

| Focus | Target |
|-------|--------|
| Map | [04_LEGACY_SURFACES.md](./04_LEGACY_SURFACES.md) contexts |
| Absorb | Parent, Student, Teacher, School Leader, Executive, Admissions as Orchestrator context profiles |
| Retain | Deep links into domain workflows only when required |
| Language | Docs: Portal → Context |

**Exit:** Primary UX entry is JAG adaptive environment; legacy routes are compatibility aliases.

---

### Phase Ω-5 — Industry expansion readiness

| Focus | Target |
|-------|--------|
| Healthcare / Manufacturing / Government stubs | Promote from reference packages when ready |
| Prove | Same Orchestrator + Core + new Domain Package — no JAG fork |

**Exit:** Second industry context runs without new OS.

---

### Phase Ω-6 — Constitutional language alignment

| Focus | Target |
|-------|--------|
| Amend | `PLATFORM_CONSTITUTION.md` application vocabulary → domain packages |
| Amend | Consolidation portal maps → context maps |
| Gate | Cursor / CI constitutional checklist remains mandatory |

---

## Explicit non-goals until review

- ❌ Build Experience Orchestrator before Ω-0 review approval  
- ❌ Build new engines  
- ❌ Build new UI products / portals  
- ❌ Silent refactors or package moves during Ω-0  
- ❌ Mark Wave workspaces “production products”

---

## Review checklist (human)

- [ ] Accept four-layer model  
- [ ] Accept Core inventory (01)  
- [ ] Accept Domain inventory (02)  
- [ ] Accept Orchestrator responsibilities without implementation (03)  
- [ ] Accept Legacy → Context map (04)  
- [ ] Prioritize violations P0 → P1 (05)  
- [ ] Authorize Ω-1 start  

**Until checked: STOP.**
