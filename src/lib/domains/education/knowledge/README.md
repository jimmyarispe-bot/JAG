# Education Knowledge Model

Canonical Education domain knowledge — concepts, relationships, policies, classifications, vocabulary, and capabilities.

**Knowledge only.** No execution, evaluation, UI, database, or workflows.

## Contents

| Module | Role |
|--------|------|
| `EducationVocabulary` | Stable terms + definitions |
| `EducationEntityCatalog` | Canonical concepts (Student, Program, …) |
| `EducationRelationshipCatalog` | Concept relationships |
| `EducationClassification` | Controlled value sets |
| `EducationPolicyCatalog` | Policy metadata (not evaluators) |
| `EducationCapabilityCatalog` | What the domain can reason about |
| `EducationKnowledgeModel` | Aggregated model |
| `EducationKnowledgeValidator` | Structural integrity checks |

## Usage

```ts
import {
  getEducationKnowledgeModel,
  validateDefaultEducationKnowledgeModel,
} from "@/lib/domains/education";

const model = getEducationKnowledgeModel();
const { ok, errors } = validateDefaultEducationKnowledgeModel();
```

Contributors / planner / orchestrator are **not** migrated in this phase.

## Docs

[`docs/domains/education/knowledge/00_OVERVIEW.md`](../../../../docs/domains/education/knowledge/00_OVERVIEW.md)
