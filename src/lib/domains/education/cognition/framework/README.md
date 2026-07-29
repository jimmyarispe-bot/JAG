# Education Intelligence Framework

Shared cognitive infrastructure for Education domain contributors.

Enrollment, Attendance, Progress, Scheduling, Intervention, Scholarship, Compliance, and future contributors share:

- Observation extraction
- Evidence builder
- Recommendation builder
- Confidence / priority utilities
- Constitutional trace
- Explanation formatter
- Contributor pipeline

## Lifecycle

```text
Observe → Validate → Collect Evidence → Score Readiness
  → Generate Recommendations → Explanations → Action Proposals → Result
```

## Authoring a contributor

```ts
defineEducationCognitiveContributor({
  contributorId: "education.cognition.example",
  evidenceSource: "education.example",
  topicId: "education.example",
  attributeKey: "education.example",
  subjectId: (o) => o.id,
  validate: (o) => { /* throw if invalid */ },
  collectEvidence: (builder, o) => {
    builder.addBlockingIssue("code", "summary");
  },
  recommend: (builder, ctx) => {
    builder
      .recommend("kind", "Title")
      .because("Why")
      .confidence(0.9)
      .priority("high")
      .supportedBy("code")
      .proposeAction({ kind: "X", actionId: "education.x", rationale: "…" });
  },
});
```

See `docs/domains/education/intelligence/02_INTELLIGENCE_FRAMEWORK.md`.
