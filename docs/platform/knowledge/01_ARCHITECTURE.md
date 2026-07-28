# 01 — JAG Knowledge™ Architecture (P-014)

## What it is

The **canonical Knowledge Engine** for the JAG Organizational Intelligence Operating System. It transforms documents, observations, assessments, communications, and uploaded evidence into structured organizational knowledge.

It is **not** a file manager and **not** merely document storage.

## Canonical ownership

KnowledgeEngine owns:

- Documents & versions (immutable versions)
- Evidence facts (never disappear)
- Knowledge graph
- Search & semantic / vector-ready indexing
- OCR / parsing / classification / entity extraction
- Metadata, retention, permissions, workflows, summaries

## Consumers

Every intelligence domain consumes this engine: Education, Finance, HR, Operations, Legal, Compliance, Healthcare, Government, and future domains.

**Education-specific interpretation** belongs to Learning Intelligence (**P-015**), not P-014.

## Package

```
packages/platform/knowledge/
  core/ documents/ storage/ folders/ permissions/ metadata/
  versions/ retention/ classification/ ocr/ parsing/
  entity-extraction/ knowledge-graph/ evidence/ timeline/
  relationships/ search/ semantic-search/ indexing/
  citations/ summaries/ insights/ recommendations/
  workflows/ sharing/ events/
  engine.ts → KnowledgeEngine
```

## Rules

1. KnowledgeEngine is the only canonical document owner.
2. Every extracted fact retains a citation to its source.
3. No AI conclusion without supporting evidence.
4. Summaries and recommendations must reference evidence/documents.
5. Documents are immutable; uploads create new versions.
