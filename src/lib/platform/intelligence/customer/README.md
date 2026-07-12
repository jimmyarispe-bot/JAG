# Customer Intelligence (Sprint 039)

Continuously monitor and improve the family and student experience across the school lifecycle — inquiry → enrollment → engagement → satisfaction → retention → community belonging.

> Distinct from Revenue's customer-revenue suite, DNA personas, and JAG Success Intelligence.

## Quick start

```ts
import { createCustomerIntelligence } from "@/lib/platform/intelligence/customer";

const { service } = createCustomerIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "cust-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.healthScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `CustomerIntelligenceService`, `CustomerIntelligenceEngine`, `CustomerRepository`, `CustomerModels`, `CustomerDashboard`, `CustomerHealth`, `CustomerRegistry` |
| Journey | 6 `JOURNEY_STAGES` |
| Engagement | 6 `ENGAGEMENT_DIMENSIONS` |
| Satisfaction | 6 `SATISFACTION_SIGNALS` |
| Retention | 6 `RETENTION_RISK_FACTORS` |
| Community | 5 `COMMUNITY_BELONGING_PILLARS` |

## Outputs

- Customer Health / Engagement / Journey / Satisfaction / Retention / Community / Risk scores
- Journey map + engagement + satisfaction suites
- Retention watchlist + community health
- Executive Customer Brief, dashboard, projection
- Risks / opportunities / recommendations (six-lens)

Every recommendation answers the six `CustomerLensImpact` keys: family experience, student engagement, journey continuity, satisfaction sentiment, retention risk, community belonging.

## Architecture position

```
… → business-model → operations → customer
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createCustomerIntelligence()` |
| Service attach | `createIntelligenceService().customer` |
| Stack | `CustomerStack { service, engine, organizationDna, oios }` |
| Platform module id | `customer` |
| Context key | `customer` |
| OIOS domain | `customer` (active) |
| Hard dependency | `operations` |
| Soft upstream | DNA personas, OIOS, org-health graph signals, Revenue, Operations |

## Docs

- Architecture: `docs/architecture/CUSTOMER_INTELLIGENCE.md`
- Sprint summary: `docs/architecture/SPRINT039_CUSTOMER_INTELLIGENCE.md`
- Verification: `docs/architecture/CUSTOMER_INTELLIGENCE_VERIFICATION.md`
