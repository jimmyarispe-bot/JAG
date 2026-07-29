# Attendance Intelligence

Second Education **Cognitive Contributor**, built entirely on the shared Intelligence Framework.

## Role

- Observe normalized `AttendanceObservation`
- Publish evidence (trends, chronic risk, patterns)
- Recommend interventions / monitoring / recognition
- Emit Action **proposals only**

## Framework usage

Uses `defineEducationCognitiveContributor`, `EducationEvidenceBuilder`, `EducationRecommendationBuilder`, confidence/priority/trace/explanation utilities — no duplicated Enrollment infrastructure.

## Host input

```ts
attributes: {
  "education.attendance": observation,
}
```

## Docs

[`docs/domains/education/intelligence/03_ATTENDANCE_INTELLIGENCE.md`](../../../../../docs/domains/education/intelligence/03_ATTENDANCE_INTELLIGENCE.md)
