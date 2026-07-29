# 07 — Supreme Constitutional Architecture Review

**Phase Ω-0A** · Architectural reasoning only  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [UNIVERSAL_ORGANIZATION_MODEL.md](../../../UNIVERSAL_ORGANIZATION_MODEL.md) · Ω-0 pack `00`–`06`  
**Stance:** Assume the audit could be wrong. Challenge every conclusion.  
**Code / moves / UI / engines:** **Forbidden**

---

## 1. Executive finding

**Final recommendation: GO WITH CONDITIONS**

JAG can evolve into a universal Organizational Intelligence Operating System. The four-layer model (Core · Domain · Experience Composition · Legacy Surface) is sound. The Experience Orchestrator is the correct next composition milestone.

However, Ω-0 overstated some items as “constitutional product sins” when they are **migration debt** or **capability distinctions** (not true parallel products). Ω-1 must proceed under strict conditions so composition does not freeze the wrong owners or delete live routes prematurely.

---

## 2. P0 violation challenge

### V-01 — Portals / role workspaces as products

| Question | Answer |
|----------|--------|
| Truly a violation? | **YES for product architecture claims**; **PARTIAL for runtime code** |
| Other interpretation? | Routes and Wave `*/experience` libs are **outputs / compatibility shells**. Many already declare `productExperienceOnly` and consume Core. URLs are not products—**naming and IA** are. |
| Fix weaken JAG? | **Yes if “fix” = delete portals now.** Breaks Tenant #1 operations. |
| Fix improve JAG? | **Yes if “fix” = reframe as Contexts + Orchestrator absorption.** Strengthens Law 2. |
| Break existing architecture? | Hard cutover would. Gradual aliasing would not. |
| Migration issue? | **Primarily YES.** Debt of enterprise IA, not proof of a second OS in the kernel. |

**Overturned nuance:** Do not treat every `/dashboard/*` route as an illegal application. Treat **hard-coded role product IA + independent expansion** as the violation.  
**Confirmed:** Expanding Wave workspaces as products remains **constitutionally wrong**.

---

### V-02 — Education logic in Core trees

| Question | Answer |
|----------|--------|
| Truly a violation? | **YES for clear education SoR/UX helpers in `src/lib/platform`** (e.g. SchoolContext, parent-communication, AcademyOS-named services, PAJ/ULR as currently implemented) |
| Other interpretation? | Some “education” modules are **misnamed universal patterns**: capacity, staffing load, enrollment-as-pipeline, learner-as-person-profile. A hospital has capacity; a firm has utilization. |
| Fix weaken JAG? | Blind relocation of generic forecasting dimensions into Education **weakens** Core universality. |
| Fix improve JAG? | Moving true pedagogy/SIS helpers to Education **improves** Law 8.5. |
| Break architecture? | Large moves without adapter seams break imports. |
| Migration issue? | **YES** — ownership labeling + seam extraction before physical moves. |

**Overturned nuance:** Split V-02 into:

1. **True domain bleed** (must leave Core)  
2. **Universal ops patterns with education vocabulary** (keep Core; rename/generalize; domain supplies dimensions)

**Confirmed:** No education **SoR** (mastery, IEP, admissions pipeline tables as Core) belongs in JAG Core.

---

### V-03 — Parallel Finance stacks

| Question | Answer |
|----------|--------|
| Truly a violation? | **YES for ambiguous ledger ownership**; **NO if every path is treated as one “finance product”** |
| Other interpretation? | Several stacks are **different capabilities**:  
  • `packages/platform/finance` — enterprise ledger / treasury / AR-AP  
  • `packages/platform/cfo` — reasoning on finance facts  
  • `src/lib/finance-platform` / academyos finance — **education billing adapters**  
  • `src/lib/financial-intelligence` — analytics / profitability  
  • `src/lib/platform/finance` + `accounting` — overlapping enterprise FI (true debt) |
| Fix weaken JAG? | Forcing tuition UX through GL APIs without adapters **weakens** domain fit. |
| Fix improve JAG? | One ledger + one CFO + domain adapters **improves** Law 7. |
| Break architecture? | Premature deletion of `src/lib/finance*` breaks billing UX. |
| Migration issue? | **YES** — designate owners, freeze new callers, bridge adapters. |

