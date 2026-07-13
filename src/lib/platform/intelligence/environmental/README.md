# Environmental Intelligence (Sprint 049)

**Version:** 0.1.0 | **Domain key:** `environmental` | **ID prefix:** `env-`

Seventeen-area environmental assessment for JAG organizations. Continuously understand climate, weather risk, disasters, sustainability, energy, water, air quality, waste, carbon, biodiversity, infrastructure resilience, facilities, supply-chain environmental risk, insurance, funding, and ESG — composing onto Political (048) without regenerating that package.

## Areas (17)

climate, weather_risk, natural_disaster, environmental_regulation, sustainability, energy, water_resources, air_quality, waste_management, carbon_emissions, biodiversity, infrastructure_resilience, facility_risk, supply_chain_environmental_risk, insurance_exposure, environmental_funding, esg_impact

## Entry point

```ts
import { createEnvironmentalIntelligence } from "@/lib/platform/intelligence/environmental";

const { service } = createEnvironmentalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "env-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

climateRisk · facilityExposure · infrastructureResilience · resourceAvailability · sustainabilityImpact · regulatoryExposure · insuranceRisk · longTermEnvironmentalOutlook

## Hard DAG

`["political"]` — terminal platform module after Political Intelligence.
