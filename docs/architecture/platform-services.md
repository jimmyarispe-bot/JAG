# AcademyOS Platform Services

Phase 2 cross-cutting services used by every module. Student Profile (B-01) is the first full consumer.

## Services

| Service | Path | Purpose |
|---------|------|---------|
| **Activity Engine** | `src/lib/platform/activity/` | Single write path for all state-change events |
| **Relationship Engine** | `src/lib/platform/relationships/` | Universal entity relationships |
| **Tagging System** | `src/lib/platform/tags/` | Org-scoped reusable tags on any entity |
| **Notes System** | `src/lib/platform/notes/` | Polymorphic notes with visibility and mentions |
| **Event Engine** | `src/lib/platform/events/` | Registry-backed pub/sub with audit and persistence |
| **Decision Engine** | `src/lib/platform/decision/` | Rule and AI-assisted recommendations with audit and persistence |
| **Knowledge & Evidence Engine (KEE)** | `src/lib/platform/evidence/` | Canonical learning evidence per Doc 27 |
| **Rules Engine** | `src/lib/platform/rules/` | Domain-organized business rules with explainable evaluation |
| **Intelligence Graph** | `src/lib/platform/intelligence-graph/` | Persistent relationship layer for traversal and analytics |
| **Universal Learning Registry (ULR)** | `src/lib/platform/ulr/` | Canonical learning model — domains through atomic skills (Doc 12) |
| **Personal Learning Journey (PAJ)** | `src/lib/platform/paj/` | Runtime orchestration — journey lifecycle, mastery, progression (Doc 3) |
| **Executive Metrics Aggregation** | `src/lib/platform/executive-metrics/` | Canonical metrics SSoT for Morning Brief, Executive, FI, Mission Control, KPI, health, narrative (Sprint 002) |
| **Executive KPI Snapshots** | `src/lib/platform/kpi-snapshots/` | Daily/manual/backfill persistence of aggregate metrics into `executive_kpi_snapshots` (Sprint 002) |

Barrel export: `src/lib/platform/services/index.ts`

## Database

- `132_phase2_platform_services_foundation.sql` — Activity Engine tables and seeds
- `133_phase2_platform_services_rls.sql` — Activity Engine RLS
- `138_platform_event_persistence.sql` — Event Engine canonical store (`platform_event_records`)
- `139_platform_event_rls.sql` — Event Engine RLS
- `140_platform_decision_persistence.sql` — Decision Engine canonical store (`platform_decision_records`)
- `141_platform_decision_rls.sql` — Decision Engine RLS
- `142_platform_evidence_persistence.sql` — KEE canonical store (`platform_evidence_records`)
- `143_platform_evidence_rls.sql` — KEE RLS
- `144_platform_rules_persistence.sql` — Rules Engine canonical store (`platform_rule_evaluation_records`)
- `145_platform_rules_rls.sql` — Rules Engine RLS
- `146_platform_intelligence_graph_persistence.sql` — Intelligence Graph (`platform_graph_edges`)
- `147_platform_intelligence_graph_rls.sql` — Intelligence Graph RLS
- `148_platform_ulr_foundation.sql` — ULR hierarchy and relationship tables
- `149_platform_ulr_seed_domains.sql` — Production domain seeds
- `150_platform_ulr_rls.sql` — ULR RLS
- `151_platform_ulr_sl_population.sql` — Structured Literacy Doc 13 strands + Doc 98 PA sub-strands
- `152_platform_ulr_sl_sub_strands.sql` — SL generated library sub-strands
- `153_platform_paj_runtime.sql` — PAJ journey, enrollment, placement, progress tables
- `154_platform_paj_rls.sql` — PAJ RLS

## Activity Engine

### Write

```typescript
import { recordActivity } from "@/lib/platform/activity";

await recordActivity(supabase, {
  eventType: "student.created",
  moduleKey: "sis",
  entityType: "student",
  entityId: studentId,
  title: "Student created",
  organizationId,
  schoolId,
  studentId,
  actorUserId,
});
```

- Validates against `ACTIVITY_EVENT_CATALOG`
- Dual-writes to legacy `platform_timeline_events`
- Fans out to Integration Hub `ihub_events`

### Read

```typescript
import { getStudentActivityFeed, getAuditActivity } from "@/lib/platform/activity";

const timeline = await getStudentActivityFeed(supabase, studentId);
const audit = await getAuditActivity(supabase, { studentId });
```

## Relationship Engine

### Types

20 system relationship types seeded in `platform_relationship_type_definitions` (student.guardian, student.teacher, school.organization, etc.).

### Write

```typescript
import { createRelationship, upsertPrimaryRelationship } from "@/lib/platform/relationships";

await createRelationship(supabase, {
  organizationId,
  relationshipType: "student.teacher",
  fromEntityType: "student",
  fromEntityId: studentId,
  toEntityType: "employee",
  toEntityId: employeeId,
  studentId,
});
```

