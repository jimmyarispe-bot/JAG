# Cultural Intelligence (Sprint 053)

**Version:** 0.1.0 | **Domain key:** `cultural` | **ID prefix:** `cul-`

Seventeen-area organizational cultural assessment for JAG. Continuously understand mission, values, engagement, psychological safety, collaboration, and cultural transformation - composing onto Behavioral (052) without regenerating that package.

## Areas (17)

organizational_culture, team_culture, leadership_culture, mission_alignment, values_alignment, employee_engagement, collaboration_culture, communication_culture, innovation_culture, learning_culture, psychological_safety, inclusion_belonging, cross_cultural, community_culture, cultural_risk, cultural_opportunity, cultural_transformation

## Entry point

```ts
import { createCulturalIntelligence } from "@/lib/platform/intelligence/cultural";

const { service } = createCulturalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "cul-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

missionAlignment · valuesAlignment · culturalHealth · collaborationQuality · innovationReadiness · psychologicalSafety · engagement · longTermCulturalOutlook

## Hard DAG

`["behavioral"]` - terminal platform module after Behavioral Intelligence.

## Layer

Internal-facing cultural intelligence after Internal behavioral - how mission, values, and shared norms sustain collaboration and long-term health.
