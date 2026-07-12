# Sprint 039 — Customer Intelligence

**Branch:** `founder-os-beta`  
**Domain key:** `customer`  
**Package:** `src/lib/platform/intelligence/customer/`  
**Version:** `0.1.0`

## Vision

Continuously monitor and improve the family and student experience across the school lifecycle — inquiry → enrollment → engagement → satisfaction → retention → community belonging.

## Objective

Every recommendation answers:

1. How is family experience affected?
2. How is student engagement affected?
3. Is journey continuity intact?
4. What is satisfaction sentiment?
5. What retention risk exists?
6. How is community belonging?

## Delivered

- Core: `CustomerIntelligenceService`, `CustomerIntelligenceEngine`, `CustomerRepository`, `CustomerModels`, `CustomerDashboard`, `CustomerHealth`, `CustomerRegistry`
- Journey map (6 stages) + engagement (6 dimensions) + satisfaction (6 signals)
- Retention watchlist (6 factors) + community belonging (5 pillars)
- Outputs: scores, Executive Customer Brief, dashboard, projection, risks, opportunities, recommendations
- OIOS domain activation for `customer`
- Platform module `customer` (depends on `operations`)
- DI via `createCustomerIntelligence()` and `createIntelligenceService().customer`

## Pipeline position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital → revenue → funding → opportunity
  → organizational-improvement → business-model → operations → customer
```

## Non-negotiables honored

- Did not regenerate Sprint 021–038 packages
- Distinct from Revenue's customer-revenue suite, DNA personas, and JAG Success Intelligence
- Leaf modules remain leaf (`types` / `contracts` import-free of implementations)
- Soft-reads DNA / OIOS / org-health graph signals / Revenue / Operations
- Hard DAG dependency on `operations` only
