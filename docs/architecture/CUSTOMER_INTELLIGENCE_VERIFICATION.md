# Customer Intelligence — Verification Checklist

## Static

- [x] Package exists at `src/lib/platform/intelligence/customer/`
- [x] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [x] `CUSTOMER_INTELLIGENCE_VERSION = "0.1.0"`
- [x] Constants: 6 journey stages, 6 engagement dims, 6 satisfaction signals, 6 retention factors, 5 community pillars
- [x] `customer` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [x] `customer` in `INTELLIGENCE_MODULE_IDS`
- [x] Module adapter registered after `operations` in `createDefaultIntelligenceModules()`
- [x] `createIntelligenceService()` exposes `.customer`
- [x] Public exports present on `@/lib/platform/intelligence`
- [x] README + CHANGELOG + sprint/architecture docs present
- [x] Does not regenerate Revenue / DNA / Success / Operations packages
- [x] Does not regenerate Sprint 021–038 packages

## Behavioral

- [x] `service.build()` returns health/engagement/journey/satisfaction/retention/community/risk scores
- [x] Journey map covers all `JOURNEY_STAGES`
- [x] Engagement covers all `ENGAGEMENT_DIMENSIONS`
- [x] Satisfaction covers all `SATISFACTION_SIGNALS`
- [x] Retention watchlist covers all `RETENTION_RISK_FACTORS`
- [x] Community health covers all `COMMUNITY_BELONGING_PILLARS`
- [x] Result includes dashboard, brief, projection
- [x] Every recommendation includes all six `CustomerLensImpact` keys
- [x] Query + repository persistence work
- [x] Soft upstream light types: `RevenueResultLight`, `OperationsResultLight`
- [x] `createCustomerIntelligence()` returns `CustomerStack`
- [x] Platform pipeline order ends with `customer`
- [x] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected pipeline order

```
organization-dna → oios-core → organization-health → financial → founder
→ executive → executive-graph → executive-decision → predictive
→ board-governance → human-capital → revenue → funding → opportunity
→ organizational-improvement → business-model → operations → customer
```
