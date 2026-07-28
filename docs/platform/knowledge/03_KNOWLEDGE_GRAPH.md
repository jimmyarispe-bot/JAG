# 03 — Knowledge Graph

Canonical graph connecting organizations, people, students, employees, parents, teachers, classes, programs, documents, assessments, goals, projects, financial records, policies, meetings, evidence, events, and recommendations.

## Operations

- `upsertNode` — idempotent by kind + externalRef/label
- `relate` — edges with optional evidence fact IDs
- `queryGraph` — nodes + edges for an organization
- Document upload auto-creates a `document` node

## Relationships

Every relationship can cite evidence fact IDs. Events publish to Digital Twin / Evidence Ledger / Organizational Memory.
