# Market Intelligence

**Sprint:** 043  
**Package:** `src/lib/platform/intelligence/market/`  
**Module id / OIOS domain:** `market`

## Purpose

Continuously understand the external environment so leadership can anticipate
change. This is organizational market awareness — NOT marketing analytics. It
composes onto Legal, Compliance & Risk Intelligence (Sprint 042) and the wider
OIOS to reason about industry structure, competition, market size, demand,
expansion, and white-space opportunity.

## Package Layout

| File | Role |
|------|------|
| `types.ts` | Leaf DTOs, constants, request/result |
| `contracts.ts` | Leaf interfaces + DI bag |
| `models.ts` | Baseline derivation + score/confidence/lens helpers |
| `industry-intelligence.ts` | Industry structure, attractiveness, growth |
| `competitive-intelligence.ts` | Competitors, launches, pricing pressure |
| `market-size-intelligence.ts` | TAM / SAM / SOM estimates |
| `pricing-intelligence.ts` | Pricing bands and power |
| `customer-demand-intelligence.ts` | Demand momentum and shift signals |
| `demographic-intelligence.ts` | Demographic cohorts and population change |
| `geographic-expansion-intelligence.ts` | Expansion candidates and readiness |
| `economic-trend-intelligence.ts` | Economic indicators and employment trends |
| `technology-trend-intelligence.ts` | Technology disruption and adoption |
| `partnership-intelligence.ts` | Partnership density and alliances |
| `mergers-acquisitions-intelligence.ts` | M&A targets and consolidation |
| `white-space-intelligence.ts` | Unmet needs and capture opportunities |
| `knowledge-contribution.ts` | Market-derived knowledge drafts |
| `market-reasoner.ts` | Reasoning over opportunities, competitors, gaps |
| `market-registry.ts` | Upstream publisher registry |
| `market-intelligence.ts` | Scores, health, dashboards, analyzers, briefs |
| `market-engine.ts` | Orchestrator |
| `service.ts` / `repository.ts` / `projection.ts` | Facade, store, queries |
| `index.ts` | Public API + `createMarketIntelligence()` |

## Composition Flow

1. Derive baseline from DNA / OIOS / graph / prediction soft reads and from
   Knowledge, Document, Legal Compliance & Risk, Revenue, Funding, Customer,
   Business Model, Operations, and Opportunity `*ResultLight` signals
2. Assess industry structure and attractiveness
3. Assess competitive position, launches, and pricing pressure
4. Estimate market size (TAM / SAM / SOM)
5. Assess pricing bands and pricing power
6. Assess customer demand momentum and shift signals
7. Assess demographic fit and population change
8. Rank geographic expansion candidates
9. Assess economic indicators and employment trends
10. Assess technology disruption and adoption stages
11. Assess partnership density and pipeline
12. Assess M&A targets and consolidation pressure
13. Identify white-space opportunities
14. Compose market signals across all `MARKET_SIGNAL_KINDS`
15. Generate market-derived knowledge drafts
16. Reason over connected opportunities, competitors, and missing topics
17. Analyze risks / opportunities and compose recommendations with the 8-field lens
18. Score health, competitive position, expansion opportunity, market risk
    (inverted pressure), and all 12 area scores
19. Generate dashboards, executive market brief, projection, and history

## Recommendation Lens (8 required fields)

1. `marketOpportunityExists`
2. `evidenceSupports`
3. `competitorsInvolved`
4. `estimatedMarketSize`
5. `risksExist`
6. `investmentRequired`
7. `expectedReturn`
8. `organizationalCapabilitiesRequired`

Each recommendation record also carries evidence refs, confidence score, risk
score, market size / investment / expected return estimates, competitors,
capabilities required, owner, due date, and priority.

## Market Signal Kinds

`competitor_launches`, `competitor_pricing`, `industry_reports`,
`customer_demand_shifts`, `population_changes`, `employment_trends`,
`economic_indicators`, `regulatory_changes`, `technology_disruption`,
`emerging_markets`, `industry_consolidation`

## Integrations

| Domain | Integration |
|--------|-------------|
| Organization DNA | Persona / structure soft signals |
| OIOS Core | Execution and health baseline |
| Executive Graph | Graph and risk/dependency context |
| Predictive | Forward growth signals |
| Knowledge | Coverage / validation baseline |
| Document | Document market coverage proxy |
| Legal Compliance & Risk | Hard predecessor — regulatory / compliance pressure |
| Revenue | Diversification and pricing power signals |
| Funding | Funding capacity and pipeline signals |
| Customer | Demand momentum and experience signals |
| Business Model | Fit and monetization clarity signals |
| Operations | Capacity and process coverage signals |
| Opportunity | Opportunity density and capture readiness |

## Platform

| Surface | Value |
|---------|-------|
| Module id | `market` |
| Context key | `market` |
| Hard dependency | `legal-compliance-risk` |
| Soft reads | DNA, OIOS, graph, prediction, knowledge, document, legal-compliance-risk, revenue, funding, customer, business-model, operations, opportunity |
| OIOS status | active |
| Service attach | `createIntelligenceService().market` |

## Non-negotiables

- Do not regenerate Sprint 021–042 packages
- Compose onto existing architecture only
- Keep `types` / `contracts` leaf
- Remain terminal after `legal-compliance-risk` in the platform pipeline
