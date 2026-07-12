# Opportunity Intelligence (Sprint 035)

Continuously discover, evaluate, prioritize, score, and recommend opportunities that make organizations healthier, stronger, more profitable, more impactful, and more sustainable — composed on Organizational DNA + OIOS Core, after Funding Intelligence.

## Quick start

```ts
import { createOpportunityIntelligence } from "@/lib/platform/intelligence/opportunity";

const { service } = createOpportunityIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "opp-1",
  scope: { organizationId: "org-1", schoolId: null },
});

console.log(result.opportunityScore, result.brief.headline);
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `OpportunityIntelligenceService`, `OpportunityEngine`, `OpportunityRepository`, `OpportunityModels`, `OpportunityDashboard`, `OpportunityHealth`, `OpportunityExchange`, `OpportunityRegistry` |
| Categories | Revenue, Funding, Cost Reduction, Pricing, Market/Geographic Expansion, Customer Growth, Retention, Partnership, Strategic Alliance, Acquisition, Merger, Technology, Automation, Vendor Optimization, Procurement Savings, Real Estate, Asset Optimization, Licensing, IP, Innovation, Mission Impact |
| Analysis | OpportunityScoring, ROIAnalysis, ImpactAnalysis, RiskAnalysis, ConfidenceScoring, DependencyAnalysis, ResourceRequirements, TimeToValueAnalysis, StrategicAlignment |
| Ranking | Highest ROI, Quick Wins, Strategic Investments, Mission Critical, Long-Term Growth, Highest Confidence, Lowest Risk |

## Outputs

- Top Opportunities Dashboard
- Executive Opportunity Brief
- Opportunity Pipeline
- Quick Wins Dashboard
- Strategic Investment Dashboard
- Mission Opportunity Dashboard
- Opportunity Heat Map
- Opportunity Score / Health / Risk scores

Every recommendation narrative addresses **organizational health**, **financial sustainability**, **mission impact**, **long-term value**, and **time to value** via `OpportunityLensImpact`.

## Architecture position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createOpportunityIntelligence()` |
| Service attach | `createIntelligenceService().opportunity` |
| Platform module id | `opportunity` |
| Context key | `opportunity` |
| OIOS domain | `opportunity` (active) |
| Version | `OPPORTUNITY_INTELLIGENCE_VERSION` (`0.1.0`) |
| Injectables | `now`, `createId`, per-module overrides, `repository`, `exchange`, `registry` |

## Docs

- [Sprint 035](../../../../docs/architecture/SPRINT035_OPPORTUNITY_INTELLIGENCE.md)
- [Architecture](../../../../docs/architecture/OPPORTUNITY_INTELLIGENCE.md)
- [Verification](../../../../docs/architecture/OPPORTUNITY_INTELLIGENCE_VERIFICATION.md)
