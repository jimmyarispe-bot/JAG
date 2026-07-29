# 03 — Experience Composition

**Phase Ω-0** · Classification: **EXPERIENCE COMPOSITION**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [docs/jag-os/experience-orchestrator/01_OVERVIEW.md](../experience-orchestrator/01_OVERVIEW.md)  
**Status:** Specification / inventory only — **NO IMPLEMENTATION IN Ω-0**

---

## 1. Definition

Experience Composition is presentation orchestration only.

It assembles:

```text
JAG Experience
  = Identity + Role + Permissions + Intent + Context
  + Evidence + Organizational Memory + Digital Twin
  + Domain Intelligence + Current State
```

It does **not** invent mastery, ledger, HR, strategy, or admissions business logic.

---

## 2. Future: JAG Experience Orchestrator™ (reserved Core capability)

| Responsibility | Description |
|----------------|-------------|
| Dynamic workspace | Build UI model from identity, permissions, context, intent, org state, evidence |
| Widget & action assembly | Reuse widgets/actions; do not hard-code portals |
| Personalized briefing | “What does JAG already know?” + next-best actions |
| Evidence gating | Every recommendation traces Twin / Evidence / Memory / Knowledge / domain engines — or “I don’t know” |
| Workflow routing | Enter domain workflows only when necessary |
| Universal command | Users interact with JAG, not a product catalog |

**Constitutional Review (Orchestrator):**

| # | Question | Answer |
|---|----------|--------|
| 1 | JAG Core? | **YES** (composition runtime) |
| 2 | Outside education? | **YES** |
| 3 | Domain-specific? | **NO** |
| 4 | Presentation only? | **YES** (orchestration of presentation + routing) |
| 5 | Violate? | **NO** if it creates no engine and no portal product |
| 6 | Duplicate? | **NO** if it replaces per-role orchestrators rather than adding a seventh |

**DO NOT BUILD in Ω-0.** Wait for architectural review → then Phase Ω-1 per [06](./06_PHASE_OMEGA_ROADMAP.md).

---

## 3. Current composition-adjacent assets (inventory)

| Asset | Location | Purpose | Classification | Future state |
|-------|----------|---------|----------------|--------------|
| JAG experience shell port | `src/jag/experience` | Shell ownership | **EXPERIENCE COMPOSITION** | Orchestrator chrome |
| Experience System UI | `src/components/experience-system` | Shared shells, widgets, feedback | **EXPERIENCE COMPOSITION** | Widget registry input |
| Mr. JAG UI surfaces | Coach/Help components | Guide UX | **EXPERIENCE COMPOSITION** | Context-scoped Coach |
| Studio recommendations / decision-center UX | `packages/studio/*` UX modules | Studio composition | **EXPERIENCE COMPOSITION** | Stay Studio product |
| Per-role experience orchestrators | See §4 | Role-specific composition | **LEGACY** wrapping composition | Merge into Orchestrator |
| `/jag/(portal)/**` shell | App routes | OS shell routes | **EXPERIENCE COMPOSITION** *(target)* | Primary OS entry |

---

## 4. Per-role orchestrators (today — not the Orchestrator)

These are **composition code** living under role folders. Constitutionally they are stepping stones, not products.

| Orchestrator | Location | Classification |
|--------------|----------|----------------|
| Parent | `src/lib/portal/experience` | Composition + Legacy surface |
| Student | `src/lib/portal/student-experience` | Composition + Legacy surface |
| Teacher | `src/lib/teacher/experience` | Composition + Legacy surface |
| School Leader | `src/lib/school-leader/experience` | Composition + Legacy surface |
| Executive | `src/lib/executive/experience` | Composition + Legacy surface |
| Admissions | `src/lib/admissions/experience` | Composition + Legacy surface |

**Gap:** No `src/lib/jag/experience-orchestrator` (or equivalent) yet.

---

## 5. What belongs in Experience Composition

| In scope | Out of scope |
|----------|--------------|
| Workspace composition | New intelligence engines |
| Widget composition | Domain SoR mutations without engines |
| Role / permission adaptation | Education-only Core modules |
| Briefings & next actions (evidence-backed) | Speculative AI |
| Notifications UI | Parallel notification engines |
| Search UI / Command UI | Hard-coded multi-product IA as architecture |
| Context & Intent models | Forking UOM |
| Navigation personalization | “Portal products” |

---

## 6. Constitutional review (layer)

| # | Question | Answer |
|---|----------|--------|
| 1 | JAG Core? | Orchestrator runtime → **YES**; widgets → composition |
| 2 | Outside education? | **YES** |
| 3 | Domain-specific? | **NO** (domain supplies widgets/data) |
| 4 | Presentation only? | **YES** |
| 5 | Violate? | **YES** if expanded as new portals instead of one OS |
| 6 | Duplicate? | **YES** today — six role orchestrators vs one future Orchestrator |
