# 01 — Policy Engine

## Components

| Module | Role |
|--------|------|
| `EducationPolicyRegistry` | Holds Knowledge policy definitions; validates ids/metadata |
| `EducationPolicyEvaluator` | Metadata-driven evaluation of a single policy |
| `EducationPolicyEngine` | Selects policies, runs evaluations, aggregates results |

## Inputs

- Policy definitions from `EDUCATION_POLICY_CATALOG` (or custom registry)  
- `EducationPolicyContext.facts` — normalized observations  
- Optional `parameterOverrides` and `policyIds`  

## Evaluated policy kinds (D3.1)

- Attendance thresholds (minimum rate, chronic absence)  
- Enrollment requirements (documents, capacity)  
- Scholarship eligibility  
- Graduation credit prerequisites  

Assessment / documentation completeness can be expressed via facts (`assessmentComplete`, `documentationComplete`) for generic enrollment-requirement policies.

## Port for later contributor adoption

```ts
interface EducationPolicyEvaluationPort {
  evaluate(input: { facts; policyIds?; … }): EducationPolicyResult;
}
```