Student mutations auto-sync via `src/lib/students/platform-sync.ts`.

## Tagging System

- System tags seeded per org: IEP, ESA, Virtual, High Priority, etc.
- Apply: `applyTags()`, `applyTagsBySlug()`, `removeTag()`
- Query: `getEntityTags()`, `findEntitiesByTags()`

## Notes System

- Create: `createNote()` with category, visibility, mentions, attachments
- Query: `getEntityNotes()`, `getStudentNotes()`, `getPinnedNotes()`
- Restricted notes use `platform_note_visibility_grants`

## Event Engine

Wave 1 persistence stores canonical envelopes in `platform_event_records` for replay, audit, and intelligence graph providers.

### Publish with persistence

```typescript
import { publishEvent } from "@/lib/platform/events";

await publishEvent(
  {
    eventType: "platform.entity.created",
    entityType: "student",
    entityId: studentId,
    organizationId,
    schoolId,
    actorId: userId,
    payload: { action: "create" },
  },
  { persist: { supabase } }
);
```

- Validates against `PLATFORM_EVENT_CATALOG`
- Records in-memory audit buffer (process-local) and optionally persists to `platform_event_records`
- Async events persist after the async queue flush completes

### Read and replay

```typescript
import {
  listPlatformEventRecords,
  loadPersistedEventEnvelopes,
  replayPersistedEvents,
} from "@/lib/platform/events";

const rows = await listPlatformEventRecords(supabase, { eventType: "platform.entity.created" });
const batch = await replayPersistedEvents(supabase, {
  filters: { correlationId: "corr_123" },
});
```

## Decision Engine

Wave 1 persistence stores full decision results in `platform_decision_records` for audit and intelligence graph providers.

```typescript
import { executeDecision } from "@/lib/platform/decision";

const result = await executeDecision(
  {
    decisionType: "ref_platform_escalation_priority",
    inputs: { severity_score: 85, age_hours: 2 },
    organizationId,
    schoolId,
    actorUserId: userId,
  },
  { persist: { supabase } }
);

import { listPlatformDecisionRecords } from "@/lib/platform/decision";

const rows = await listPlatformDecisionRecords(supabase, {
  decisionType: "ref_platform_escalation_priority",
});
```

## Knowledge & Evidence Engine (KEE)

Wave 1 persistence implements Doc 27 universal evidence records.

```typescript
import { recordEvidence, getStudentEvidenceRecords } from "@/lib/platform/evidence";

const { id } = await recordEvidence(supabase, {
  evidenceTypeKey: "observation.instructional",
  competencyKeys: ["AW-SL-PA-001-v1.0.0"],
  skillKeys: ["AW-SL-PA-001-S01-v1.0.0"],
  studentId,
  schoolId,
  capturedByRole: "teacher",
  capturedByUserId: userId,
  evidenceConfidence: 0.9,
  evidenceQuality: 0.85,
});

const records = await getStudentEvidenceRecords(supabase, studentId);
```

## Rules Engine

Domain-organized rule sets with deterministic, explainable evaluation. Integrates with KEE (facts), Event Engine (optional publish), and platform persistence.

```typescript
import { evaluateRuleSet, registerRuleSet } from "@/lib/platform/rules";

const result = await evaluateRuleSet(
  {
    ruleSetKey: "ref_scholarship_eligibility",
    facts: { eligibility_score: 90 },
    studentId,
    schoolId,
    organizationId,
  },
  {
    persist: { supabase },
    publishEvent: { supabase, actorId: userId },
    evidenceRecords,
  }
);
```

## Intelligence Graph

Persistent canonical relationships in `platform_graph_edges` — references only, no operational entity duplication. Auto-synced from Event, Decision, KEE, and Rules engines on persist.

```typescript
import { queryGraphRelationships, recordGraphEdge, traverseGraph } from "@/lib/platform/intelligence-graph";

await recordGraphEdge(supabase, {
  edgeType: "student.enrolled_in.class",
  sourceNodeId: `entity:student:${studentId}`,
  targetNodeId: `class:class:${classId}`,
  providerKey: "persisted",
  schoolId,
});

const neighborhood = await queryGraphRelationships(
  { supabase, schoolId },
  { nodeId: `entity:student:${studentId}`, direction: "outgoing" }
);
```

## Universal Learning Registry (ULR)

Canonical learning model for The JAG OS — single source of truth for domains, strands, competencies, atomic skills, and typed relationships. KEE validates evidence keys against the in-memory registry on write.

