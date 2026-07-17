import fs from "fs";
import path from "path";

const root = "docs/launch/phase-g1";
const w = (rel, body) => {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body.trim() + "\n", "utf8");
  console.log("wrote", rel);
};

w(
  "AUDIT_TRAIL.md",
  `# Audit Trail Policy

## Requirements
Immutable history of: approvals, checklist completion, evidence, reports, release notes, sign-offs, risk decisions, deployment history, rollback history.

## Implementation
- Runtime: append-only \`AuditTrail\` in \`src/lib/certification/release-governance/audit-trail.ts\`
- Events are \`Object.freeze\`d; no update/delete APIs
- Seed event created when the governance store initializes for AcademyOS 1.0

## Persistence
In-process for G.1 (not multi-instance durable).
**G.1.1 backlog:** persist to Supabase table \`release_governance_audit_events\` with insert-only RLS for \`certification.admin\`.

## Retention
Retain for life of the release train + 7 years or per legal policy.
`
);

w(
  "RISK_REGISTER.md",
  `# Risk Register (Governance Template)

| Risk ID | Title | Likelihood | Impact | Severity | Mitigation | Residual | Status | Owner |
|---------|-------|------------|--------|----------|------------|----------|--------|-------|
| R-MT-01 | Cross-tenant leakage undetected | Med | Critical | Critical | Live RLS soak | High | Open | Security |
| R-E2E-01 | Authenticated E2E missing | High | High | Critical | Playwright journeys | High | Open | QA |
| R-SCALE-01 | Unbounded list loaders | High | High | High | Pagination + load test | High | Open | Eng |
| R-DR-01 | Untested restore | Med | Critical | High | Restore drill | High | Open | Ops |
| R-OBS-01 | Late incident detection | High | Med | High | APM + alerts | Med | Open | Ops |

Update during each RC; freeze a copy into Phase G artifacts at RC4.
`
);

w(
  "DECISION_MATRIX.md",
  `# Decision Matrix — Go / No-Go

Generated at runtime by \`buildGoNoGoDecisionMatrix()\`. Manual mirror:

| Criterion | Required | Pass rule |
|-----------|----------|-----------|
| RC1 signed | Approved | Approval form \`rc1_sign_off\` = approved |
| RC2 signed | Approved | \`rc2_sign_off\` |
| RC3 signed | Approved | \`rc3_sign_off\` |
| RC3.5 dress rehearsal | Approved | \`dress_rehearsal_approval\` |
| Critical defects | Zero | defectCounts.critical === 0 |
| Production readiness % | ≥ 85 | Score from readiness assessment |
| Checklist completion | ≥ 95% | Required items complete/waived/na |

**All rows must Pass for GO.** Any Fail ⇒ NO-GO.
`
);

w(
  "PRODUCTION_READINESS_ASSESSMENT.md",
  `# Production Readiness Assessment — G.1 Framework

| Field | Value |
|-------|-------|
| **Release** | AcademyOS 1.0.0 |
| **Assessment date** | 2026-07-17 |
| **Framework readiness** | **COMPLETE** (governance process) |
| **Product GA readiness** | **52% / NO-GO** (from Phase G seed) |

## Framework completion (G.1 quality gates)

| Gate | Status |
|------|--------|
| Every checklist defined | ✓ |
| Every approval workflow documented | ✓ |
| Release artifact templates generated | ✓ |
| Governance documentation complete | ✓ |
| Executive certification package complete | ✓ |
| Audit trail implemented | ✓ (append-only runtime) |
| Production readiness assessment completed | ✓ (this document) |
| Release Dashboard shipped | ✓ \`/dashboard/certification/governance\` |

## Product readiness (inherited)

See \`docs/launch/phase-g/CERTIFICATION_PACKAGE.md\` — RC4 NO-GO until Critical blockers close.
`
);

