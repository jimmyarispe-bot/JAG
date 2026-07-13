# Cultural Intelligence Architecture (Sprint 053)

## Placement

Internal-facing domain after Behavioral (052). Hard DAG dependency: `["behavioral"]`. Soft-reads Behavioral, Stakeholder, Human Capital, Executive Decision, Opportunity, Knowledge, and Predictive via leaf light types only.

## Package layout

- `types.ts` / `contracts.ts` / `models.ts` - leaf-safe contracts and baseline derivation
- `area-factory.ts` + 17 `*-intelligence.ts` area assessors
- Specialized engines: CultureMapping, Engagement, MissionAlignment, ValuesAlignment, Collaboration, EarlyWarning
- Standard engines: Analysis, Forecast, Trend, Scenario
- Composers in `cultural-intelligence.ts`; orchestration in `cultural-engine.ts`
- `createCulturalIntelligence` factory in `index.ts`

## Soft integrations

No circular imports. `CulturalRequest` accepts `BehavioralResultLight` and peer light types only.

## Closed learning

Destinations: behavioral, stakeholder, human-capital, opportunity, knowledge, executive-decision, predictive.
