# Resilience Intelligence (Sprint 056)

**Version:** 0.1.0 | **Domain key:** `resilience` | **ID prefix:** `rsl-`

Seventeen-area organizational resilience assessment for JAG. Evaluate readiness, recovery, continuity, and adaptive capacity so leadership can strengthen the institution against disruption - composing onto Systems (055) without regenerating that package.

## Areas (17)

organizational_resilience, business_continuity, disaster_recovery, operational_recovery, financial_resilience, workforce_resilience, supply_chain_resilience, cyber_resilience, infrastructure_resilience, vendor_resilience, crisis_readiness, adaptive_capacity, redundancy_planning, recovery_time_analysis, stress_testing, resilience_optimization, long_term_adaptability

## Entry point

```ts
import { createResilienceIntelligence } from "@/lib/platform/intelligence/resilience";

const { service } = createResilienceIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "rsl-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

organizationalReadiness · recoveryCapability · operationalStability · financialStability · workforceStability · infrastructureReadiness · adaptiveCapacity · longTermResilienceOutlook

## Hard DAG

`["systems"]` - terminal platform module after Systems Intelligence.

## Layer

Internal/adaptive capacity after Systems - how readiness, recovery, and long-term adaptability harden the institution.
