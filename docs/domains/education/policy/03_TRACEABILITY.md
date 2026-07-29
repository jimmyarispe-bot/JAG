# 03 — Policy Traceability

Every policy evaluation includes an `EducationPolicyTrace`:

| Field | Purpose |
|-------|---------|
| `policyId` | Stable Knowledge policy id |
| `outcome` | satisfied / violated / unknown |
| `explanation` | Human-readable rationale |
| `supportingEvidence` | Evidence refs used in the decision |
| `missingEvidence` | Fact / parameter keys that were required but absent |
| `appliedParameters` | Parameter values from metadata examples + overrides |
| `evaluatedAt` | Timestamp |

Evidence refs are diagnostic tokens (`policy.evidence.<policyId>.<source>`), not Runtime Cognitive evidence objects.

Contributors may consume traces in later phases without changing this engine.