w(
  "workflows/APPROVAL_WORKFLOWS.md",
  `# Approval Workflow Documentation

## Standard fields (mandatory)
Approver · Role · Date · Evidence Reviewed · Decision (\`approved|rejected|conditional|deferred\`) · Conditions · Comments · Digital Signature · Approval History (\`previousApprovalId\`)

## Forms
See code catalog \`APPROVAL_FORMS\` and package approval forms under \`packages/*/APPROVAL_FORM.md\`.

## Workflow
1. Owner completes checklist + attaches evidence
2. Approver reviews evidence
3. Record approval via governance store (\`recordApproval\`) — signature required
4. Audit event appended
5. Release manager verifies exit criteria before state transition

## Roles
Engineering Lead · QA Lead · Release Manager · Product · Ops · Security · Pilot Sponsor · UX · Architecture · Executive Sponsor
`
);

const packageReadmes = {
  "packages/engineering/README.md": `# Engineering Certification Package (RC1)

Contents listed in this folder. Runtime checklist id: \`rc1_engineering\`.
`,
  "packages/operations/README.md": `# Operations / Product Certification Package (RC2)

Runtime checklist id: \`rc2_operations\`. See \`../../checklists/\` for printable checklists.
`,
  "packages/pilot/README.md": `# Pilot Certification Package (RC3)

Runtime checklist id: \`rc3_pilot\`.
`,
  "packages/dress-rehearsal/README.md": `# RC3.5 Production Dress Rehearsal Package

Runtime checklist id: \`rc3_5_dress\`.
`,
  "packages/executive/README.md": `# Executive Certification Package (RC4)

Runtime checklist id: \`rc4_executive\`. Dashboard: \`/dashboard/certification/governance\`.
`,
};
for (const [rel, body] of Object.entries(packageReadmes)) w(rel, body);

const engCerts = [
  ["ARCHITECTURE_CERTIFICATION.md", "Architecture", "architecture report / ADR index"],
  ["SECURITY_CERTIFICATION.md", "Security", "RLS soak, dependency scan, secrets review"],
  ["PERFORMANCE_CERTIFICATION.md", "Performance", "load/stress results or signed waiver"],
  ["TESTING_CERTIFICATION.md", "Testing", "unit, integration, E2E, coverage"],
  ["CODE_QUALITY_CERTIFICATION.md", "Code Quality", "typecheck + lint errors zero"],
  ["DATABASE_CERTIFICATION.md", "Database", "schema + RLS review"],
  ["MIGRATION_CERTIFICATION.md", "Migration", "apply evidence for required migrations"],
  ["DEPLOYMENT_CERTIFICATION.md", "Deployment", "staging deploy + smoke"],
  ["ROLLBACK_CERTIFICATION.md", "Rollback", "rollback rehearsal log"],
  ["CICD_CERTIFICATION.md", "CI/CD", "GitHub Actions green on release SHA"],
];
for (const [file, title, evidence] of engCerts) {
  w(
    `packages/engineering/${file}`,
    `# ${title} Certification

| Field | Value |
|-------|-------|
| **Release** | {{release_version}} |
| **Status** | pending / pass / fail / conditional |
| **Approver** | |
| **Date** | |
| **Evidence** | ${evidence} |
| **Decision** | |
| **Conditions** | |
| **Signature** | |

## Findings
_List findings and residual risk._
`
  );
}

w(
  "packages/engineering/ENGINEERING_SIGN_OFF_CHECKLIST.md",
  `# Engineering Sign-Off Checklist

Mirror of runtime \`rc1_engineering\`.

- [ ] Architecture certification
- [ ] Security certification
- [ ] Performance certification
- [ ] Testing certification (incl. authenticated E2E)
- [ ] Code quality (tsc + lint errors)
- [ ] Database certification
- [ ] Migration certification
- [ ] Deployment certification (staging)
- [ ] Rollback certification
- [ ] CI/CD certification
- [ ] Coverage report
- [ ] Build validation
- [ ] Multi-tenant validation
- [ ] Accessibility regression
`
);

w(
  "packages/engineering/APPROVAL_FORM.md",
  `# Engineering Approval Form

| Field | Value |
|-------|-------|
| Approver | |
| Role | Engineering Lead |
| Date | |
| Evidence Reviewed | |
| Decision | approved / rejected / conditional / deferred |
| Conditions | |
| Comments | |
| Digital Signature | |
| Previous Approval ID | |

Form id: \`engineering_approval\`
`
);

