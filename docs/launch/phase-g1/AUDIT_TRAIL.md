# Audit Trail Policy

## Requirements
Immutable history of: approvals, checklist completion, evidence, reports, release notes, sign-offs, risk decisions, deployment history, rollback history.

## Implementation
- Runtime: append-only `AuditTrail` in `src/lib/certification/release-governance/audit-trail.ts`
- Events are `Object.freeze`d; no update/delete APIs
- Seed event created when the governance store initializes for AcademyOS 1.0

## Persistence
In-process for G.1 (not multi-instance durable).
**G.1.1 backlog:** persist to Supabase table `release_governance_audit_events` with insert-only RLS for `certification.admin`.

## Retention
Retain for life of the release train + 7 years or per legal policy.
