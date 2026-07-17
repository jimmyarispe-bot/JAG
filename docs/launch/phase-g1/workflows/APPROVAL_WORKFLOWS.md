# Approval Workflow Documentation

## Standard fields (mandatory)
Approver · Role · Date · Evidence Reviewed · Decision (`approved|rejected|conditional|deferred`) · Conditions · Comments · Digital Signature · Approval History (`previousApprovalId`)

## Forms
See code catalog `APPROVAL_FORMS` and package approval forms under `packages/*/APPROVAL_FORM.md`.

## Workflow
1. Owner completes checklist + attaches evidence
2. Approver reviews evidence
3. Record approval via governance store (`recordApproval`) — signature required
4. Audit event appended
5. Release manager verifies exit criteria before state transition

## Roles
Engineering Lead · QA Lead · Release Manager · Product · Ops · Security · Pilot Sponsor · UX · Architecture · Executive Sponsor
