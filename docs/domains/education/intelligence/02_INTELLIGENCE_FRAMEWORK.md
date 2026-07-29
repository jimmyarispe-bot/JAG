# 02 — Education Intelligence Framework

**Program D2.2 / shared infrastructure for D2.3+**  
**Package:** `src/lib/domains/education/cognition/framework`

---

## 1. Purpose

Reusable cognitive infrastructure so every Education intelligence contributor (Enrollment, Attendance, Progress, …) shares:

| Shared | Domain-specific |
|--------|-----------------|
| Lifecycle pipeline | Observation contracts |
| Evidence builder | Evidence codes / thresholds |
| Recommendation builder | Recommendation kinds |
| Confidence / priority | Scoring weights (optional) |
| Trace + explanation | Narrative copy |
| Runtime contributor adapter | `supports` predicates |

---

## 2. Lifecycle

```text
Observe → Validate → Collect Evidence → Score Readiness
  → Recommend → Explain → Action Proposals → Result
```

Implemented by `runEducationIntelligencePipeline` / `defineEducationCognitiveContributor`.

---

## 3. Extension points

Define an `EducationPipelineDefinition<TObservation>`:

| Hook | Role |
|------|------|
| `validate` | Fail fast on incomplete contracts |
| `collectEvidence` | Use `EducationEvidenceBuilder` |
| `recommend` | Use `EducationRecommendationBuilder` |
| `explainReadiness` | Optional overall explanation |
| `subjectId` | Result subject key |
| `attributeKey` | Where hosts embed the observation |

---

## 4. Shared builders

### Evidence

`addFinding` · `addWarning` · `addBlockingIssue` · `addSupportingEvidence` · `build`

### Recommendations

`recommend` · `confidence` · `priority` · `because` · `supportedBy` · `proposeAction` · `build`

### Trace

`createEducationTrace` → Laws 1, 3, 7 + contributor id + rationale

### Explanation

`formatEducationExplanation` → Reason · Evidence · Confidence · Priority · Suggested Action

---

## 5. Authoring guidelines

1. Put domain reasoning in `*Analyzer` / `*Evidence` / `*Recommendations`.  
2. Do **not** copy Enrollment builder code — import framework.  
3. Never execute Action Runtime.  
4. Never query databases — contracts only.  
5. Register via Education Domain Builder + Domain SDK.

---

## 6. Validation (Enrollment vs Attendance)

Both contributors must:

- Share framework modules under `cognition/framework/`  
- Share builder / trace / recommendation pipeline  
- Differ **only** in domain observation + reasoning hooks  