**Confirmed:** Parallel **ledger** implementations are a P0 ownership defect.  
**Overturned:** “Everything named finance is a duplicate engine” is false—adapters and CFO are allowed if they do not own a second GL.

---

## 3. Special reviews

### 3.1 Education Domain — may ANY education code remain in Core?

| May remain in Core? | What | Why |
|---------------------|------|-----|
| **NO** | Mastery/assessment/IEP/admissions CRM SoR, SchoolContext as platform primitive, parent-deliver helpers, PAJ/ULR as education-only journey models | Law 4 / 8.5 |
| **YES (with rename)** | Generic capacity, utilization, pipeline-stage metrics, person learning-profile **hooks** that any industry can fill | Universal Organization Test |
| **YES (facade location OK)** | `learning-intelligence` package as **import facade** over Education SoR — provided docs state it is **not** Core SoR | P-015 pattern; hospital would not use the SoR |

**Universal Organization Test (Education SoR):** Hospital / manufacturer / law firm / nonprofit / government → **NO** → Domain Package.

---

### 3.2 Finance — parallel implementations & canonical ownership

| Stack | Role | Canonical? |
|-------|------|------------|
| `packages/platform/finance` | Ledger, COA, journals, treasury, revenue, payables, reporting, planning | **YES — Finance SoR** |
| `packages/platform/cfo` | Executive financial reasoning | **YES — CFO** |
| `packages/academyos/finance` + edu billing libs | Tuition / family account **adapters** | **YES — Domain adapters** (not second GL) |
| `src/lib/finance-platform` | Operational billing APIs (often edu-shaped) | **Bridge → FinanceEngine + adapters** |
| `src/lib/financial-intelligence` | Analytics | **Soft-read Finance/CFO** |
| `src/lib/platform/finance` + `accounting` | Overlapping enterprise FI | **Legacy-compat → retire behind package** |
| `src/lib/finance` tuition-engine helpers | Domain calculation risk | **Domain or delete if duplicate** |

**Recommendation:** Freeze new ledger writers outside `packages/platform/finance`. Education never posts journals except through Revenue/adapter APIs.

---

### 3.3 Knowledge — does Knowledge own all organizational information?

**No — not yet.**

| Information class | Owner today | Should own |
|-------------------|-------------|------------|
| Documents, OCR, evidence facts, enterprise KG | KnowledgeEngine | KnowledgeEngine |
| Repo / architecture KG | `packages/studio/knowledge` | Engineering Studio (different product surface) |
| Product KG / exec graphs | `lib/platform/knowledge-graph`, `executive-graph` | Unify or retire → Knowledge / Twin |
| Education instructional notes | Teacher tables / notes | Knowledge for artifacts; domain for pedagogy metadata |
| Structured SoR (students, invoices) | Domain / Finance DBs | Remain SoR; Knowledge holds **documents & evidence**, not every row |

**Conclusion:** Knowledge owns **organizational documentary & evidence intelligence**, not every relational fact. Parallel **document** concepts still exist (violation V-04 remains valid as P1).

---

### 3.4 Identity — one model or many user concepts?

| Concept | Location | Verdict |
|---------|----------|---------|
| Auth principal | Supabase Auth + `getSessionUser` / `IdentityContext` | **Canonical identity session** |
| Platform user profile | `users` + permissions | **Canonical** |
| Employee | `employees` / workforce | **Org person facet** (UOM), not a second login |
| Student / guardian | Education SIS | **Domain party roles** linked to identity |
| Impersonation | platform impersonation sessions | **Steward capability** on same identity |

**Conclusion:** One **authentication/authorization** model; multiple **party facets**. Not multiple IdPs—but **multiple person records** are correct under UOM if linked. Risk: treating `employee` or `student` as alternate identity engines.

---

### 3.5 Experience — can every workspace become a Context?

**YES**, via profile mapping (see [04](./04_LEGACY_SURFACES.md)):

