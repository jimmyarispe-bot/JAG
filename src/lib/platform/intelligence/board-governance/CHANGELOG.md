# Changelog — Board & Governance Intelligence

## 0.1.0 — Sprint 029 (2026-07-12)

### Added

- `BoardIntelligenceEngine` — orchestrates full board / governance generation
- `GovernanceEngine` — composes final `GovernanceResult`
- `BoardPacketGenerator` — monthly packet, quarterly review, and specialty reports
- `ExecutiveBriefGenerator` — short-form executive briefing
- `CommitteeReporting` — finance / academic / audit / governance / risk reports
- `StrategicInitiativeTracker` — initiative status for board oversight
- `GovernanceDashboard` — governance overview projection
- `BoardKPIDashboard` — KPI rollup for packets
- `RiskRegister` — risk inventory + heat map
- `ComplianceMonitor` — compliance posture monitoring
- `ExecutiveScorecards` — CEO / CFO / mission scorecards
- `ResolutionTracker` — board resolution follow-up
- `GovernanceCalendar` — meetings, deadlines, follow-ups
- `BoardQueries` — deterministic Q&A over governance results
- `GovernanceProjection` — dashboard / UI flatten
- `GovernanceRepository` — in-memory packet + history store
- `GovernanceModels` (`governanceModels`) — baselines, KPI builders, helpers
- `GovernanceService` — public façade
- `createBoardGovernanceIntelligence()` DI factory
- Platform module adapter `board-governance` (depends on `predictive`)

### Packet kinds

Monthly Board Packet · Quarterly Strategic Review · Executive KPI Summary · Financial Summary · Risk Heat Map · Strategic Initiative Status · Governance Dashboard · Mission Scorecard · Compliance Summary · Executive Briefing