```typescript
import {
  getUlrCompetency,
  getUlrDomainHierarchy,
  publishUlrCompetency,
  validateEvidenceAgainstUlr,
} from "@/lib/platform/ulr";

const hierarchy = getUlrDomainHierarchy("domain.structured_literacy");
const competency = getUlrCompetency("AW-SL-PA-001-v1.0.0");

await publishUlrCompetency(supabase, competency);
```

Build validation: `npm run validate:ulr`

## Personal Learning Journey (PAJ) Runtime

First platform runtime — orchestrates Structured Literacy™ learning lifecycle using ULR, KEE, Rules Engine, Decision Engine, Event Engine, and Intelligence Graph. No UI in this phase.

```typescript
import {
  createLearningJourney,
  processJourneyEvidence,
  confirmCompetencyAdvance,
  getJourneySnapshot,
  getCompetencyGuidance,
  evaluateJourneyRecommendations,
} from "@/lib/platform/paj";

const { journeyId, placedCompetencyKey } = await createLearningJourney(supabase, {
  studentId,
  schoolId,
});

// After KEE recordEvidence(...)
await processJourneyEvidence(supabase, { journeyId, evidenceId, studentId, competencyKeys: [placedCompetencyKey], ... });

await confirmCompetencyAdvance(supabase, { journeyId, competencyKey: placedCompetencyKey, educatorUserId });
```

Migrations: `153_platform_paj_runtime.sql`, `154_platform_paj_rls.sql`

Tests: `tests/integration/platform-paj.test.ts`

## Module integration contract

Every server action that mutates entity state must:

1. Call `recordActivity()` with a catalog event type
2. Use `createRelationship()` instead of ad-hoc join tables where appropriate
3. Use `applyTags()` / `createNote()` instead of module-specific stores

## Legacy compatibility

- `writeTimelineEvent()` delegates to `recordActivity()`
- `aggregateStudentTimeline()` will migrate to Activity Engine in B-01c

## Executive Metrics Aggregation

Canonical metrics contract for executive surfaces (Sprint 002 Task 1). Aggregates existing domain composers — does not duplicate SQL.

```typescript
import { getExecutiveAggregateMetrics } from "@/lib/platform/executive-metrics";

const aggregate = await getExecutiveAggregateMetrics(supabase, {
  organizationId,
  schoolId,
  campusId,
  networkId,
  regionId,
  programId,
  program,
});

aggregate.byId["enrollment.active_enrollments"];
aggregate.domains.finance;
```

- Domains: enrollment, admissions, finance, staffing, attendance, compliance, operations, executive
- Missing data → `value: null`, `confidence: "Unknown"` (never coerced to `0`)
- Confidence: `High` | `Medium` | `Low` | `Unknown`
- Unit tests: `tests/unit/executive-metrics.test.ts`

## Executive KPI Snapshots

Persists `getExecutiveAggregateMetrics()` output into `executive_kpi_snapshots`. Does not query domain modules directly.

```typescript
import {
  captureDailyExecutiveSnapshot,
  captureSnapshot,
  backfillSnapshots,
} from "@/lib/platform/kpi-snapshots";

await captureDailyExecutiveSnapshot(supabase, { filters: { schoolId } });
await captureSnapshot(supabase, { mode: "manual", filters: { organizationId } });
await backfillSnapshots(supabase, { fromDate: "2026-07-01", toDate: "2026-07-07", filters: { schoolId } });
```

- Duplicate prevention: same org/region/school/campus/program/metric/`snapshot_date` is skipped
- Scheduler hook: `processAllPlatformQueues` calls `captureDailyExecutiveSnapshot`
- Migration: `156_sprint002_executive_kpi_snapshots.sql`
- Unit tests: `tests/unit/kpi-snapshots.test.ts`

## Executive Alert Orchestrator

Unified executive alert stream over existing platform signals (Sprint 002 Task 3). Does **not** create a second notification store or work queue — Mission Control remains the operator queue; JAG Work remains the decision queue.

```typescript
import {
  getExecutiveAlerts,
  buildExecutiveAlerts,
  dedupeAlerts,
  scoreAlert,
} from "@/lib/platform/executive-alerts";

const stream = await getExecutiveAlerts(supabase, {
  filters: { organizationId, schoolId },
  limit: 25,
});
```

- Categories: Financial, Enrollment, Admissions, Staffing, Compliance, Operations, Security, Executive
- Severity: Critical | High | Medium | Low · Priority: 1–100 via `scoreAlert()`
- Dedup: `hash(scope, category, entityType, entityId, signalKey)` + entity corroboration + signalKey merge
- Sources: KPI snapshots, executive metrics, Activity Engine, FI alerts, Mission Control, compliance, HR, admissions, operational loop (+ executive insights provenance)
- Lifecycle helpers: acknowledge / dismiss / link workflow · JAG Work · Mission Control (in-memory on composed alerts)
- Unit tests: `tests/unit/executive-alerts.test.ts`

