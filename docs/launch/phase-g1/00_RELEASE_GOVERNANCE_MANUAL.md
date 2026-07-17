# Release Governance Manual — AcademyOS

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Phase** | G.1 |
| **Audience** | Engineering, Ops, Product, Security, Executive, Release Manager |
| **Code** | `src/lib/certification/release-governance/` |

---

## 1. Purpose

Provide a **repeatable, auditable, standardized** release lifecycle for AcademyOS (and future major releases) covering RC1–RC4, RC3.5 dress rehearsal, and General Availability.

## 2. Release lifecycle & states

States (ordered): Development → Feature Complete → Architecture Approved → Security Approved → Performance Approved → UX Approved → Testing Certified → Documentation Complete → **RC1 → RC2 → RC3 → RC3.5 → RC4 → GA → Maintenance**.

Each state defines: entry criteria, exit criteria, required approver roles, required documents, evidence. See `lifecycle.ts` and the Release Governance Dashboard.

**Transitions** are linear. Skipping RC stages is not permitted without an executive waiver recorded in the audit trail and risk register.

## 3. Entry / exit criteria (summary)

| State | Entry (examples) | Exit (examples) |
|-------|------------------|-----------------|
| RC1 | Feature freeze, CI green | Engineering sign-off, Critical=0 |
| RC2 | RC1 signed | Business + ops sign-off |
| RC3 | RC2 signed, pilot roster | Pilot exit criteria |
| RC3.5 | RC3 signed | Dress rehearsal approval |
| RC4 | Prior RCs signed | Executive GO |
| GA | RC4 GO | Hypercare → Maintenance |

## 4. Required approvals

Catalog: `approvals.ts` / [workflows/APPROVAL_WORKFLOWS.md](./workflows/APPROVAL_WORKFLOWS.md).

Every approval record must include: Approver, Role, Date, Evidence Reviewed, Decision, Conditions, Comments, Digital Signature, Approval History (previousApprovalId).

## 5. Required documentation

Per state — engineering, operations, pilot, dress rehearsal, executive packages under `packages/`. Release artifact templates under `templates/`.

## 6. Evidence collection

Evidence references are stored on checklist items (`evidenceRef`) and approval `evidenceReviewed[]`. Prefer links to CI runs, report paths under `docs/launch/`, or ticket IDs.

## 7. Decision records

Go / No-Go uses the decision matrix (`buildGoNoGoDecisionMatrix` + [DECISION_MATRIX.md](./DECISION_MATRIX.md)). Outcomes are approval forms `go_no_go` and `executive_approval`.

## 8. Quality gates

Every RC validates domains: architecture, security, performance, accessibility, testing, documentation, operations, support, monitoring, DR, backups, restore, deployment, rollback — checklist `cross_quality_gates`.

## 9. Dashboard

Internal: `/dashboard/certification/governance`.

## 10. Audit trail

Append-only events — see [AUDIT_TRAIL.md](./AUDIT_TRAIL.md).

## 11. Change control during RC

Allowed: Critical/High fixes, security, performance, docs, deployment/release-process improvements — each with tests, gates, issue traceability.  
Forbidden: new business functionality.

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial G.1 framework |
