# Studio Product Governance

JS-003 — Release intelligence and engineering governance for every product on the platform.

## Responsibilities

Studio is where release decisions are made from evidence:

- Repository architecture & dependencies
- Tests and quality scores
- Documentation coverage
- PERs and known issues
- Validation / hardening artifacts
- Policy compliance and approvals

Studio **consumes** Platform Foundation, AcademyOS, and SDK — it does not redefine them.

## Executive dashboard

`buildGovernanceDashboard()` / `GET /api/studio/governance` surfaces:

| View | Meaning |
|------|---------|
| Products awaiting approval | Next role in Engineering → … → Release |
| Blocked releases | Gate blockers or rejected approvals |
| Certification progress | Stage, version, blockers, signed artifacts |
| Policy compliance | Per-product compliance % |
| Quality trends | Overall quality scores |
| Open critical issues | Required gate failures |

## Lifecycle

See [14_CERTIFICATION.md](./14_CERTIFICATION.md) and [15_RELEASES.md](./15_RELEASES.md).

## PERs

Foundation gaps discovered during governance are recorded as Studio PERs (e.g. durable certification store, UI shell).
