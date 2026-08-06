# PHASE 35 — Production preflight (Stage A)

**Mode:** read-only until Stage A GO  
**Write executed:** NO  
**Linked ref:** `ybcpaffklggaloxhnqkl` (The JAG, us-east-2, ACTIVE_HEALTHY)  
**TARGET_IS_PRODUCTION:** YES  
**Captured at:** 2026-08-06 (agent session)

## Git

| Item | Value |
| --- | --- |
| Branch | `release/ga-certification` |
| HEAD | `cb347818fbf3388d7056d4cca63c2566dec6fdf7` |
| Phase 34 commits | `167c942c`, `cb347818` present |
| Working tree | `M supabase/.temp/cli-latest` only (CLI cache); no unexpected source edits at capture time |

## Immutability

| Check | Result |
| --- | --- |
| `158` blob | `540b99a23210795f6b6eba9bfd472f39a7997746` |
| Applied migration blobs vs `migration-source-blobs.json` (versions ≤200) | CHECKED=199, MISMATCHES=0 |
| `APPLIED_MIGRATION_IMMUTABILITY` | PASS |

## Certified source match (GA_BASELINE_212)

| File | Local `git hash-object` | Manifest / evidence blob | Match |
| --- | --- | --- | --- |
| `211_organization_branding.sql` | `e9dc14b142d1625f32c0a2cd64115dd1826c8b83` | `e9dc14b142d1625f32c0a2cd64115dd1826c8b83` | YES |
| `212_jag_org_scoped_authorization.sql` | `ad832ad3381a711cbb9aff07b1b159f7e78d61d8` | `ad832ad3381a711cbb9aff07b1b159f7e78d61d8` | YES |

## Migration history (production)

| Item | Value |
| --- | --- |
| Remote count | 199 |
| Highest | 200 |
| Local-only pending | `211`, `212` only |
| Dry-run command | `supabase db push --linked --dry-run` |
| Dry-run exit | 0 |
| Dry-run would push | exactly `211_organization_branding.sql`, `212_jag_org_scoped_authorization.sql` |

## Preconditions (sanitized)

| Prerequisite | Result |
| --- | --- |
| `org_organizations` | PASS (count=1) |
| `users` / `user_roles` / `roles` | PASS |
| `platform_permissions` / `platform_role_permissions` | PASS |
| `user_organization_memberships` | PASS |
| `platform_applications` | PASS (`academyos` active) |
| FOUNDER role | PASS (1 assigned user) |
| `JAG_ACCESS` permission key | PASS (present; 0 role grants in `platform_role_permissions` today) |
| `can_access_organization` / `is_organization_admin` | PASS |
| `organization_branding` absent (pre-211) | PASS |
| `PLATFORM_OWNER` / `JAG_PLATFORM_ADMIN` absent (pre-212) | PASS |
| `users_select_access` policy exists | PASS |
| `is_enterprise_admin()` exists | PASS (currently FOUNDER \| CEO \| EXECUTIVE_DIRECTOR) |
| `is_platform_steward` absent (pre-212) | PASS |

Role catalog (present): ACCOUNTING, ADMINISTRATOR, ADMISSIONS, AUDITOR, BOARD_MEMBER, CEO, EMPLOYEE, EXECUTIVE_DIRECTOR, FINANCE, FOUNDER, GUEST, HR, PARENT, REGIONAL_DIRECTOR, REGISTRAR, SCHOLARSHIP_MANAGER, SCHOOL_LEADER, STATE_FUNDING_MANAGER, STUDENT, SUPPORT_STAFF, TEACHER, TEAM_MEMBER, THERAPIST.

Assigned among sampled roles: FOUNDER=1, EXECUTIVE_DIRECTOR=1 (no CEO/ADMINISTRATOR/SCHOOL_LEADER/TEACHER/PARENT/STUDENT/EMPLOYEE/FINANCE rows in that sample query).

## Static risk

| Migration | Risk | Notes |
| --- | --- | --- |
| 211 | MODERATE | New table + RLS; policies include intentional `or true` authenticated bootstrap for branding read/manage |
| 212 | MODERATE | Catalog + helpers + `users_select_access` rewrite; narrows global `is_enterprise_admin()` to platform steward; no auto role assignment to ordinary users; no finance permission keys in new grants |

## Authorization / finance (pre-write assessment)

- Ordinary AcademyOS users do not receive JAG roles/permissions from 212 (catalog + helpers only; no mass `user_roles` inserts).
- `JAG_ORG_ADMIN` catalog grants exclude `JAG_ACCESS` / `JAG_PLATFORM_ADMIN`.
- Intentional narrowing: `is_enterprise_admin()` loses CEO/ED global; ED user present will lose that helper path.
- Intentional narrowing: `users_select_access` moves from role/permission global select to steward + self + org co-members.
- `UNINTENDED_FINANCIAL_ACCESS_EXPANSION = NO` (211 branding-only; 212 grant lists contain no `finance.*` / `FINANCE_ACCESS` keys).

## Recovery readiness (verified CLI)

Command: `supabase backups list --project-ref ybcpaffklggaloxhnqkl`

```json
{"region":"us-east-2","walg_enabled":true,"pitr_enabled":false,"backups":[],"physical_backup_data":{},"message":""}
```

| Claim | Verified? |
| --- | --- |
| WAL-G enabled | YES (`walg_enabled: true`) |
| PITR enabled | NO (`pitr_enabled: false`) |
| Listed physical backups / recovery point | NO (`backups: []`, empty `physical_backup_data`) |

**RECOVERY_READINESS = FAIL** — cannot verify a latest restore point; PITR disabled.

## Local gates

| Gate | Command | Exit |
| --- | --- | --- |
| whitespace | `git diff --check` | 0 |
| TypeScript | `npx tsc --noEmit` | 0 |
| Tests | `npx vitest run` (greenfield, org-scoped auth, IAM, provisioning, release governance, GA certification, security b1, load-user-permissions) | 1 |

Test summary: 7 files passed, 1 failed (`tests/unit/identity/load-user-permissions.test.ts` — Next.js `cookies` outside request scope). 46 passed / 1 failed / 47 total in that run.

## Stage A decision

**STAGE_A_PRODUCTION_PREFLIGHT = FAIL**

Blocking conditions:

1. `RECOVERY_READINESS = FAIL`
2. Relevant test suite non-zero exit (`load-user-permissions`)

**Production write not authorized. Stage B not executed.**

## Transaction / failure analysis (for when Stage A later passes)

- Supabase `db push` applies each migration file as its own remote apply unit (not one atomic transaction across 211+212).
- 211 can succeed while 212 fails → production highest could become 211 with branding present and 212 auth changes absent.
- Default response to any partial failure: **STOP FOR DIAGNOSIS** (no repair, no retry, no manual SQL finish).