## Executive Decision Queue

Unified executive decision contract over existing work systems (Sprint 002 Task 4). Does **not** create a second work queue or workflow engine — JAG Work remains canonical work; Mission Control remains the operator queue; Workflow Engine remains approvals.

```typescript
import {
  getExecutiveDecisionQueue,
  buildExecutiveDecisionQueue,
  mergeDecisionSources,
  scoreDecision,
} from "@/lib/platform/executive-decisions";

const queue = await getExecutiveDecisionQueue(supabase, {
  filters: { organizationId, schoolId },
  jagWorkItems, // optional: pass resolveJagWorkQueue().allItems
  limit: 25,
});
```

- Types: Approval, Escalation, Review, Exception, Financial, Compliance, Staffing, Admissions, Operations, Strategic
- Statuses: Open | Acknowledged | Delegated | Waiting | Completed | Dismissed
- Priority: 1–100 via `scoreDecision()` (critical, blocking, financial/student/compliance impact, corroboration, age, due date)
- Merge precedence: Mission Control → Workflow → JAG Work → Alerts → KPI → Activity
- Lifecycle: acknowledge / delegate / follow-up / due dates / history (in-memory on composed decisions)
- Unit tests: `tests/unit/executive-decisions.test.ts`

## Executive Morning Brief 2.0

Extends the existing Founder Morning Brief (`getFounderMorningBrief`) — does **not** create a second brief. Sections compose from Sprint 002 platform services with a shared source fan-out (no duplicate metrics/MC/FI queries).

```typescript
import { getFounderMorningBrief } from "@/lib/dashboard/morning-brief";

const brief = await getFounderMorningBrief(ctx);
brief.executive?.executiveSummary;
brief.executive?.topDecisions;
brief.executive?.financialPulse;
```

Sections: Executive Summary (deterministic template) · Top 5 Decisions · Financial Pulse · Network Health · Overnight Activity · Mission Control (critical) · Executive Alerts · KPI Changes · What's Changed Since Yesterday

- Branding labels + Configuration `executive.morning_brief` / `widgets_enabled` section toggles
- Legacy fields (`priorities`, `aiBrief`, `decisionsWaiting`) preserved for existing UI
- Unit tests: `tests/unit/morning-brief.test.ts`

## Executive Intelligence Workspace Integration

Shared request loader (`loadExecutiveIntelligenceWorkspace`) for Founder / Executive / Mission Control (Sprint 002 Task 6 / Milestone 1 Phase A).

```typescript
import { loadExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";
import { mapWorkspaceToFounderDashboard } from "@/lib/platform/executive-intelligence";

const workspace = await loadExecutiveIntelligenceWorkspace(supabase, ctx, {
  schoolId,
  decisionLimit: 25,
});
workspace.commandCenterMetrics; // from aggregate adapter
workspace.alerts;               // getExecutiveAlerts
workspace.decisions;            // getExecutiveDecisionQueue
workspace.kpiPair;              // snapshot comparison

// Founder Key Metrics — map only (no parallel SQL)
const founderDashboard = mapWorkspaceToFounderDashboard(workspace, ctx);
```

- Breaks CCM ↔ Mission Control circular dependency (CCM uses lightweight MC feed)
- Metrics sources no longer call `getCommandCenterMetrics` / full MC compose
- KPI Center reads aggregate + snapshots (not live CCM fan-out)
- Mission Control page no longer runs `processAllPlatformQueues` on load
- Founder Workspace Key Metrics consume aggregate + `founderOps` slices from the same fan-out
- `getFounderDashboardData` no longer runs direct enrollment/admissions/finance/HR SQL

## Testing

Automated integration tests in `tests/integration/platform-services.test.ts` verify CRUD paths, permission checks, duplicate prevention, and audit activity creation using mocked Supabase clients.

Event Engine persistence tests: `tests/integration/platform-event-persistence.test.ts`.

Decision Engine persistence tests: `tests/integration/platform-decision-persistence.test.ts`.

KEE tests: `tests/integration/platform-evidence.test.ts`.

Rules Engine tests: `tests/integration/platform-rules.test.ts`, `tests/integration/platform-rules-persistence.test.ts`.

Intelligence Graph tests: `tests/integration/platform-intelligence-graph.test.ts`, `tests/integration/platform-intelligence-graph-persistence.test.ts`.

PAJ runtime tests: `tests/integration/platform-paj.test.ts`.

ULR tests: `tests/integration/platform-ulr.test.ts`, `tests/integration/platform-ulr-persistence.test.ts`.

Service health probes used by `/dashboard/platform/diagnostics` check catalog registration and table reachability.

See `docs/architecture/platform-testing-strategy.md` for the full platform test strategy.