| Workspace | Context profile | Composition inputs |
|-----------|-----------------|-------------------|
| Parent / Student / Apply | Family / Learner / Applicant | Identity + Education pack + Finance adapters + Knowledge |
| Teacher / School Leader | Teacher / Campus Leader | Scheduling + LI + Comms + Workforce |
| Executive / Network / Founder | Executive / Network / Steward | Org + Finance/CFO + Innovation + Twin/Memory |
| Finance / HR dashboards | Finance / Workforce | Core engines + domain adapters |
| `/jag/(portal)` | Adaptive OS entry | Full formula |

**How:** Context = `{ role, permissions, intent, school/org scope, enabled packs, widget set, deep-link policies }`. Legacy routes become aliases that hydrate the same profile. Orchestrator chooses widgets from evidence, not from a static portal sitemap.

---

### 3.6 Search — Core or Experience?

| Layer | Owns |
|-------|------|
| **Core** | Search **engines/indexes** (Knowledge search, entity search, registry search) |
| **Experience** | Search **UI**, ranking presentation, command-palette chrome |

**Decision:** Search capability = **Core**. Search screens = **Experience Composition**.

---

### 3.7 Command — Core or Experience?

| Layer | Owns |
|-------|------|
| **Core** | Command **routing contract** (resolve intent → actions/engines; permission checks; audit) |
| **Experience** | Command **UI** (palette, natural language entry, results presentation) |

**Decision:** Command runtime = **Core** (part of Orchestrator/kernel contract). Command UI = **Experience**. Ω-1 may ship a thin UI over a minimal Core command interface.

---

### 3.8 Digital Twin — one Twin or many?

**Constitutional requirement: ONE Twin runtime.**

| Surface | Role |
|---------|------|
| Twin runtime (`src/lib/digital-twin` / platform twin) | **Canonical store/timeline** (pick one owner in Ω-2) |
| `packages/platform/organization/twin` | UOM projection helpers |
| `packages/academyos/twin` | **Domain publisher/adapter** |

**Decision:** Every domain **publishes into one Twin**. Multiple Twin runtimes are migration debt (V-06), not a valid architecture.

---

### 3.9 Evidence Ledger — exactly one source?

**Intent: YES. Reality: NO (yet).**

Writers today include Knowledge evidence APIs, experience event publishers, Evidence Center pipeline, platform `evidence` module, and assorted audit tables.

**Decision:** One **Evidence Ledger contract** (append-only, traceable). Multiple physical tables may exist during migration if they implement the same contract and converge. Ω-2 must name the canonical writer API.

---

### 3.10 Organizational Memory — can every engine write the same memory?

**YES — and they should**, under policy:

- Engines write **memory records** with source, confidence, category, org scope.  
- Experience layers may write **operational memory** for meaningful actions (already patterned).  
- Domain packs must not invent a second memory store.

**Risk:** Unbounded writes without retention/policy. Memory is Core; write ACL is Core governance.

---

## 4. Universal Organization Test (Core sample)

| Capability | Hospital | Manufacturer | Law firm | Nonprofit | Government | Keep in Core? |
|------------|----------|--------------|----------|-----------|------------|---------------|
| Identity / IAM | Y | Y | Y | Y | Y | **YES** |
| UOM / Org | Y | Y | Y | Y | Y | **YES** |
| Knowledge | Y | Y | Y | Y | Y | **YES** |
| FinanceEngine / CFO | Y | Y | Y | Y | Y | **YES** |
| Twin / Memory / Evidence | Y | Y | Y | Y | Y | **YES** |
| Workflow / Forms | Y | Y | Y | Y | Y | **YES** |
| Innovation / Evolution | Y | Y | Y | Y | Y | **YES** |
| Experience Orchestrator | Y | Y | Y | Y | Y | **YES** |
| Learning mastery SoR | N* | N | N | N | N | **NO** (*unless later universal learning pack*) |
| Admissions CRM | N | N | N | Partial | Partial | **NO** (domain) |
| SchoolContext | N | N | N | N | N | **NO** |

\*Clinical training ≠ K-12 mastery engine.

---

## 5. Subtraction & Merge tests (high signal)

