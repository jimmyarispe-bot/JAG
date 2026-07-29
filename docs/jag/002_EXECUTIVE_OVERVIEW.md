# 002 — Executive Overview

**Sprint:** JAG-002  
**Route:** `/jag`  
**Status:** Complete

---

## 1. Purpose

Populate the Executive Command Center overview with real executive intelligence.

Never fabricate metrics. Empty states explain what is missing and how to obtain it.

---

## 2. Sections

| Section | Source |
|---------|--------|
| Organization Health | Bound School Health contributor result (`education.cognition.school_health`) |
| Today's Priorities | Open Decision Center items (top 5) → `/jag/decisions/[id]` |
| Executive Brief | Bound Executive Education Briefing result |
| Capability Packs | `listCapabilityPacks()` |
| Loaded Domains | Dynamic loaders (Education today) |
| Runtime Status | Planner, Graph, Policy Engine, Knowledge Model, Observability health |
| Recent Intelligence | Bound contributor executions |
| Recommended Decisions | High-priority action proposals → `/jag/decisions/[id]`, grouped |

---

## 3. Binding intelligence results

Application store: `src/lib/jag-command-center/intelligence-store.ts`

Hosts that run the Education Intelligence Orchestrator should call:

```ts
recordEducationExecutionSnapshot(snapshot)
```

That binds School Health, Executive Briefing, recent executions, and action proposals for the overview. No Core / Runtime / Domain SDK changes.

---

## 4. Empty-state policy

| Missing data | Behavior |
|--------------|----------|
| No School Health bind | Explain contributor + orchestrator path |
| No open decisions | Empty priorities table |
| No Executive Brief bind | Explain how briefs are generated |
| No executions | Empty recent intelligence |
| No proposals / decisions | Empty recommended decisions groups |

---

## 5. Constraints

- UI + application services only  
- No JAG Core / Runtime / Domain SDK modifications  
- No fabricated health scores, trends, or confidence values  

Proposal deep-links open the Decision Center (`/jag/decisions/[id]`).
