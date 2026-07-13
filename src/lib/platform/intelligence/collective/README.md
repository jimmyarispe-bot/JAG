# Collective Intelligence (Sprint 059)

**Version:** 0.1.0 | **Domain key:** `collective` | **ID prefix:** `col-`

Collaborative reasoning and multi-domain synthesis layer after institutional-memory. Aggregates multi-domain
recommendations and redistributes synthesized learning across the platform.

## Hard DAG

`["institutional-memory"]` - collaborative reasoning and multi-domain synthesis layer after Institutional Memory Intelligence.

## Layer

Collaborative reasoning / multi-domain synthesis after institutional-memory. Soft-reads all upstream domains and
synthesizes consensus, expertise distribution, and cross-domain agreement into actionable collective intelligence.

## Areas (17)

collective_reasoning, consensus_analysis, distributed_expertise, collaborative_intelligence, multi_domain_synthesis,
cross_functional_intelligence, organizational_alignment, team_decision_intelligence, expert_weighting,
perspective_diversity, conflict_resolution, collaborative_learning, organizational_coordination,
shared_decision_quality, collective_opportunity_detection, collective_risk_assessment, collective_intelligence_evolution

## Entry point

```ts
import { createCollectiveIntelligence } from "@/lib/platform/intelligence/collective";

const { service } = createCollectiveIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "col-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
```

## Lens (8 fields)

consensusStrength - expertiseCoverage - perspectiveDiversity - crossDomainAgreement - organizationalAlignment - collaborationQuality - collectiveConfidence - longTermCollectiveValue

## Closed learning destinations (7)

institutional-memory, knowledge, executive-decision, opportunity, predictive, stakeholder, organizational-improvement
