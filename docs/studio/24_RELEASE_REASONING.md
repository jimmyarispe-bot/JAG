# Release Reasoning (RC-3)

JS-005 — AcademyOS (and other products) release readiness computed from:

1. **Studio Governance gates** — `evaluateReleaseGates({ targetStage })`
2. **Policy engine** — `evaluatePolicies({ productId })`
3. **Certification record** — outstanding blockers
4. **Knowledge Graph** — untested services, undocumented APIs, orphan PERs

No hard-coded RC-3 checklist outside those engines.

## Process

```
buildKnowledgeGraph()
  → evaluateReleaseGates(product, RC-3)
  → evaluatePolicies(product)
  → ensureCertificationRecord(product)
  → buildKnowledgeCoverage()
  → merge blockers + readinessScore
```

## Score (transparent)

```
readinessScore ≈
  (gates.passed ? 40 : 15)
  + (policies.passedRequired ? 25 : compliance% × 0.2)
  + max(0, 20 − untestedServices)
  + max(0, 15 − undocumentedApis × 0.5)
```

## API

`GET /api/studio/knowledge/release-readiness?productId=academyos&targetStage=RC-3`
