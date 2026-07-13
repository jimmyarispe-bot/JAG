# Ethical Intelligence (Sprint 054)

**Version:** 0.1.0 | **Domain key:** `ethical` | **ID prefix:** `eth-`

Seventeen-area organizational ethical assessment for JAG. Continuously evaluate decisions, AI recommendations, and policies against fairness, transparency, accountability, and human impact - composing onto Cultural (053) without regenerating that package.

## Areas (17)

ethical_decision_analysis, values_alignment, fairness, transparency, accountability, human_impact, ai_ethics, responsible_automation, bias_discrimination, governance_ethics, privacy_data_ethics, sustainability_ethics, social_responsibility, ethical_risk, ethical_opportunity, ethical_stewardship, recommendation_validation

## Entry point

```ts
import { createEthicalIntelligence } from "@/lib/platform/intelligence/ethical";

const { service } = createEthicalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "eth-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

valuesAlignment · fairness · transparency · accountability · humanImpact · biasRisk · governanceIntegrity · longTermEthicalOutlook

## Hard DAG

`["cultural"]` - terminal platform module after Cultural Intelligence.

## Layer

Internal-facing ethical intelligence after Cultural - how values, fairness, AI ethics, and stewardship sustain principled decisions.
