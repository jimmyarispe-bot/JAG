# Executive Graph Analyzer (Sprint 025)

Production reasoning engine that unifies **Admissions**, **Finance**, **HR**, **Operations**, **Executive Intelligence**, and **Founder Intelligence** into one organizational graph.

## Package location

`src/lib/platform/intelligence/executive-graph/`

## Quick start

```ts
import { createExecutiveGraphAnalyzer } from "@/lib/platform/intelligence/executive-graph";

const { buildAndAnalyze } = createExecutiveGraphAnalyzer();

const { graph, analysis } = buildAndAnalyze({
  scope: { organizationId: "org-1", schoolId: "school-1" },
  executive: {
    enrollment: 120,
    admissions: 18,
    revenue: 54000,
    outstanding: 12000,
    staff: 42,
    studentAttendance: 91,
    teacherAttendance: 96,
  },
  organizationHealth: {
    overallScore: 78,
    enrollmentScore: 72,
    financialScore: 81,
    workforceScore: 70,
    operationsScore: 75,
  },
  founder: {
    healthScore: 78,
    healthStatus: "warning",
    priorities: [
      {
        id: "p1",
        title: "Improve collections",
        severity: "high",
        confidence: 0.8,
      },
    ],
  },
});

console.log(analysis.dashboard.headline);
console.log(analysis.rootCauses);
console.log(analysis.priorities.slice(0, 5));
```

## Components

| Component | Role |
|-----------|------|
| `GraphBuilder` | Ingests multi-domain signals → `Graph` |
| `GraphRepository` | In-memory scoped graph store |
| `GraphAnalyzer` | Orchestrates full analysis |
| `RootCauseAnalyzer` | Upstream causal drivers |
| `DependencyAnalyzer` | Fan-in / fan-out / DEPENDS_ON |
| `CascadeAnalyzer` | Multi-hop impact paths |
| `RiskPropagation` | Negative-path risk spread |
| `ExecutiveReasoner` | Narrative findings |
| `OpportunityEngine` | Positive lift opportunities |
| `ConstraintEngine` | Blocks / capacity / compliance |
| `CriticalityScore` | Node criticality scoring |
| `ExecutivePriority` | Action ranking |
| `ConfidenceScore` | Calibrated confidence |
| `ExecutiveQueries` | Deterministic Q&A |
| `GraphSearch` | Search / neighborhood / path |
| `DashboardProjection` | Dashboard flatten |

## Dependency injection

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const { graph, analysis } = service.executiveGraphAnalyzer.buildAndAnalyze({
  executive: { enrollment: 100, admissions: 12 },
});
```

Override any collaborator via `createExecutiveGraphAnalyzer({ rootCause: custom, ... })`.

## Relationship to Sprint 004

Sprint 004 (`@/lib/platform/executive-graph`) remains the KPI→EIG foundation.

Sprint 025 builds the **intelligence-layer reasoning engine** on top of domain signals (including founder + organization health), without replacing Sprint 004.

## Version

`EXECUTIVE_GRAPH_ANALYZER_VERSION = "0.1.0"`
