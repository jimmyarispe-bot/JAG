# Board & Governance Intelligence — Architecture

**Sprint:** 029  
**Package:** `src/lib/platform/intelligence/board-governance/`  
**Version:** `0.1.0`

## Purpose

Convert Executive Graph, Executive Decision, and Predictive Intelligence outputs into board-ready reporting, strategic oversight, compliance monitoring, and governance workflows.

## Contracts

| Contract | Role |
|----------|------|
| `BoardIntelligenceEngine` | Orchestrate full governance runs |
| `GovernanceEngine` | Compose final result DTO |
| `BoardPacketGenerator` | Build packet artifacts by kind |
| `ExecutiveBriefGenerator` | Short-form leadership briefing |
| `CommitteeReporting` | Committee-ready sections |
| `StrategicInitiativeTracker` | Initiative status tracking |
| `GovernanceDashboard` | Governance overview |
| `BoardKPIDashboard` | KPI rollup |
| `RiskRegister` | Risk inventory + heat map |
| `ComplianceMonitor` | Compliance posture |
| `ExecutiveScorecards` | Role scorecards |
| `ResolutionTracker` | Resolution follow-up |
| `GovernanceCalendar` | Governance calendar |
| `BoardQueries` | Deterministic Q&A |
| `GovernanceProjection` | Dashboard / briefing flatten |
| `GovernanceRepository` | Persist packets + history |
| `GovernanceService` | Public façade |

## Governance pipeline

1. Resolve graph / decision / prediction context (optional DI hooks)
2. Derive `GovernanceBaseline` from executive / health / founder / decision / prediction
3. Build KPIs, risk register, initiatives, compliance, resolutions, calendar, scorecards, committees
4. Generate requested packet kinds + executive brief
5. Build governance + KPI dashboards and risk heat map
6. Project briefing, record history, persist packets

## Platform integration

Module id: `board-governance`  
Dependencies: `["predictive"]`  
Context write key: `boardGovernance`  
Context reads: `executiveGraph`, `executiveDecision`, `predictive`

Default pipeline order:

```
organization-health → financial → founder → executive
→ executive-graph → executive-decision → predictive → board-governance
```

## DI entry points

```ts
createBoardGovernanceIntelligence(options?)
createIntelligenceService().boardGovernance
createIntelligencePlatform({ boardGovernance, boardGovernanceOptions })
```
