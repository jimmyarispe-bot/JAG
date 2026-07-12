# Changelog — Customer Intelligence

## 0.1.0 — Sprint 039

### Added

- Customer Intelligence domain package (`customer`)
- Core: `CustomerIntelligenceService`, `CustomerIntelligenceEngine`, `CustomerRepository`, `CustomerModels`, `CustomerDashboard`, `CustomerHealth`, `CustomerRegistry`
- Journey map across 6 stages
- Engagement across 6 dimensions
- Satisfaction across 6 signals
- Retention watchlist across 6 risk factors
- Community belonging across 5 pillars
- Outputs: health/engagement/journey/satisfaction/retention/community/risk scores, executive brief, dashboard, projection, risks, opportunities, recommendations
- Six-lens recommendation contract (`CustomerLensImpact`)
- DI via `createCustomerIntelligence()` returning `CustomerStack`
- Soft-reads DNA / OIOS / organization-health graph signals / revenue / operations
