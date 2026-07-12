# Opportunity Intelligence Architecture

**Sprint:** 035  
**Package:** `src/lib/platform/intelligence/opportunity/`  
**Version:** `OPPORTUNITY_INTELLIGENCE_VERSION` (`0.1.0`)

## Purpose

Opportunity Intelligence is the cross-domain opportunity operating system for JAG OIOS. It aggregates signals from DNA, health, revenue, funding, graph, decision, predictive, governance, and continuous improvement into a single scored, ranked, and actionable opportunity portfolio.

## Package layout

```
opportunity/
├── types.ts                     # DTOs, enums, Request/Result, OpportunityLensImpact
├── contracts.ts                 # Leaf interfaces + OpportunityDependencies
├── models.ts                    # Baseline derivation, DNA alignment, helpers
├── categories.ts                # 22 category discoverers + OpportunityCategoryEngine
├── analysis.ts                  # Scoring, ROI, impact, risk, confidence, etc.
├── ranking.ts                   # Seven ranking lenses
├── opportunity-exchange.ts      # Common publish contract
├── opportunity-registry.ts      # Domain publisher registry
├── opportunity-intelligence.ts  # Scores, health, dashboards, heat map, brief
├── opportunity-engine.ts        # Orchestrated build() pipeline
├── service.ts                   # Thin façade
├── repository.ts                # In-memory persistence
├── projection.ts                # Projection + queries
├── index.ts                     # Public API + createOpportunityIntelligence()
├── README.md
└── CHANGELOG.md
```

## Composition flow

1. Derive baseline from DNA, OIOS, graph, prediction, financial, revenue, funding, human capital
2. Discover opportunities across 22 categories
3. Normalize into Opportunity Exchange records (plus any published domain opportunities)
4. Run analysis suite (score, ROI, impact, risk, confidence, dependencies, resources, time-to-value, strategic alignment)
5. Rank across seven lenses
6. Compose pipeline, scores, health, dashboards, heat map
7. Generate Executive Opportunity Brief + projection + history

## Opportunity Exchange contract

Every published opportunity includes:

- title, description, originating domain
- estimated financial impact, estimated mission impact
- implementation cost, required resources, expected timeline
- confidence, priority, dependencies, risks
- organizational DNA alignment
- five-lens impact narrative

## Five-lens recommendation contract

| Lens | Question |
|------|----------|
| `organizationalHealth` | How does this improve the organization? |
| `financialSustainability` | How does this improve financial sustainability? |
| `missionImpact` | How does this improve mission impact? |
| `longTermValue` | How does this improve long-term value? |
| `timeToValue` | How quickly can we realize the benefit? |

## Upstream integrations

| Source | Use |
|--------|-----|
| Organizational DNA | Stage/model/readiness alignment |
| OIOS Core | Health, strategy, continuous improvement |
| Organization Health | Operating posture signals |
| Human Capital | Workforce capacity for pursuit |
| Revenue Intelligence | Growth and pricing opportunity signals |
| Funding Intelligence | Funding pipeline and top opportunities |
| Executive Graph | Graph opportunity paths and risk |
| Executive Decision | Scenario/decision context |
| Predictive Intelligence | Emerging opportunity/risk signals |
| Board Governance | Oversight context |
| Continuous Improvement Loop | Improvement-cycle publishers via registry |

## DI surfaces

| Surface | Value |
|---------|-------|
| Factory | `createOpportunityIntelligence()` |
| Service attach | `createIntelligenceService().opportunity` |
| Platform module | `opportunity` (depends on `funding`) |
| Context key | `opportunity` |
| OIOS domain | `opportunity` (active) |

## Related docs

- [Sprint 035 Summary](./SPRINT035_OPPORTUNITY_INTELLIGENCE.md)
- [Verification Checklist](./OPPORTUNITY_INTELLIGENCE_VERIFICATION.md)
- [Future Sprint Guidelines](./FUTURE_SPRINT_GUIDELINES.md)
