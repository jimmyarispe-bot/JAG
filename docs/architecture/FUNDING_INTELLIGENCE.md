# Funding Intelligence Architecture

## Purpose

Continuously identify, qualify, prioritize, pursue, manage, forecast, optimize, and monitor funding opportunities — composed on Organizational DNA + OIOS Core after Revenue Intelligence.

**Package:** `src/lib/platform/intelligence/funding/`  
**Version:** `0.1.0` (Sprint 034)

## Package layout

```
src/lib/platform/intelligence/funding/
├── types.ts
├── contracts.ts
├── models.ts
├── government-funding.ts
├── grant-intelligence.ts
├── contracts-procurement.ts
├── philanthropy-intelligence.ts
├── investment-intelligence.ts
├── alternative-funding.ts
├── funding-strategy.ts
├── funding-intelligence.ts
├── funding-engine.ts
├── service.ts
├── repository.ts
├── projection.ts
├── index.ts
├── README.md
└── CHANGELOG.md
```

## Composition flow

```
FundingRequest
  → deriveFundingBaseline (DNA / OIOS / graph / financial / revenue / prediction)
  → Government → Grants → Contracts → Philanthropy → Investment → Alternative
  → Strategy (mix / diversification / risk / scenarios / runway / capital)
  → Top opportunities + proposal priorities
  → Scores (health / opportunity / risk) + Dashboards + Calendar + Brief + Projection
  → FundingRepository.save
  → FundingResult
```

## Upstream integrations

| Source | How consumed |
|--------|----------------|
| Organizational DNA | readiness / revenue-model signals for baseline |
| OIOS Core | baseline financial/capability scores, health |
| Financial Intelligence | `financialSignal` / platform context `financial` |
| Revenue Intelligence | light attachment (`healthScore`, diversification, recommendations) |
| Executive Graph | `graphInput.executive.revenue`, analysis risk |
| Executive Decision | soft context on request |
| Predictive Intelligence | emerging funding/cash risks |
| Board Governance | soft context on request |
| Human Capital | light attachment (`workforceHealthScore`) |
| Continuous Improvement | recommendations feed improvement loops |

## DI surfaces

| Surface | Entry |
|---------|-------|
| Domain factory | `createFundingIntelligence(options?)` |
| Service attach | `createIntelligenceService().funding` |
| Platform module | `funding` → context key `funding` |
| OIOS registry | domain `funding` (active) |

## Recommendation contract

Every recommendation carries five-lens impact:

- `availableFunding`
- `diversification`
- `fundingRisk`
- `sustainability`
- `missionImpact`

## Related docs

- [Sprint 034](./SPRINT034_FUNDING_INTELLIGENCE.md)
- [Verification](./FUNDING_INTELLIGENCE_VERIFICATION.md)
- [Future Sprint Guidelines](./FUTURE_SPRINT_GUIDELINES.md)
