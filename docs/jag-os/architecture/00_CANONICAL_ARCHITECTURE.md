# 00 — Canonical Architecture

**Phase Ω-0 — Constitutional Architecture Audit**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [UNIVERSAL_ORGANIZATION_MODEL.md](../../../UNIVERSAL_ORGANIZATION_MODEL.md)  
**Status:** Canonical source of truth for classification  
**Type:** Documentation only — no code changes in Ω-0

---

## 1. Product statement

There is exactly one product:

**JAG™ Organizational Intelligence Operating System**

AcademyOS, Finance UX, HR UX, portals, and role dashboards are **not products**. They are domain intelligence packages or experience compositions / legacy context surfaces.

```text
JAG Experience
  = Identity + Role + Permissions + Intent + Context
  + Evidence + Organizational Memory + Digital Twin
  + Domain Intelligence + Current State
```

Portal · Dashboard · Module · Application are **outputs**, not architecture layers.

---

## 2. Four-layer architecture (only allowed classifications)

| Layer | Name | May contain | Must not contain |
|-------|------|-------------|------------------|
| **L1** | **JAG Core** | Universal engines & frameworks shared by every organization | Education-only SoR, industry pedagogy, hard-coded role portals |
| **L2** | **Domain Package** | Industry intelligence (objects, vocabulary, rules, adapters) | Parallel OS, duplicate ledger/mastery/comms engines |
| **L3** | **Experience Composition** | Presentation orchestration: widgets, briefings, command, personalization | Business logic, new engines, speculative AI |
| **L4** | **Legacy Experience Surface** | Temporary role/context routes (Teacher, Parent, Executive, …) | New product claims; expansion as independent apps |

### Layer diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ L3 Experience Composition  (+ L4 Legacy Surfaces → absorb)  │
│   Briefing · Widgets · Command · Context · Intent · Nav     │
├─────────────────────────────────────────────────────────────┤
│ L2 Domain Packages                                          │
│   Education (AcademyOS) · Healthcare · Manufacturing · …    │
├─────────────────────────────────────────────────────────────┤
│ L1 JAG Core                                                 │
│   Identity · Org · Knowledge · Finance/CFO · Twin · Memory  │
│   Workflow · Forms · Comms · Search · Innovation · Strategy │
│   Experience Orchestrator™ (future — not built in Ω-0)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Ownership rules

1. **One canonical owner per capability** (see also `src/jag/canonical/owners.ts` and consolidation `07_ENGINE_MAPPING.md`).  
2. Domain packages **consume** Core; they do not reimplement Core.  
3. Experience layers **compose** Core + Domain; they do not invent SoR.  
4. Legacy surfaces are **context definitions**, not applications.  
5. Education-specific logic never lands in JAG Core (Constitution Law 8.5).

---

## 4. Document map (Ω-0 outputs)

| Doc | Purpose |
|-----|---------|
| [01_CORE_CAPABILITIES.md](./01_CORE_CAPABILITIES.md) | Complete JAG Core inventory |
| [02_DOMAIN_PACKAGES.md](./02_DOMAIN_PACKAGES.md) | Domain packages (Education first + industry placeholders) |
| [03_EXPERIENCE_COMPOSITION.md](./03_EXPERIENCE_COMPOSITION.md) | Future Experience Orchestrator responsibilities (no implementation) |
| [04_LEGACY_SURFACES.md](./04_LEGACY_SURFACES.md) | Every existing workspace → future context |
| [05_CONSTITUTIONAL_VIOLATIONS.md](./05_CONSTITUTIONAL_VIOLATIONS.md) | Violations — document only, do not fix |
| [06_PHASE_OMEGA_ROADMAP.md](./06_PHASE_OMEGA_ROADMAP.md) | Exact order after audit |

---

## 5. Relationship to prior consolidation (P-013A)

P-013A established Education as a domain of JAG and mapped screens → engines.  
**Ω-0 supersedes product framing:** “portals” and “workspaces” are reclassified as L3/L4. Shared engines remain L1. AcademyOS remains L2.

Engineering layering in `docs/architecture/PLATFORM_CONSTITUTION.md` still applies for tenancy, permissions, and audit. Where it says “application,” read **domain intelligence package** for product intent.

---

## 6. Classification decision tree

```text
Could every industry use this without education semantics?
  YES → JAG Core (L1)
  NO  → Is it industry objects/rules/vocabulary?
          YES → Domain Package (L2)
          NO  → Is it presentation / composition only?
                  YES → Experience Composition (L3)
                        or Legacy Experience Surface (L4) if hard-coded role portal today
```

---

## 7. Success criteria (Ω-0)

- ✓ Every package / engine / module / experience classified  
- ✓ No ambiguous ownership in this pack (duplicates listed as violations)  
- ✓ One canonical four-layer architecture  
- ✓ Future implementation order established  
- ✓ No code, business logic, or UI changes in this phase  

**STOP after Ω-0.** Do not implement Experience Orchestrator until architectural review.