| Package / area | If deleted, what breaks? | Recommendation |
|----------------|--------------------------|----------------|
| `packages/platform/finance` | Enterprise finance APIs | **Keep — canonical** |
| `packages/platform/cfo` | CFO APIs / board reasoning | **Keep — canonical** |
| `src/lib/platform/finance` (overlap) | Some FI callers | **Consolidate** into package |
| Wave portal routes | Live education UX | **Do not delete** — alias to Contexts |
| Six role orchestrators | Role UX composition | **Merge** into Orchestrator (Ω-1–4) |
| `packages/studio/knowledge` | Engineering Studio | **Keep** (different capability from org Knowledge) |
| Admissions local “engines” | Admissions automation | **Consolidate** into Workflow/Comms config |
| Triple Education packaging | Boot/DI/pack install | **Merge ownership story** (Ω-3) — not delete blindly |
| PAJ/ULR in platform | Learning journey features | **Move ownership** to Education (or generalize) |

**Merge-as-configuration winners:** Admissions automation rules, education notification templates, governance profiles, strategy mode, industry packs — **configure**, don’t re-implement.

---

## 6. The JAG Test (examples)

| Item | Smarter OS? or another screen? |
|------|--------------------------------|
| Experience Orchestrator | **Smarter** — relevance + composition |
| New Teacher portal pages | **Screen** — reject as product expansion |
| Evidence-gated briefings | **Smarter** |
| Second ledger | **Neither** — harmful duplicate |
| Context profiles for legacy routes | **Smarter** (migration) |
| Education forecasting dimensions without generalization | **Screen/domain debt** |

---

## 7. Confirmed Constitutional Decisions

1. **One product: JAG.** Education is a Domain Package.  
2. **Four-layer classification model stands.**  
3. **Experiences are composed**, not built as independent applications.  
4. **Recommendations require evidence** (or “I don’t know”).  
5. **UOM is sacred** — configure, don’t fork.  
6. **FinanceEngine + CFO** are Core; Education finance is adapter-shaped.  
7. **One Twin runtime**; domains publish adapters.  
8. **Search & Command:** Core capability + Experience UI.  
9. **Legacy surfaces may remain** as compatibility until Orchestrator absorption.  
10. **Ω-1 Orchestrator is composition-only** — no new engines.

---

## 8. Overturned / refined Decisions (vs Ω-0 literal reading)

| Ω-0 claim | Review refinement |
|-----------|-------------------|
| All role dashboards are P0 product violations equally | **Refined:** productization of IA is P0; existence of routes is migration L4 |
| All education-named Core code must leave immediately | **Refined:** split bleed vs universal patterns; label before move |
| All finance-named stacks are duplicate engines | **Refined:** ledger vs adapter vs CFO vs analytics |
| Learning-intelligence in `packages/platform` is Core SoR | **Overturned:** facade over Domain SoR (keep location if documented) |
| Studio KG is illegal parallel Knowledge | **Refined:** Engineering Studio KG ≠ org KnowledgeEngine (different capability) |
| Decision queue = Decision engine duplicate | **Confirmed different capability** (owners.ts already) |

---

## 9. Recommended Merges

1. Role experience orchestrators → **JAG Experience Orchestrator** (logical merge first).  
2. Enterprise FI libs → **`packages/platform/finance`**.  
3. Product KG duplicates → **KnowledgeEngine / Twin** as appropriate.  
4. Comms/notifications → **one Core messaging contract**.  
5. Twin runtimes → **one Twin**.  
6. Education packaging story → **one Domain Package narrative** (Ω-3).  
7. Admissions automation/comms “engines” → **Workflow + Comms configuration**.

---

## 10. Recommended Removals

| Removal | When | Condition |
|---------|------|-----------|
| Dead parallel FI modules with zero callers | Ω-2+ | Proven unused |
| Orphan portal product claims in docs | Ω-6 | Language pass |
| Speculative AI paths without evidence hooks | Ongoing | Law 7 gate |

**Do not remove** live `/portal` or `/dashboard/*` routes in Ω-1.

---

## 11. Canonical Ownership Changes (declare now; enforce later)

