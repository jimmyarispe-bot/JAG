# JAG Experience Orchestrator™

| Field | Value |
|-------|--------|
| **Status** | Next constitutional milestone — specification |
| **Type** | Composition / presentation orchestration layer |
| **Not** | A new intelligence engine · a portal · a domain product |
| **Authority** | [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) |

---

## Purpose

Make every intelligence engine usable through a **single adaptive operating environment**.

This layer does **not** invent mastery, finance, HR, or strategy logic. It **composes** what JAG already knows into a personalized experience.

---

## Responsibilities

1. **Dynamic workspace** — Assemble UI from identity, role, permissions, context, intent, organizational state, and evidence.  
2. **Reusable widgets & actions** — Prefer composition over hard-coded portals (`/portal`, `/dashboard/teacher`, `/dashboard/executive`, …). Those routes may remain as **contexts / deep links**, not products.  
3. **Personalized briefing** — “What does JAG already know?” plus next-best actions, each evidence-backed (Law 7).  
4. **Workflow routing** — Enter domain workflows only when the OS cannot resolve the need automatically.  
5. **Universal command interface** — Users interact with JAG; they do not navigate a catalog of applications.

---

## Universal Formula (runtime inputs)

```text
JAG Experience
  = Identity + Role + Permissions + Intent + Context
  + Evidence + Organizational Memory + Digital Twin
  + Domain Intelligence + Current State
```

Outputs may look like dashboards or workspaces. Architecture must not treat those outputs as separate products.

---

## Constitutional Review (Law 8) — orchestrator scope

| Question | Expected answer for this milestone |
|----------|-------------------------------------|
| Why isn’t JAG doing this automatically? | Orchestrator *is* the automation of relevance + assembly |
| Another intelligence engine? | **No** — composition only |
| UI over existing engines? | **Yes** — compose Twin, Memory, Evidence, Finance, LI, Org, … |
| Outside education? | **Yes** — belongs in JAG Core experience layer |
| Education-specific? | Domain packs supply education widgets; orchestrator stays universal |

---

## Out of scope

- New domain engines  
- Parallel portal products  
- Speculative AI without evidence traces  
- Forking UOM for verticals  

---

## Relationship to Wave 1.x surfaces

Education “experience” routes shipped under consolidation waves are **legacy context surfaces**. They must be progressively **absorbed** as orchestrator-composed contexts (Teacher Context, Parent Context, Executive Context), not expanded as independent products.

---

## Suggested implementation spine (future authorized wave)

```text
src/lib/jag/experience-orchestrator/
  constants.ts      — guards: productExperienceOnly, createsEngines: false
  compose.ts        — Experience = formula inputs → workspace model
  briefing.ts       — evidence-backed briefing + next actions
  widgets.ts        — registry of reusable widgets/actions
  command.ts        — universal command interface adapter
  events.ts         — Twin / Evidence / Memory for composition events
```

Do not start implementation until Constitutional Review for the specific PR is recorded in the PR description.
