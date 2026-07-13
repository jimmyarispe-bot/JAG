# Reputation Intelligence (Sprint 051)

**Version:** 0.1.0 | **Domain key:** `reputation` | **ID prefix:** `rep-`

Seventeen-area reputation assessment for JAG organizations. Continuously understand brand, trust, perception, media, narratives, crisis, misinformation, recovery, and credibility — composing onto Stakeholder (050) without regenerating that package.

## Areas (17)

brand_reputation, organizational_trust, public_perception, customer_reputation, employee_reputation, executive_reputation, media_intelligence, press_coverage, social_narrative, community_reputation, partner_reputation, investor_donor_confidence, regulatory_reputation, crisis_reputation, misinformation_detection, reputation_recovery, credibility

## Entry point

```ts
import { createReputationIntelligence } from "@/lib/platform/intelligence/reputation";

const { service } = createReputationIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "rep-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

trustLevel · publicPerception · brandStrength · mediaExposure · crisisRisk · narrativeMomentum · credibility · longTermReputationOutlook

## Hard DAG

`["stakeholder"]` — terminal platform module after Stakeholder Intelligence.
