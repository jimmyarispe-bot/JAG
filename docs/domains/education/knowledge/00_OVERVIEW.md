# 00 — Education Knowledge Model Overview

**Program D3.0 — Domain Knowledge Layer**  
**Package:** `src/lib/domains/education/knowledge`

---

## 1. Purpose

Define the canonical Education knowledge layer: concepts, relationships, policies, classifications, vocabulary, and capabilities.

This layer is **separated from execution**. It contains no planner, contributor, graph, or orchestrator logic.

---

## 2. Principles

| Principle | Meaning |
|-----------|---------|
| Knowledge only | Definitions and catalogs — no evaluation |
| Stable identifiers | Prefer `education.*` ids |
| Vocabulary first | Entities align to preferred terms |
| Integrity via validation | Unique ids, relationship endpoints, refs |
| No migration yet | Contributors remain unchanged in D3.0 |

---

## 3. Model shape

```text
EducationKnowledgeModel
  vocabulary
  entities
  relationships
  classifications
  policies
  capabilities
```

Validate with `validateEducationKnowledgeModel()` / `validateDefaultEducationKnowledgeModel()`.

---

## 4. Document index

| Doc | Topic |
|-----|-------|
| [01_ENTITIES.md](./01_ENTITIES.md) | Entity catalog |
| [02_RELATIONSHIPS.md](./02_RELATIONSHIPS.md) | Relationships |
| [03_POLICIES.md](./03_POLICIES.md) | Policy metadata |
| [04_CLASSIFICATIONS.md](./04_CLASSIFICATIONS.md) | Classifications |
| [05_VOCABULARY.md](./05_VOCABULARY.md) | Vocabulary |

---

## 5. Non-goals (D3.0)

- No UI / database / workflows  
- No Core / Runtime / Domain SDK changes  
- No contributor migration  
- No policy evaluation engines  
