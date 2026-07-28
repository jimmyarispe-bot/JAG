# JAG Knowledge Graph™

JS-004 — Canonical relationship model for the JAG ecosystem under `packages/studio/knowledge/`.

## Purpose

Powers Repository, Architecture, Release, PER, and Quality intelligence with a navigable graph. Future JAG Architect reasoning consumes the same model.

Studio **analyzes** Platform Foundation, AcademyOS, and the SDK — it does not modify them. Gaps become PERs.

## Layers

| Layer | Examples |
|-------|----------|
| Product | Platform Foundation, JAG Studio, AcademyOS, HealthcareOS, … |
| Package | platform-sdk, studio, academyos, digital-twin, … |
| Module | Admissions, SIS, Learning, Finance, Workforce, … |
| Service | EnrollmentService, NotificationService, RepositoryScanner |
| API | `/api/studio/releases`, `/api/academyos/finance` |
| Entity | Twin mappings, persons, organizations, roles, events |
| Documentation | Architecture, APIs, RC docs, PERs, ADRs |
| Test | Suites, files, coverage metadata |

## Builder

```ts
buildKnowledgeGraph({ root?, force? })
```

Ingests catalog, dependency edges, PERs, docs, releases, tests, APIs, Twin mappings, Insight Providers into one persisted graph (process memory).

## Dashboard

`buildKnowledgeDashboard()` / `GET /api/studio/knowledge?dashboard=1`:

- Knowledge Graph Health
- Node / relationship counts
- Orphan nodes
- Disconnected packages
- Documentation & test coverage
- Knowledge freshness
- Reasoning query intents

See also [19_GRAPH_SCHEMA.md](./19_GRAPH_SCHEMA.md), [20_REASONING.md](./20_REASONING.md), [21_QUERY_ENGINE.md](./21_QUERY_ENGINE.md), [22_IMPACT_ANALYSIS.md](./22_IMPACT_ANALYSIS.md).
