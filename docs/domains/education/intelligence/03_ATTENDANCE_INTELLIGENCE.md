# 03 — Attendance Intelligence

**Program D2.3 — Education Cognitive Contributor #2**  
**Package:** `src/lib/domains/education/cognition/attendance`  
**Contributor id:** `education.cognition.attendance`

---

## 1. Purpose

Second real Education cognitive contributor. Validates that the shared Intelligence Framework generalizes beyond Enrollment.

---

## 2. Observations

Host supplies `AttendanceObservation` via:

```ts
attributes["education.attendance"] = observation
```

| Field | Role |
|-------|------|
| Student | Subject |
| Enrollment | Optional enrollment link |
| Attendance history | Session outcomes |
| Scheduled sessions | Optional forward schedule |
| Program attendance requirements | Thresholds |
| Risk indicators | e.g. transportation |

**No database access.**

---

## 3. Evidence examples

| Code | Meaning |
|------|---------|
| `perfect_attendance` | No absences/tardies |
| `five_consecutive_absences` | Consecutive absence run |
| `attendance_below_threshold` | Rate under requirement |
| `improving_trend` / `declining_trend` / `stable_trend` | Window comparison |
| `repeated_monday_absences` / `repeated_friday_absences` | Weekday patterns |
| `excessive_tardies` | Tardy accumulation |
| `chronic_absenteeism` | Chronic risk |
| `recovery_pattern` | Recovery after low period |
| `excused_absence_cluster` / `unexcused_absence_cluster` | Absence clusters |

---

## 4. Recommendations

| Kind | Typical trigger |
|------|-----------------|
| Notify Family | Below threshold / unexcused cluster |
| Schedule Attendance Meeting | Chronic / consecutive risk |
| Recognize Perfect Attendance / Improvement | Perfect or improving/recovery |
| Recommend Intervention | Chronic / below threshold / consecutive |
| Continue Monitoring | Declining soft risk or healthy ready state |
| Escalate Support | Tardies / weekday patterns |
| Review Transportation | Flag or Mon+Fri pattern |

---

## 5. Action proposals (never executed)

| Proposal | Action id |
|----------|-----------|
| NotifyFamily | `education.attendance.notify_family` |
| ScheduleConference | `education.attendance.schedule_conference` |
| CreateIntervention | `education.attendance.create_intervention` |
| AssignAttendanceReview | `education.attendance.assign_review` |
| RecordRecognition | `education.attendance.record_recognition` |
| ReviewTransportation | `education.attendance.review_transportation` |

---

## 6. Framework integration

| Concern | Framework API |
|---------|---------------|
| Pipeline | `defineEducationCognitiveContributor` / `runEducationIntelligencePipeline` |
| Evidence | `EducationEvidenceBuilder` |
| Recommendations | `EducationRecommendationBuilder` |
| Confidence | `scoreReadinessConfidence` / `normalizeConfidence` |
| Priority | `normalizePriority` / `readinessPriorityRank` |
| Trace | `createEducationTrace` |
| Explanation | `formatEducationExplanation` |

Domain-only files: observation contracts, metrics (`AttendanceAnalyzer`), evidence codes, recommendation copy.

---

## 7. Comparison with Enrollment

| | Enrollment | Attendance |
|-|------------|------------|
| Infrastructure | Framework | **Same framework** |
| Builders / trace | Shared | **Shared** |
| Observation | `EnrollmentObservation` | `AttendanceObservation` |
| Reasoning | Docs/capacity/scholarship | Rates/trends/patterns |
| Action proposals | Enrollment actions | Attendance actions |