| Capability | Canonical owner | Legacy |
|------------|-----------------|--------|
| Finance ledger | `packages/platform/finance` | `src/lib/platform/finance`, overlapping accounting |
| CFO | `packages/platform/cfo` | FI soft-reads only |
| Knowledge (org) | `packages/platform/knowledge` | product KG legacy-compat |
| Organization | `packages/platform/organization` | `lib/platform/organizations*` |
| Twin | Single runtime (name in Ω-2) | dual lib paths + domain adapters |
| Memory | `src/lib/memory` (until barrel) | ad-hoc stores forbidden |
| Evidence | Evidence Ledger contract (name in Ω-2) | multi-writer converge |
| Identity session | `IdentityContext` / platform identity | party facets in domain |
| Experience composition | Experience Orchestrator (Ω-1) | six role orchestrators |
| Education SoR | Education Intelligence pack | not Core |

---

## 12. Open Questions

1. Which Twin path is the runtime of record: `src/lib/digital-twin` or `src/lib/platform/digital-twin`?  
2. Is `learning-intelligence` allowed to remain under `packages/platform` permanently as a facade, or must it move under Education for purity?  
3. Primary OS URL: expand `/jag/(portal)` or evolve `/dashboard` into the adaptive shell?  
4. Evidence Ledger physical store: Knowledge evidence vs Evidence Center vs both behind one API?  
5. Should “Learner Profile” become a universal Person Competency facet in UOM (multi-industry) or stay Education-only?  
6. How hard a compatibility window for `/portal` aliases (one release vs multi-quarter)?

---

## 13. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ω-1 Orchestrator freezes wrong finance/twin owners | Permanent debt | Ownership freeze list above; no SoR moves in Ω-1 |
| Premature portal deletion | Outage for schools | L4 aliases only |
| Over-generalizing education forecasting into Core without models | Fake universality | Require industry-agnostic schemas first |
| Law 7 theater (events without evidence quality) | Trust failure | Evidence contract before “smart” briefings |
| Doc/constitution vocabulary clash (“application”) | Team confusion | Ω-6 language alignment |

---

## 14. Final Recommendation

# GO WITH CONDITIONS

### Reasoning

- The constitutional model is coherent and necessary for multi-industry JAG.  
- The codebase already contains substantial Core engines (Finance, CFO, Knowledge, Org, Twin/Memory patterns, frameworks).  
- Education can remain Tenant #1 Domain Package without being “the product.”  
- Ω-0 correctly identified real ownership debt (finance/twin/comms/KG) and productization risk (Wave portals).  
- Blind “delete portals / move everything tomorrow” would fail the Subtraction Test and break production.  
- Therefore: **authorize Ω-1 Experience Orchestrator** as composition-only, **with conditions**.

### Conditions (mandatory before/with Ω-1)

1. **No new role portals or Wave-style product workspaces.**  
2. **Ω-1 does not choose a second Finance/Twin/Memory owner** — soft-read only; ownership freeze list respected.  
3. **Legacy routes stay**; Orchestrator adds Context profiles and may deep-link.  
4. **Law 7:** every Orchestrator recommendation cites evidence or returns “I don’t know.”  
5. **V-02 split:** do not move generic capacity/utilization into Education; do not keep pedagogy SoR in Core.  
6. **Human approval** of open questions #1 (Twin owner) and #3 (primary OS URL) before Ω-2 moves.  
7. **No package moves** in Ω-1 (aligns with Ω-0A no-move rule).

### Explicitly rejected recommendations

| Option | Why rejected |
|--------|--------------|
| **GO** (unconditional) | Ignores P0 ownership ambiguity and live portal dependency |
| **NO GO** | Would freeze JAG as an education portal suite; contradicts Constitution and existing Core assets |

---

## 15. Can JAG now evolve into a universal Organizational Intelligence Operating System?

**YES — conditionally.**

It already has the kernel ingredients (identity, org model, finance/CFO, knowledge, twin/memory/evidence patterns, workflows, domain pack shape). What it lacks is **constitutional enforcement in experience**: one adaptive OS entry, one composition layer, and ruthless consolidation of duplicate SoR owners.

Ω-0A’s job was to prevent building the Orchestrator on a false map. The map is **good enough to compose**, not **clean enough to rearrange the warehouse**. Compose first (Ω-1); freeze owners and migrate SoR second (Ω-2+).

---

## 16. STOP

Do **not** implement Ω-1 until a human records approval of this **GO WITH CONDITIONS** decision (and any waived conditions).

**Await human architectural approval.**
