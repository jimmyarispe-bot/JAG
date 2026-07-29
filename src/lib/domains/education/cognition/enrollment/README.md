# Enrollment Intelligence

First real Education **Cognitive Contributor** for JAG.

## Role

- Observe normalized enrollment contracts  
- Publish **EvidenceSet**  
- Produce **recommendations** with confidence, priority, explanation  
- Emit **Action proposals only**  

**Never** executes Action Runtime. **Never** queries a database. **Never** builds UI.

## Files

| File | Responsibility |
|------|----------------|
| `EnrollmentTypes.ts` | Input/output contracts |
| `EnrollmentEvidence.ts` | Evidence derivation |
| `EnrollmentAnalyzer.ts` | Readiness scoring |
| `EnrollmentRecommendations.ts` | Recommendation + action proposals |
| `EnrollmentContributor.ts` | Runtime `CognitiveContributor` |

## Host input

Supply `EnrollmentObservation` on Intent or OrganizationalContext attributes:

```ts
attributes: {
  "education.enrollment": observation,
}
```

## Direct API

```ts
import { runEnrollmentIntelligence } from "@/lib/domains/education";

const result = runEnrollmentIntelligence(observation);
```

## Docs

[`docs/domains/education/intelligence/01_ENROLLMENT_INTELLIGENCE.md`](../../../../../docs/domains/education/intelligence/01_ENROLLMENT_INTELLIGENCE.md)
