# AcademyOS RC-3 — Deployment

## Purpose

Validate that AcademyOS can be installed and configured for a target environment without introducing new business modules.

## Installation

1. Ensure Platform / SDK `1.x` compatibility (`ACADEMYOS_EXTENSION_MANIFEST`).
2. Install the industry pack: `installAcademyOsIndustryPack({ organizationId })`.
3. Run deployment validation: `POST /api/academyos/operations/deployment`.
4. Confirm Studio release record `1.0.0-rc.3` via Studio governance.

## Required environment (production)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database / Auth / Storage host |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth client |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server operations |
| `RESEND_API_KEY` | Transactional email |

Development may omit secrets; validators emit warnings instead of blockers.

## Validation surface

`validateDeployment()` checks env, Supabase URL shape, auth, storage host assumptions, email, connector catalog, feature-flag docs, version compatibility, and this guide.

## Production checklist

- [ ] Secrets injected via host secret store (never committed)
- [ ] Deployment validation passed in production profile
- [ ] Health report is Healthy or Warning (no Critical)
- [ ] Studio RC-3 gates evaluated
- [ ] Demo organization seeded in non-prod only
