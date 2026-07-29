# 02 — Policy Results

`EducationPolicyResult` aggregates one evaluation run.

## Outcomes

| Outcome | Meaning |
|---------|---------|
| `satisfied` | Facts meet policy parameters |
| `violated` | Facts fail policy parameters |
| `unknown` | Insufficient / missing evidence |

## Collections

- `satisfied` — `EducationPolicySatisfaction[]`  
- `violated` — `EducationPolicyViolation[]`  
- `unknown` — evaluation items with missing evidence  
- `evaluations` — full per-policy items  
- `traces` — flattened traces  
- `validationIssues` — unknown policies, duplicate ids, bad metadata, inconsistencies  

`ok` is `false` when validation reports any **error** severity issue.
