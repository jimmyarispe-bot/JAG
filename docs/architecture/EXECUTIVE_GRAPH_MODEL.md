# Executive Graph Model (Sprint 025)

## Domains

| Domain | Purpose |
|--------|---------|
| `admissions` | Pipeline and conversion signals |
| `finance` | Revenue, cash, collections, AR |
| `hr` | Staffing, teacher attendance, vacancies |
| `operations` | Enrollment, student attendance, scheduling |
| `executive` | Health score, alerts, executive aggregates |
| `founder` | Brief, priorities, founder risks/opportunities |

## Nodes

`GraphNode` fields: `id`, `key`, `label`, `domain`, `kind`, `value`, `status`, `severity`, `criticality`, `confidence`, `evidence`, `metadata`.

**Kinds:** `signal`, `kpi`, `health`, `alert`, `priority`, `risk`, `opportunity`, `constraint`, `decision`, `summary`, `domain_root`.

**ID format:** `{domain}:{key}` (example: `finance:finance.cash`).

## Edges

`GraphEdge` fields: `id`, `kind`, `sourceId`, `targetId`, `weight`, `confidence`, `direction`, `ruleId`, `reason`, `evidence`, `metadata`.

**Kinds:** `CAUSES`, `CONTRIBUTES_TO`, `DEPENDS_ON`, `BLOCKS`, `SUPPORTS`, `IMPROVES`, `DECLINES`, `FUNDS`, `MEASURES`, `GENERATES`, `INFORMS`, `CONSTRAINS`.

## Default catalog relations

Canonical cross-domain edges live in `DOMAIN_RELATION_CATALOG`:

- Admissions pipeline → Enrollment
- Enrollment → Revenue
- Collections / Revenue / AR → Cash
- Staffing / Vacancies → Scheduling
- Teacher attendance → Student attendance
- Cash / Attendance → Executive health
- Executive health / Alerts → Founder brief / priorities

## Graph container

```ts
interface Graph {
  id: string;
  builtAt: string;
  scope: GraphScope;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}
```

Scope keys: `organizationId`, `schoolId`, optional `regionId` / `campusId`.

## Relationship to Sprint 004 EIG

Sprint 004 nodes/edges remain valid for KPI-centric executive graphs.

Sprint 025 model is the **intelligence-layer** organizational reasoning graph with explicit domain roots and founder/org-health ingestion. Builders may later wrap Sprint 004 output as additional signals without merging type systems.
