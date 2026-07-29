# JAG™ Constitutional Architecture

**The Non-Negotiable Laws of the Organizational Intelligence Operating System**

| Field | Value |
|-------|--------|
| **Authority** | Above the PRD. Above the roadmap. Above every future sprint. |
| **Status** | Canonical — supreme product architecture law |
| **Companions** | [UNIVERSAL_ORGANIZATION_MODEL.md](./UNIVERSAL_ORGANIZATION_MODEL.md) · [docs/architecture/PLATFORM_CONSTITUTION.md](./docs/architecture/PLATFORM_CONSTITUTION.md) (platform engineering layering) · [docs/platform/organization/](./docs/platform/organization/) |
| **Conflict rule** | If an implementation violates this document, the implementation is wrong — even if it compiles. |

---

## LAW 1 — JAG is the Product

Not AcademyOS. Not Finance. Not HR. Not CRM. Not Learning.

Those are **organizational domains**.

There is exactly one product:

**JAG™ Organizational Intelligence Operating System**

---

## LAW 2 — There is only ONE operating system

There are not:

- Parent Portals  
- Teacher Portals  
- Executive Portals  
- HR Portals  
- Finance Portals  

Those are mental models inherited from traditional enterprise software.

JAG shall expose a **single adaptive operating environment**.

---

## LAW 3 — Intelligence comes before interfaces

The user never starts with menus.

The user starts with:

> “What does JAG already know?”

Every screen must exist because JAG cannot yet answer that question automatically.

---

## LAW 4 — Domain engines are not applications

AcademyOS · Finance · HR · Healthcare · Manufacturing · Construction · Legal · Government · Nonprofit · Retail · Hospitality

These are **not products**.

They are **domain intelligence packages**. They plug into JAG.

---

## LAW 5 — Experiences are composed

Never built independently.

Everything is assembled from:

Role · Permissions · Context · Intent · Evidence · Organizational State · History · Current Events

---

## LAW 6 — JAG determines relevance

Not navigation. Not dashboards. Not menus.

The system determines:

- What matters  
- Why it matters  
- When it matters  
- Who should see it  

---

## LAW 7 — Every recommendation requires evidence

Nothing speculative.

Every insight must trace to Digital Twin, Evidence Ledger, Organizational Memory, Knowledge, Learning Intelligence, Finance, HR, Operations, or another registered intelligence source.

If evidence does not exist — JAG says:

> “I don’t know.”

---

## LAW 8 — Every new feature must pass Constitutional Review

Before writing code, ask:

1. **Why isn’t JAG doing this automatically?**  
2. **Is this actually another intelligence engine?** → If yes: **stop.**  
3. **Is this only another UI over an existing engine?** → If yes: **compose.**  
4. **Could this capability benefit organizations outside education?** → If yes: it belongs in **JAG**.  
5. **Is this education-specific?** → If yes: it belongs in the **Education Intelligence package** — never inside JAG Core.

---

## LAW 9 — The Universal Organization Model is sacred

Organizations differ only by Objects · Vocabulary · Rules · Relationships — **not by architecture**.

Never fork JAG. **Configure it.**

See [UNIVERSAL_ORGANIZATION_MODEL.md](./UNIVERSAL_ORGANIZATION_MODEL.md).

---

## LAW 10 — JAG is an operating system

Not software. Everything else is a package.

| Traditional framing | Constitutional framing |
|---------------------|------------------------|
| Teacher Portal | JAG → Teacher Context |
| Finance Dashboard | JAG → Finance Context |
| Healthcare Portal | JAG → Healthcare Context |
| Parent Portal | JAG → Parent / Family Context |
| Executive Workspace | JAG → Executive Context |

---

## The Universal Formula

This is the most important equation in the repository:

```text
JAG Experience
  = Identity
  + Role
  + Permissions
  + Intent
  + Context
  + Evidence
  + Organizational Memory
  + Digital Twin
  + Domain Intelligence
  + Current State
```

**Missing on purpose:** Portal · Dashboard · Module · Application.

Those are **outputs**, not architecture.

---

## The Build Rule (mandatory)

Before implementing **any** code:

1. Read `JAG_CONSTITUTION.md`  
2. Read `UNIVERSAL_ORGANIZATION_MODEL.md`  
3. Ask: *Am I building another application, or am I extending the Organizational Intelligence Operating System?*  

If the answer is “another application” — **STOP. Redesign. Do not write code.**

---

## Relationship to platform engineering docs

[docs/architecture/PLATFORM_CONSTITUTION.md](./docs/architecture/PLATFORM_CONSTITUTION.md) governs **engineering** boundaries (permissions, tenancy, audit, pack registration).

This document governs **product architecture**: what JAG *is*, how experiences are composed, and what must never be treated as a separate product.

Where language conflicts (e.g. “application” vs “domain intelligence package”), **this constitution wins for product intent**. Engineering may still say “capability pack / domain package” for implementation structure — never “second product.”

---

## Next constitutional milestone

**JAG Experience Orchestrator™** — not another portal, workspace, or engine.

Responsibilities:

1. Build a dynamic workspace from identity, permissions, context, intent, organizational state, and evidence.  
2. Assemble reusable widgets and actions instead of hard-coded portals.  
3. Produce a personalized briefing and next-best actions from intelligence engines.  
4. Route users into domain workflows only when necessary.  
5. Expose a universal command interface so users interact with **JAG**, not navigate products.

Spec: [docs/jag-os/experience-orchestrator/01_OVERVIEW.md](./docs/jag-os/experience-orchestrator/01_OVERVIEW.md)
