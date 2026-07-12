# Innovation Intelligence

**Sprint:** 044  
**Package:** `src/lib/platform/intelligence/innovation/`  
**Module id / OIOS domain:** `innovation`

## Purpose

Continuously discover, evaluate, and prioritize new ideas that improve the
organization. This is organizational innovation intelligence — NOT a suggestion
box. It spans ideation → experiment → portfolio → roadmap and is the first
**Future Intelligence** domain, composing onto Market (External) and
Improvement/Knowledge (Internal). See
[INTELLIGENCE_LAYER_MODEL.md](./INTELLIGENCE_LAYER_MODEL.md).

## Package Layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, constants, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + score/confidence/lens helpers |
| `idea-management-intelligence.ts` | Idea intake, screening, backlog |
| `research-development-intelligence.ts` | R&D intensity and pipeline |
| `product-service-innovation-intelligence.ts` | Product / service innovation |
| `process-innovation-intelligence.ts` | Process redesign opportunities |
| `ai-opportunity-intelligence.ts` | AI opportunity discovery |
| `technology-adoption-intelligence.ts` | Adoption readiness and rollout |
| `emerging-technology-intelligence.ts` | Emerging tech monitoring |
| `innovation-portfolio-intelligence.ts` | H1 / H2 / H3 portfolio balance |
| `experiment-management-intelligence.ts` | Experiment throughput |
| `proof-of-concept-intelligence.ts` | PoC tracking and conversion |
| `intellectual-property-intelligence.ts` | IP coverage and gaps |
| `continuous-improvement-intelligence.ts` | Continuous improvement opportunities |
| `strategic-roadmap-intelligence.ts` | Strategic innovation roadmaps |
| `knowledge-contribution.ts` | Innovation-derived knowledge drafts |
| `innovation-reasoner.ts` | Reasoning over ideas, experiments, gaps |
| `innovation-registry.ts` | Upstream publisher registry |
| `innovation-intelligence.ts` | Scores, health, dashboards, analyzers, briefs |
| `innovation-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Facade, store, queries |
| `index.ts` | Public API + `createInnovationIntelligence()` |

## Composition Flow

1. Derive baseline from DNA / OIOS / graph / prediction soft reads and from
   Market, Opportunity, Knowledge, Document, Business Model, Organizational
   Improvement, and Decision `*ResultLight` signals
2. Assess idea management and backlog health
3. Assess research & development intensity
4. Assess product / service innovation opportunities
5. Assess process innovation opportunities
6. Discover AI opportunities across the organization
7. Assess technology adoption readiness
8. Monitor emerging technologies and place on radar
9. Balance innovation portfolio across H1 / H2 / H3 horizons
10. Manage experiments and learning velocity
11. Track proofs of concept and conversion
12. Track intellectual property coverage
13. Surface continuous improvement opportunities
14. Compose strategic innovation roadmaps
15. Compose technology radar across all `TECHNOLOGY_RADAR_RINGS`
16. Generate innovation-derived knowledge drafts
17. Reason over connected ideas, experiments, and missing topics
18. Analyze risks / opportunities and compose recommendations with the 8-field lens
19. Score health, pipeline, experiment, portfolio, radar, and all area scores
20. Generate dashboards, executive innovation brief, projection, and history

## Recommendation Lens (8 required fields)

1. `innovationOpportunityExists`
2. `evidenceSupports`
3. `problemSolved`
4. `expectedImpact`
5. `investmentRequired`
6. `experimentsValidate`
7. `risksExist`
8. `capabilitiesRequired`

Each recommendation record also carries evidence refs, confidence score, risk
score, impact / investment estimates, experiment refs, capabilities required,
owner, due date, and priority.

## Horizons & Radar

- Horizons: `h1_core`, `h2_adjacent`, `h3_transformational`
- Technology radar rings: `adopt`, `trial`, `assess`, `hold`

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / structure soft signals |
| OIOS Core | Execution and health baseline |
| Executive Graph | Graph and risk/dependency context |
| Predictive | Forward growth / scenario soft signals |
| Market | Hard predecessor — white space, disruption, signal density |
| Opportunity | Opportunity density and capture readiness |
| Knowledge | Coverage / validation baseline |
| Document | Document innovation coverage proxy |
| Business Model | Fit and monetization clarity signals |
| Organizational Improvement | Improvement momentum and throughput |
| Executive Decision | Decision quality / velocity soft signals |

## Platform

| Surface | Value |
|---------|-------|
| Module id | `innovation` |
| Context key | `innovation` |
| Hard dependency | `market` |
| Soft reads | DNA, OIOS, graph, prediction, market, opportunity, knowledge, document, business-model, organizational-improvement, executive-decision |
| OIOS status | active |
| Service attach | `createIntelligenceService().innovation` |
| Layer | Future Intelligence |

## Non-negotiables

- Do not regenerate Sprint 021–043 packages
- Compose onto existing architecture only
- Keep `types` / `contracts` leaf
- Remain terminal after `market` in the platform pipeline
