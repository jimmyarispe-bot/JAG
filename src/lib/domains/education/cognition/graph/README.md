# Education Intelligence Graph

Coordinates independent Education cognitive contributors into one unified result.

## Role

- Represent contributors as **nodes**
- Represent influence as **edges** (no execution)
- Aggregate evidence, recommendations, confidence, priority, explanations, traces
- Resolve conflicts / duplicates
- Merge action **proposals** only

## Non-goals

- Does not modify contributors
- Does not call Runtime / Action execution
- Does not load databases
- Does not accept raw domain objects — **contributor results only**

## Usage

```ts
import {
  createEducationIntelligenceGraph,
  runEnrollmentIntelligence,
  runAttendanceIntelligence,
} from "@/lib/domains/education";

const graph = createEducationIntelligenceGraph();
const unified = graph.evaluateResults([
  {
    contributorId: "education.cognition.enrollment",
    result: runEnrollmentIntelligence(enrollmentObservation),
  },
  {
    contributorId: "education.cognition.attendance",
    result: runAttendanceIntelligence(attendanceObservation),
  },
]);
```

## Docs

[`docs/domains/education/intelligence/04_INTELLIGENCE_GRAPH.md`](../../../../../docs/domains/education/intelligence/04_INTELLIGENCE_GRAPH.md)
