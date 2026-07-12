# Human Capital Intelligence Architecture

## Purpose

Talent lifecycle intelligence for JAG OIOS. Composes recruiting, employee development, leadership, retention, learning, compensation, and workforce planning into executive-ready scores and recommendations.

## Package layout

```
src/lib/platform/intelligence/human-capital/
├── types.ts
├── contracts.ts
├── models.ts
├── recruiting-intelligence.ts
├── employee-intelligence.ts
├── leadership-intelligence.ts
├── retention-intelligence.ts
├── learning-intelligence.ts
├── compensation-intelligence.ts
├── planning-intelligence.ts
├── workforce-intelligence.ts
├── projection.ts
├── repository.ts
├── human-capital-engine.ts
├── service.ts
├── index.ts
├── README.md
└── CHANGELOG.md
```

## Composition flow

```
HumanCapitalRequest
  → deriveHumanCapitalBaseline (DNA / OIOS / graph / prediction / workforce health)
  → Employee + Retention + Leadership + Learning pipelines
  → Recruiting + Compensation + Planning pipelines
  → WorkforceIntelligence.composeScores
  → Brief + Dashboard + Capability Index + Burnout Dashboard
  → Projection + Repository history
  → HumanCapitalResult
```

## Upstream integrations

| Source | Consumption |
|--------|-------------|
| Organizational DNA | Team size, readiness, capability |
| OIOS Core | Health / capability baseline, continuous improvement context |
| Organization Health | Workforce health signal |
| Executive Graph | Staff / risk / org health signals |
| Executive Decision | Optional decision context on request |
| Predictive Intelligence | Emerging talent / retention risks |
| Board Governance | Soft context when run in platform pipeline |

## DI surfaces

| Surface | Entry |
|---------|-------|
| Factory | `createHumanCapitalIntelligence()` |
| Master service | `createIntelligenceService().humanCapital` |
| Platform module | `human-capital` → context key `humanCapital` |
| OIOS registry | domain `human-capital` (active) |

## Recommendation contract

Engines produce narratives and actions that improve organization capability, employee growth, leader effectiveness, mission delivery, and financial sustainability — without becoming transactional HR tooling.
