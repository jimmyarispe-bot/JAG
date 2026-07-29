# 00 — JAG Runtime Overview

**Phase Ω-0B — Runtime Specification (contracts only)**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [07_SUPREME_ARCHITECTURE_REVIEW.md](../architecture/07_SUPREME_ARCHITECTURE_REVIEW.md)  
**Status:** Canonical specification — **not implemented in this phase**  
**Forbidden here:** Code · UI · API routes · engines · business-logic changes

---

## 1. Purpose

The **JAG Runtime** is the execution layer between the user and all domain packages.

It determines, in order:

**Identity → Context → Intent → Cognition → Experience → Action**

…before invoking any domain capability.

It does **not** own Education, Finance ledger, HR SoR, or other domain business logic. It **composes and dispatches**.

---

## 2. Six cooperating subsystems

| # | Subsystem | Spec | Layer |
|---|-----------|------|-------|
| 1 | Identity Runtime | [01](./01_IDENTITY_RUNTIME.md) | Core |
| 2 | Context Runtime | [02](./02_CONTEXT_RUNTIME.md) | Core |
| 3 | Intent Runtime | [03](./03_INTENT_RUNTIME.md) | Core |
| 4 | Cognitive Runtime | [04](./04_COGNITIVE_RUNTIME.md) | Core |
| 5 | Experience Runtime | [05](./05_EXPERIENCE_RUNTIME.md) | Experience Composition |
| 6 | Action Runtime | [06](./06_ACTION_RUNTIME.md) | Core (dispatch) |

Supporting docs: [Pipeline](./07_RUNTIME_PIPELINE.md) · [Events](./08_RUNTIME_EVENTS.md) · [Extensions](./09_RUNTIME_EXTENSION_MODEL.md) · [Implementation plan](./10_RUNTIME_IMPLEMENTATION_PLAN.md)

---

## 3. Relationship to Experience Orchestrator

The **Experience Orchestrator™** (Ω-1) is the first **implementation slice** of the Runtime—primarily **Experience Runtime** + thin Identity/Context/Intent/Cognition/Action adapters.

This Ω-0B pack defines the **full Runtime contract**. Ω-1 must not invent a parallel architecture.

```text
User
  → JAG Runtime (six subsystems)
    → Domain Packages (Education, …)
    → Core Engines (Finance, Knowledge, Twin, Memory, …)
```

---

## 4. Universal Formula (runtime view)

```text
JAG Experience
  = Identity Runtime output
  + Context Runtime output
  + Intent Runtime output
  + Cognitive Runtime output (evidence-backed)
  + Experience Runtime composition
  + Action Runtime effects (when user acts)
```

---

## 5. Non-negotiable laws (runtime)

1. **No speculative cognition** — recommendations cite Evidence / Twin / Memory / Knowledge / engine traces, or return `unknown`.  
2. **No domain SoR in Runtime** — Runtime calls packages/engines; does not reimplement them.  
3. **No portal products** — Experience Runtime emits Context workspaces, not application brands.  
4. **Permission-only authorization** — Identity Runtime uses the platform permission engine.  
5. **Every Action** writes audit + evidence hooks + optional Memory/Twin publication.

---

## 6. Ownership

| Concern | Owner |
|---------|-------|
| Runtime contracts (this pack) | JAG Core architecture |
| Runtime implementation (future) | `src/jag/runtime` / `src/lib/jag/...` (TBD in Ω-1 plan) |
| Domain SoR | Domain packages |
| Ledger / CFO / Knowledge | Canonical Core packages per Ω-0A |

---

## 7. Success criteria (Ω-0B)

- ✓ Runtime fully specified across six subsystems  
- ✓ Pipeline, events, extensions documented  
- ✓ No implementation in this phase  
- ✓ Ready for human approval → then Ω-1 coding under [10](./10_RUNTIME_IMPLEMENTATION_PLAN.md)

**STOP after this pack.** Do not begin coding.