w(
  "packages/engineering/ENGINEERING_READINESS_REPORT.md",
  `# Engineering Readiness Report

**Release:** {{release_version}}  
**Date:** {{date}}  
**Author:** {{author}}

## Summary
_Ready / Not ready for RC1 sign-off_

## Evidence table
| Gate | Result | Link |
|------|--------|------|
| TypeScript | | |
| Lint | | |
| Unit tests | | |
| Integration tests | | |
| E2E tests | | |
| Coverage | | |
| Build | | |
| Staging deploy | | |
| Rollback | | |

## Blockers
## Recommendation
_Sign / Do not sign RC1_
`
);

const checklists = [
  ["OPERATIONS_CHECKLIST.md", "Operations", "rc2"],
  ["PRODUCT_CHECKLIST.md", "Product", "rc2"],
  ["WORKFLOW_CHECKLIST.md", "Workflow", "rc2"],
  ["DOCUMENTATION_CHECKLIST.md", "Documentation", "rc2"],
  ["SUPPORT_READINESS_CHECKLIST.md", "Support Readiness", "rc2"],
  ["TRAINING_READINESS_CHECKLIST.md", "Training Readiness", "rc2"],
  ["DEPLOYMENT_CHECKLIST.md", "Deployment", "rc3_5"],
  ["ROLLBACK_CHECKLIST.md", "Rollback", "rc3_5"],
  ["RECOVERY_CHECKLIST.md", "Recovery", "rc3_5"],
  ["PRODUCTION_READINESS_CHECKLIST.md", "Production Readiness", "rc3_5"],
  ["EXECUTIVE_CHECKLIST.md", "Executive", "rc4"],
];
for (const [file, title, phase] of checklists) {
  w(
    `checklists/${file}`,
    `# ${title} Checklist

**Phase:** ${phase}  
**Release:** {{release_version}}

| # | Item | Status | Evidence | Owner | Notes |
|---|------|--------|----------|-------|-------|
| 1 | | pending | | | |
| 2 | | pending | | | |
| 3 | | pending | | | |

Sign-off: Name ____ Role ____ Date ____ Signature ____
`
  );
}

w(
  "packages/operations/BUSINESS_VALIDATION_REPORT.md",
  `# Business Validation Report (RC2)

**Release:** {{release_version}}  
**Date:** {{date}}

## Participants
| Role | Name | Sessions |
|------|------|----------|

## Findings
| ID | Severity | Workflow | Description | Ticket |
|----|----------|----------|-------------|--------|

## Recommendation
_Sign / Do not sign RC2_
`
);

w(
  "packages/operations/APPROVAL_FORM.md",
  `# Operations / Product Approval Forms

Form ids: \`operations_approval\`, \`product_approval\`, \`rc2_sign_off\`.

| Field | Value |
|-------|-------|
| Approver | |
| Role | |
| Date | |
| Evidence Reviewed | |
| Decision | |
| Conditions | |
| Comments | |
| Digital Signature | |
| Previous Approval ID | |
`
);

w("packages/pilot/PILOT_SUCCESS_CRITERIA.md", `# Pilot Success Criteria

- Error rate within agreed SLO
- No Critical security incidents
- Support ticket volume within capacity
- Core workflows completed by each pilot role
- Satisfaction score ≥ agreed threshold
- Performance p95 within budget
`);

w("packages/pilot/PILOT_EXIT_CRITERIA.md", `# Pilot Exit Criteria

- Success criteria met or residual risk accepted
- Final pilot report published
- Open Critical pilot defects = 0
- Pilot approval form signed
- Ready for RC3.5 dress rehearsal
`);

w(
  "packages/pilot/PILOT_EVALUATION_FORM.md",
  `# Pilot Evaluation Form

| Field | Value |
|-------|-------|
| School / Org | |
| Role | teacher / parent / student / admin |
| Week | |
| Satisfaction (1-5) | |
| Bugs found | |
| Training issues | |
| Feature requests | |
| Comments | |
`
);

w(
  "packages/pilot/WEEKLY_PILOT_REPORT.md",
  `# Weekly Pilot Report

**Week of:** {{date}}  
**Release:** {{release_version}}

## Metrics
| Metric | Value |
|--------|-------|
| Active users | |
| Error rate | |
| p95 latency | |
| Tickets opened | |
| Critical bugs | |

## Narrative
`
);

