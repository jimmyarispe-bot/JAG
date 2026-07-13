# Ecosystem Intelligence (Sprint 057)

**Version:** 0.1.0 | **Domain key:** `ecosystem` | **ID prefix:** `esm-`

Seventeen-area organizational ecosystem assessment for JAG. Map partnerships, networks, and dependencies so leadership can strengthen strategic position across the broader institutional landscape - composing onto Resilience (056) without regenerating that package.

## Areas (17)

ecosystem_mapping, strategic_partnerships, supplier_ecosystems, customer_ecosystems, community_networks, industry_networks, technology_ecosystems, academic_research_partnerships, government_ecosystems, investor_funding_networks, nonprofit_ngo_relationships, platform_ecosystems, alliance_intelligence, network_effects, ecosystem_dependencies, collaboration_opportunities, ecosystem_risk

## Entry point

```ts
import { createEcosystemIntelligence } from "@/lib/platform/intelligence/ecosystem";

const { service } = createEcosystemIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "esm-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

networkStrength · strategicPartnerships · ecosystemHealth · collaborationPotential · dependencyRisk · networkEffects · strategicPosition · longTermEcosystemOutlook

## Hard DAG

`["resilience"]` - terminal platform module after Resilience Intelligence.

## Layer

External/network layer after Resilience - how partnerships, networks, and dependencies shape strategic position.
