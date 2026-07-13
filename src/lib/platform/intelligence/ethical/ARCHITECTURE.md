# Ethical Intelligence Architecture (Sprint 054)

## Placement

Internal-facing domain after Cultural (053). Hard DAG dependency: `["cultural"]`. Soft-reads Cultural, Behavioral, Legal Compliance Risk, Executive Decision, Opportunity, Predictive, and Reputation via leaf light types only.

## Package layout

- `types.ts` / `contracts.ts` / `models.ts` - leaf-safe contracts and baseline derivation
- `area-factory.ts` + 17 `*-intelligence.ts` area assessors
- Specialized engines: ValuesAlignment, Fairness, HumanImpact, AiEthics, GovernanceEthics, EarlyWarning
- Standard engines: Analysis, Forecast, Trend, Scenario
- Composers in `ethical-intelligence.ts`; orchestration in `ethical-engine.ts`
- `createEthicalIntelligence` factory in `index.ts`

## Soft integrations

No circular imports. `EthicalRequest` accepts `CulturalResultLight` and peer light types only.

## Closed learning

Destinations: cultural, behavioral, legal-compliance-risk, opportunity, executive-decision, predictive, reputation.
