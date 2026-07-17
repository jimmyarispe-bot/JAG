# Support Readiness — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Define support workflow, triage, escalation, SLAs |
| **Scope** | AcademyOS production support |
| **Audience** | Support, CS, eng on-call |
| **Prerequisites** | Access to ticketing system (org-provided); Phase F guides |
| **Version** | 1.0.0 |

---

## Support workflow

1. Intake (email/ticket/chat).  
2. Classify severity.  
3. Authenticate reporter; never accept “share password”.  
4. Triage (below).  
5. Resolve or escalate.  
6. Confirm with reporter; close with notes.

## Issue triage

| Check | Question |
|-------|----------|
| Auth | Can they login? Reset required? |
| Permission | Missing module? |
| Linkage | Parent-student / employee link? |
| School scope | Wrong school assignment? |
| Browser | Repro in clean session? |
| Regression | After deploy? |

## Bug reporting (to engineering)

Include: timestamp, URL, user id (not password), school, steps, expected/actual, screenshots, HAR if needed.  
No PII dumps in public channels.

## Feature requests

Log separately from bugs; product owner prioritizes. Support does not promise dates.

## Escalation paths

| Sev | Path |
|-----|------|
| SEV-1 | On-call eng + incident commander |
| SEV-2 | Eng lead within 30 min |
| SEV-3 | Ticket queue |
| Security | Security owner + `runbooks/11_INCIDENT_RESPONSE.md` |

## Severity definitions

See incident runbook SEV-1…4.

## Support SLAs (targets)

| Sev | First response | Update cadence |
|-----|----------------|----------------|
| SEV-1 | 15 min | 30 min |
| SEV-2 | 1 hour | 2 hours |
| SEV-3 | 1 business day | Daily |
| SEV-4 | 3 business days | As needed |

## Maintenance windows

- Prefer off-peak for migrations.  
- Announce 48h ahead when possible.  
- Emergency: incident process overrides.

## Troubleshooting

| Issue | Action |
|-------|--------|
| No ticketing tool | Use agreed spreadsheet/channel until integrated |
| Customer demands DB access | Refuse; escalate |

## Related documents

- `guides/training/SUPPORT_QUICKSTART.md`
- `runbooks/11_INCIDENT_RESPONSE.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
