# Systems Intelligence (Sprint 055)

**Version:** 0.1.0 | **Domain key:** `systems` | **ID prefix:** `sys-`

Seventeen-area organizational systems assessment for JAG. Map dependencies, feedback loops, constraints, and cascading effects so leadership can anticipate second- and third-order consequences of strategy - composing onto Ethical (054) without regenerating that package.

## Areas (17)

system_mapping, dependency_analysis, feedback_loop_analysis, constraint_identification, bottleneck_detection, flow_optimization, emergent_behavior, network_dynamics, organizational_complexity, interdependency_modeling, cascading_risk, system_stability, leverage_point_identification, resource_flow, adaptive_capacity, system_evolution, scenario_interaction

## Entry point

```ts
import { createSystemsIntelligence } from "@/lib/platform/intelligence/systems";

const { service } = createSystemsIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "sys-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

dependencyImpact · bottleneckRisk · feedbackStability · systemComplexity · resourceFlow · cascadingRisk · adaptability · longTermSystemHealth

## Hard DAG

`["ethical"]` - terminal platform module after Ethical Intelligence.

## Layer

Internal/cross-cutting systems dynamics after Ethical - how dependencies, feedback, and cascading effects shape long-term organizational health.