w(
  "packages/pilot/FINAL_PILOT_REPORT.md",
  `# Final Pilot Report

**Release:** {{release_version}}  
**Pilot window:** {{start}} – {{end}}

## Executive summary
## Metrics
## Feedback themes
## Defects
## Recommendation for RC3.5 / RC4
`
);

w(
  "packages/pilot/APPROVAL_FORM.md",
  `# Pilot Approval Form

Form id: \`pilot_approval\` / \`rc3_sign_off\`

| Field | Value |
|-------|-------|
| Approver | |
| Role | |
| Date | |
| Evidence Reviewed | |
| Decision | |
| Conditions | |
| Comments | |
| Digital Signature | |
`
);

w(
  "packages/dress-rehearsal/DRESS_REHEARSAL_REPORT.md",
  `# Dress Rehearsal Report (RC3.5)

**Date:** {{date}}  
**Environment:** {{env}}

| Drill | Result | Evidence | Notes |
|-------|--------|----------|-------|
| Deploy | | | |
| Migrate | | | |
| Backup | | | |
| Restore | | | |
| Monitor | | | |
| Alert | | | |
| Rollback | | | |
| DR | | | |
| Smoke | | | |
| Ops validation | | | |

**Recommendation:** Approve / Reject dress rehearsal
`
);

w(
  "packages/dress-rehearsal/APPROVAL_FORM.md",
  `# Dress Rehearsal Approval Form

Form id: \`dress_rehearsal_approval\`

| Field | Value |
|-------|-------|
| Approver | |
| Role | |
| Date | |
| Evidence Reviewed | |
| Decision | |
| Conditions | |
| Comments | |
| Digital Signature | |
`
);

w(
  "packages/executive/GO_NO_GO_FORM.md",
  `# Go / No-Go Form

Form id: \`go_no_go\`

| Field | Value |
|-------|-------|
| Approver | |
| Role | Executive Sponsor / Release Manager |
| Date | |
| Evidence Reviewed | Decision matrix, risk register, known issues, pilot results |
| Decision | GO / NO-GO |
| Conditions | |
| Comments | |
| Digital Signature | |
`
);

w(
  "packages/executive/APPROVAL_FORM.md",
  `# Executive Approval Form

Form id: \`executive_approval\`

| Field | Value |
|-------|-------|
| Approver | |
| Role | |
| Date | |
| Evidence Reviewed | |
| Decision | |
| Conditions | |
| Comments | |
| Digital Signature | |
| Previous Approval ID | |
`
);

w(
  "packages/executive/FINAL_CERTIFICATION_REPORT.md",
  `# Final Certification Report (RC4)

**Release:** {{release_version}}  
**Decision:** GO / NO-GO  
**Readiness %:** {{pct}}

## Domain status
## Pilot results
## Outstanding risks
## Known issues
## Release notes status
## Approvals attached
## Executive summary
`
);

const templates = [
  ["RELEASE_NOTES.md", "Release Notes"],
  ["KNOWN_ISSUES.md", "Known Issues"],
  ["DEPLOYMENT_GUIDE.md", "Deployment Guide"],
  ["ROLLBACK_GUIDE.md", "Rollback Guide"],
  ["UPGRADE_GUIDE.md", "Upgrade Guide"],
  ["MIGRATION_GUIDE.md", "Migration Guide"],
  ["SUPPORT_HANDOFF.md", "Support Handoff"],
  ["OPERATIONS_HANDOFF.md", "Operations Handoff"],
  ["ENGINEERING_HANDOFF.md", "Engineering Handoff"],
  ["RELEASE_TIMELINE.md", "Release Timeline"],
  ["RELEASE_CALENDAR.md", "Release Calendar"],
];
for (const [file, title] of templates) {
  w(
    `templates/${file}`,
    `# ${title} — Template

**Release:** {{release_version}}  
**Date:** {{date}}  
**Owner:** {{owner}}

## Content
_Fill for each release. For AcademyOS 1.0 RC, prefer populated copies under \`docs/launch/phase-g/artifacts/\` when available._

## Approval
Name ____ Role ____ Date ____ Signature ____
`
  );
}

console.log("done");
