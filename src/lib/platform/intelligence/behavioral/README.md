# Behavioral Intelligence (Sprint 052)

**Version:** 0.1.0 | **Domain key:** `behavioral` | **ID prefix:** `beh-`

Seventeen-area organizational behavioral assessment for JAG. Continuously understand decisions, motivation, change adoption, collaboration, leadership, and behavioral risk - composing onto Reputation (051) without regenerating that package.

## Areas (17)

decision_behavior, cognitive_bias, motivation, incentive_modeling, organizational_change, change_resistance, leadership_behavior, team_dynamics, collaboration, communication_patterns, conflict_behavior, customer_behavior, employee_behavior, learning_adaptation, adoption_forecasting, behavioral_risk, behavioral_opportunity

## Entry point

```ts
import { createBehavioralIntelligence } from "@/lib/platform/intelligence/behavioral";

const { service } = createBehavioralIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "beh-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

decisionConfidence · cognitiveBiasRisk · motivationAlignment · adoptionProbability · collaborationImpact · changeResistance · leadershipReadiness · longTermBehavioralOutlook

## Hard DAG

`["reputation"]` - terminal platform module after Reputation Intelligence.

## Layer

Internal-facing behavioral intelligence after External reputation - how people inside and around the organization actually respond to strategy.
