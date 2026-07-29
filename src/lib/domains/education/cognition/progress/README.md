# Academic Progress Intelligence

Third Education cognitive contributor (D4.0).

Uses:

- Shared Education cognitive framework  
- Knowledge Model (entities / relationships / classifications / capability)  
- Policy Engine via `EducationPolicyEvaluationPort`  

Does **not** execute actions, access databases, or embed policy rules.

## Usage

```ts
import { runAcademicProgressIntelligence } from "@/lib/domains/education";

const result = runAcademicProgressIntelligence({
  organizationId: "org-edu",
  student: { studentId: "stu-1" },
  goals: [{ goalId: "g1", currentMastery: 0.7, targetMastery: 0.7 }],
  courses: [{ courseId: "c1", progressRatio: 0.5, expectedProgressRatio: 0.5 }],
  earnedCredits: 24,
});
```

## Docs

[`docs/domains/education/intelligence/08_ACADEMIC_PROGRESS_INTELLIGENCE.md`](../../../../../docs/domains/education/intelligence/08_ACADEMIC_PROGRESS_INTELLIGENCE.md)
