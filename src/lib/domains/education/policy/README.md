# Education Policy Engine

Evaluates Knowledge Model policy definitions against normalized observations.

**Produces:** satisfied / violated / unknown outcomes + traces  
**Does not:** execute actions, produce recommendations, call contributors, or access databases

## Usage

```ts
import {
  createEducationPolicyEngine,
  EDUCATION_POLICY_IDS,
} from "@/lib/domains/education";

const engine = createEducationPolicyEngine();
const result = engine.evaluate({
  subjectId: "stu-1",
  facts: {
    attendancePresentRate: 0.95,
    completedDocumentKinds: ["transcript", "identification"],
    requiredDocumentKinds: ["transcript", "identification"],
  },
  policyIds: [
    EDUCATION_POLICY_IDS.attendanceMinimumRate,
    EDUCATION_POLICY_IDS.enrollmentDocumentsRequired,
  ],
});

// result.satisfied / result.violated / result.unknown / result.traces
```

## Contributor adoption (later)

`EducationPolicyEvaluationPort` is the interface contributors may call in later phases. No contributor migration in D3.1.

## Docs

[`docs/domains/education/policy/00_OVERVIEW.md`](../../../../docs/domains/education/policy/00_OVERVIEW.md)
