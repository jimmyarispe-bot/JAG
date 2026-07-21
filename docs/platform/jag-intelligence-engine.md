# JAG Intelligence Engine

AcademyOS RC10 — central reasoning layer that powers Founder Intelligence, Executive Intelligence, and future AI capabilities.

The engine **ingests** Executive Intelligence events, maintains organizational state, generates insights, scores confidence, detects anomalies, tracks decisions, and coordinates AI analysis across domains. It does **not** duplicate operational event generation.

## Pipeline architecture

Stages (each independently testable under `src/lib/jag-intelligence/stages/`):

1. **Event Ingestion** — read `platform_activity_events`  
2. **Normalization** — domain, severity rank, entity refs  
3. **Context Enrichment** — organizational context snapshot  
4. **Cross-Domain Correlation** — admissions↔revenue, staffing↔capacity, …  
5. **Pattern Detection** — recurring / burst patterns  
6. **Anomaly Detection** — enrollment drops, overdue spikes, workflow failures, …  
7. **Prediction** — forecast bands with factors  
8. **Recommendation** — prioritized actions  
9. **Confidence Scoring** — confidence, data quality, evidence, freshness, explainability  
10. **Insight Generation** — persist to Insight Registry  

Entry: `runJagIntelligencePipeline(supabase, options)`.

## Knowledge graph

`buildKnowledgeGraph` constructs nodes/edges among students, families, employees, schools, programs, classes, workflows, communications, documents, financial accounts, calendar events, founder decisions, and EI events.

- In-memory traversal: `traverseNeighbors`  
- Persistence: `jag_knowledge_edges`  
- Explainable relationships on every edge  

## Context engine

`OrganizationalContext` captures active enrollment signals, staffing, financial health, open risks, communications, pending workflows, compliance status.

Founder Intelligence queries engine context (`engine.context` / `getOrganizationalContext`) rather than raw module tables for situational awareness.

## Confidence scoring

Every recommendation exposes:

| Field | Meaning |
|-------|---------|
| `confidence` | Composite score |
| `dataQuality` | Entity/summary completeness |
| `evidenceCount` | Supporting evidence items |
| `freshness` | Recency of source events |
| `explainability` | Strength of why/evidence/factors |

## Provider abstraction

`src/lib/jag-intelligence/providers.ts` — interfaces only:

- OpenAI  
- Anthropic  
- Google  
- Local models  

No hard-coded live model calls. Adapters return `deferred: true` until configured.

## Prompt & policy registry

Table `jag_prompt_registry` with versioning for:

- System prompts  
- Domain prompts  
- Decision policies  
- Guardrails  
- Response templates  

API: `listPrompts`, `getPrompt`, `createPromptVersion`.

## Insight lifecycle

Persisted in `jag_insights`:

Insight ID · Category · Priority · Confidence · Source events · Related entities · Recommendation · Status · Resolution · Created · Updated  

Insight API (`insightApi`):

- Query current insights  
- Search  
- Resolve  
- Subscribe (poll mode)  
- Historical timelines  
- Run pipeline  

## Decision feedback

`jag_decision_feedback` + `jag_learning_records` track accepted / rejected / delegated / completed / ignored outcomes and actual impact.

Founder Decision Center syncs outcomes via `syncFounderDecisionFeedback`.  
Learning data is for **evaluation only** — no automatic retraining.

## Workflow integration

`initiateWorkflowFromInsight` requires **explicit approval** unless `automatic` is set. Uses existing Communications / Workflow Engine side-effects.

## Observability

`jag_pipeline_metrics` records per-stage:

- Pipeline latency  
- Queue depth (signal volume)  
- Insight generation time  
- Correlation / recommendation latency  
- Model response latency (when providers invoked)  
- Error rates  

Helpers: `recordStageMetric`, `getPipelineObservability`.

## Permissions

Founder / JAG operators run the pipeline and resolve insights. CEO access follows Founder Intelligence configurable grants. Operational modules do not write to the Insight Registry directly — they emit EI events the engine consumes.

## Events

Engine-originated EI catalog events (never republish module events):

- `jag.pipeline.completed`  
- `jag.insight.created` / `jag.insight.resolved`  
- `jag.anomaly.detected`  
- `jag.feedback.recorded`  
- `jag.context.updated`  

## Integration

| Consumer | Integration |
|----------|-------------|
| Founder Intelligence | `composeFounderDashboard` → `runJagIntelligencePipeline` |
| Executive Intelligence | Consumes same EI events; no republish |
| Module Completion | Registry id `jag`, docs + tests |

## Data model

- `jag_insights`  
- `jag_decision_feedback`  
- `jag_knowledge_edges`  
- `jag_context_snapshots`  
- `jag_prompt_registry`  
- `jag_pipeline_metrics`  
- `jag_learning_records`  

Migration: `supabase/migrations/197_jag_intelligence_engine.sql`

## Acceptance (RC10)

- Intelligence Engine is a first-class platform service  
- Knowledge Graph operational  
- Context Engine queryable  
- Insights explainable and persisted  
- Confidence scoring implemented  
- AI provider abstraction exists  
- Decision feedback loop operational  
- Founder Intelligence uses the engine for analysis  
- Module Completion Standard v2 gates pass  
