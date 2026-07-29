# 00 — Education Capability Packs Overview

**Program D5.0 — Capability Pack Registry**  
**Package:** `src/lib/domains/education/capabilities`

---

## 1. Purpose

Capability Packs are first-class Education domain objects. They make groups of contributors, planner intents, knowledge extensions, and policies **discoverable, versioned, and introspectable**.

Packs are metadata. They do **not** replace the Graph, Planner, Orchestrator, or contributor implementations.

---

## 2. Registered packs

| Pack | Id | Depends on |
|------|----|------------|
| [Student Lifecycle](01_STUDENT_LIFECYCLE.md) | `education.capability_pack.student_lifecycle` | — |
| [Student Support](02_STUDENT_SUPPORT.md) | `education.capability_pack.student_support` | Student Lifecycle |
| Academic Operations | `education.capability_pack.academic_operations` | Student Lifecycle |

---

## 3. Pack metadata

Each pack declares:

- `id`, `name`, `version`, `description`
- `contributors`
- `plannerIntents`
- `knowledgeExtensions`
- `policyExtensions`
- `documentation`
- `dependencies`
- `maturity`

---

## 4. Discovery APIs

```ts
listCapabilityPacks()
getCapabilityPack(id)
listContributors(pack)
listPlannerIntents(pack)
validateEducationCapabilityRegistry()
```

---

## 5. Validation

The registry validates:

- Duplicate pack ids  
- Missing / unknown contributors  
- Missing documentation entries  
- Missing / self dependencies  
- Version consistency (semver)  
- Dependency cycles  

---

## 6. Constraints

- No JAG Core / Runtime / Domain SDK changes  
- No Graph or Planner changes  
- Existing contributors unchanged  
- No UI / database  
