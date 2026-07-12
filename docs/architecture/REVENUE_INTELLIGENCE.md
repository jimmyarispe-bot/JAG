# Revenue Intelligence Architecture

## Purpose

Sustainable revenue, profitability, pricing, customer value, and growth intelligence composed on Organizational DNA + OIOS Core.

**Package:** `src/lib/platform/intelligence/revenue/`  
**Version:** `0.1.0` (Sprint 033)

## Package layout

```
src/lib/platform/intelligence/revenue/
├── types.ts
├── contracts.ts
├── models.ts
├── strategy-intelligence.ts
├── pricing-intelligence.ts
├── offering-intelligence.ts
├── customer-revenue-intelligence.ts
├── sales-intelligence.ts
├── market-intelligence.ts
├── financial-margin-intelligence.ts
├── revenue-intelligence.ts
├── revenue-engine.ts
├── service.ts
├── repository.ts
├── projection.ts
├── index.ts
├── README.md
└── CHANGELOG.md
```

## Composition flow

```
RevenueRequest
  → deriveRevenueBaseline (DNA / OIOS / graph / financial / prediction)
  → Strategy → Pricing → Offerings → Customers → Sales → Market → Margins
  → Scores (health / growth / risk) + Dashboards + Brief + Projection
  → RevenueRepository.save
  → RevenueResult
```

## Upstream integrations

| Source | How consumed |
|--------|----------------|
| Organizational DNA | `dna.revenueModel`, readiness/financial signals |
| OIOS Core | baseline financial/capability scores, health |
| Financial Intelligence | `financialSignal` / platform context `financial` |
| Executive Graph | `graphInput.executive.revenue`, analysis risk |
| Executive Decision | soft context on request |
| Predictive Intelligence | emerging revenue/cash risks |
| Board Governance | soft context on request |
| Human Capital | light attachment (`workforceHealthScore`) |
| Continuous Improvement | recommendations feed improvement loops |

## DI surfaces

| Surface | Entry |
|---------|-------|
| Domain factory | `createRevenueIntelligence(options?)` |
| Service attach | `createIntelligenceService().revenue` |
| Platform module | `revenue` → context key `revenue` |
| OIOS registry | domain `revenue` (active) |

## Recommendation contract

Every recommendation carries five-lens impact:

- `sustainableRevenue`
- `profitability`
- `missionImpact`
- `revenueRisk`
- `longTermHealth`

Plus operational fields: `expectedRevenueLift`, `profitabilityImpact`, `missionImpact`, `riskReduction`, `longTermHealth`.

## Related docs

- [Sprint 033 summary](./SPRINT033_REVENUE_INTELLIGENCE.md)
- [Verification checklist](./REVENUE_INTELLIGENCE_VERIFICATION.md)
- [JAG OIOS Architecture](./JAG_OIOS_ARCHITECTURE.md)
- [Intelligence Domain Model](./INTELLIGENCE_DOMAIN_MODEL.md)
