# Competitive Intelligence (Sprint 047)

**Version:** 0.1.0 | **Domain key:** `competitive`

Twelve-area competitive environment assessment for JAG organizations. Continuously understand peer threats, substitutes, differentiation, enrollment dynamics, talent competition, and strategic scenarios — composing onto Market (043) and Economic (046) without regenerating those packages.

## Areas (12)

direct_peer_schools, indirect_substitutes, tuition_aid_positioning, program_curriculum_differentiation, enrollment_admissions_dynamics, regional_market_share, talent_faculty_competition, brand_reputation_choice_drivers, partnership_alliance_landscape, technology_delivery_models, expansion_launch_signals, consolidation_network_strategy

## Entry point

```ts
import { createCompetitiveIntelligence } from "@/lib/platform/intelligence/competitive";

const { service } = createCompetitiveIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "cmp-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

competitiveThreatExists · evidenceSupports · competitorsInvolved · ourDifferentiation · enrollmentOrRevenueImpact · responseOptions · organizationalCapabilitiesRequired · signalsToMonitor
