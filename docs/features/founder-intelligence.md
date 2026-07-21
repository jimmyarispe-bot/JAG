# Founder Intelligence Platform

AcademyOS RC9 — AI-powered executive layer that continuously analyzes AcademyOS, detects issues, predicts outcomes, surfaces opportunities, and recommends actions.

Founder Intelligence **consumes** Executive Intelligence (EI) events from every module and produces actionable insights. It does **not** republish operational module events.

## Architecture

| Layer | Location |
|-------|----------|
| Schema (RC9) | `supabase/migrations/196_founder_intelligence_platform.sql` |
| Platform module | `src/lib/founder-intelligence/` |
| Reasoning engine | `src/lib/jag-intelligence/` (RC10 — pipeline, context, confidence) |
| Prior stubs | `src/lib/platform/intelligence/founder/` (Sprint 021) |
| Existing EI | `src/lib/executive/`, `src/lib/platform/executive-*` |
| Command center | `/dashboard/founder` |
| Related surfaces | `/dashboard/executive`, `/exec`, Morning Brief `/dashboard` |

Analysis is orchestrated by `runJagIntelligencePipeline`; this module maps engine output into the Founder dashboard and Decision Center.

```
Module EI events (platform_activity_events)
        │
        ▼
  Signal loader (read-only)
        │
        ├── Health scoring
        ├── Risk engine
        ├── Opportunity engine
        ├── Prediction interfaces
        ├── Recommendation engine
        ├── Cross-domain correlation
        └── Executive brief + timeline
                │
                ▼
        Decision Center + Founder Memory
                │
                ▼ (on explicit approve)
        Workflow side-effects
```

## Insight pipeline

1. Load recent EI signals (`loadEiSignals`)  
2. Score domain + overall health  
3. Detect risks & opportunities  
4. Generate predictions (heuristic interfaces with confidence intervals)  
5. Rank recommendations with explainability  
6. Correlate cross-domain patterns  
7. Compose brief, KPIs, priorities, timeline  
8. Persist / seed Decision Center items  

## Risk scoring

Risks combine **probability** and **impact** (0–100). Severity bands: info → critical.  
Detectors cover enrollment decline, cash flow / late invoices, staffing, compliance/certs, attendance, workflow failures, communication bottlenecks.

## Prediction model interfaces

`generatePredictions` exposes forecast bands (low / mid / high) for:

- Enrollment  
- Revenue  
- Cash flow  
- Hiring needs  
- Class capacity  
- Scholarship utilization  
- Staff turnover  
- Document volume  

These are **heuristic interfaces**, not live ML models — factors and confidence are always returned for explainability.

## Recommendation lifecycle

Recommendations are ranked by priority / impact / confidence.  
Founders can **Approve · Dismiss · Delegate · Schedule · Track · Resolve** via Decision Center.  
Every action appends history and emits a Founder EI event (`founder.decision.*`).

Workflows (assign task, communicate, investigate, schedule review, generate report) run **only after explicit approval** unless designated automatic.

## Decision tracking

Table `founder_decisions` stores status, history, delegation, schedule, and audit_id.  
Related EI events: `founder.decision.approved|dismissed|delegated|scheduled|resolved`.

## Founder memory

Pinned priorities, strategic initiatives, long-term goals, delegated items, open/resolved decisions (`founder_memory_items`).

## Permissions

| Role | Access |
|------|--------|
| Founder (`JAG_ACCESS` / FOUNDER) | Full — view + decide |
| CEO / Executive Director | Configurable via `executive.intelligence` / `executive.dashboard` (view) |
| Explicit grant | `founder.view` / `founder.intelligence` |
| Other roles | No access |

Helpers: `canViewFounderIntelligence`, `canManageFounderIntelligence`, `canDecideFounderIntelligence`.

## Workflow integration

| Trigger | Activity event |
|---------|----------------|
| `founder.brief_generated` | `founder.brief.generated` |
| `founder.decision_approved` | `founder.decision.approved` |
| … | other `founder.*` events |

| Action | Effect |
|--------|--------|
| `open_founder_investigation` | Queue investigation follow-up |
| `schedule_founder_review` | Queue review scheduling notice |
| `generate_founder_report` | Queue summary report notice |

## Explainability

Every insight includes: why generated, supporting evidence, related EI event ids, confidence, last updated.

## Data model

- `founder_insights`  
- `founder_decisions`  
- `founder_memory_items`  
- `founder_health_snapshots`  

## Acceptance (RC9)

- Founder Intelligence is a first-class module (`/dashboard/founder`)  
- Executive Brief updates from live EI events  
- Health scores across operational domains  
- Risks, opportunities, recommendations are explainable  
- Cross-domain analysis operational  
- Founder decisions tracked and auditable  
- Existing modules unchanged  
- Module Completion Standard v2 gates pass  
