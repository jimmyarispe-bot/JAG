# AcademyOS Release Phase G.1 — Release Governance & Approval Framework

**Date:** 2026-07-17  
**Rule:** No end-user product features. Governance, certifications, approvals, evidence, and audit only.

| Deliverable | Path |
|-------------|------|
| **Release Governance Manual** | [00_RELEASE_GOVERNANCE_MANUAL.md](./00_RELEASE_GOVERNANCE_MANUAL.md) |
| Engineering Certification Package | [packages/engineering/](./packages/engineering/) |
| Operations Certification Package | [packages/operations/](./packages/operations/) |
| Pilot Certification Package | [packages/pilot/](./packages/pilot/) |
| Executive Certification Package | [packages/executive/](./packages/executive/) |
| Dress Rehearsal (RC3.5) Package | [packages/dress-rehearsal/](./packages/dress-rehearsal/) |
| Approval Workflow Documentation | [workflows/APPROVAL_WORKFLOWS.md](./workflows/APPROVAL_WORKFLOWS.md) |
| Release Checklists | [checklists/](./checklists/) |
| Release Document Templates | [templates/](./templates/) |
| Risk Register | [RISK_REGISTER.md](./RISK_REGISTER.md) |
| Decision Matrix | [DECISION_MATRIX.md](./DECISION_MATRIX.md) |
| Production Readiness Assessment | [PRODUCTION_READINESS_ASSESSMENT.md](./PRODUCTION_READINESS_ASSESSMENT.md) |
| Audit Trail Policy | [AUDIT_TRAIL.md](./AUDIT_TRAIL.md) |

## Runtime (internal)

| Surface | Location |
|---------|----------|
| Release Governance Dashboard | `/dashboard/certification/governance` |
| Framework library | `src/lib/certification/release-governance/` |
| Unit tests | `tests/unit/certification/release-governance.test.ts` |

Permission: `certification.view` / `manage` / `admin` (Certification Center).

## Relationship to Phase G / H

- Phase G RC evidence: `docs/launch/phase-g/`  
- Phase H GA decision: `docs/launch/phase-h/` (NO-GO until G succeeds)  
- G.1 standardizes **how** RC1–RC4 and GA are governed for **this and future** releases.
