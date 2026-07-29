# Student Success Intelligence (Synthesis)

First **synthesis** Education cognitive contributor (D4.1).

Consumes upstream **contributor results** (Enrollment, Attendance, Academic Progress) — does **not** re-implement their reasoning or require raw observations.

## Usage

```ts
import {
  buildStudentSuccessInputs,
  runStudentSuccessIntelligence,
} from "@/lib/domains/education";

const inputs = buildStudentSuccessInputs({
  subjectId: "stu-1",
  upstream: [
    { contributorId: "education.cognition.enrollment", result: enrollmentResult },
    { contributorId: "education.cognition.attendance", result: attendanceResult },
    { contributorId: "education.cognition.progress", result: progressResult },
  ],
});

const synthesis = runStudentSuccessIntelligence(inputs);
// synthesis.trajectory — healthy | outstanding | high_academic_risk | …
```

## Planner

Selected for cross-domain synthesis intents (Student Success Review, Quarterly Review, Advisor Briefing, Leadership Brief). Depends on Enrollment → Attendance → Progress.

## Docs

[`docs/domains/education/intelligence/09_STUDENT_SUCCESS_INTELLIGENCE.md`](../../../../../docs/domains/education/intelligence/09_STUDENT_SUCCESS_INTELLIGENCE.md)
