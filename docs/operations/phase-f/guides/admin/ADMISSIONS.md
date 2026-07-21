# Administrator Guide — Admissions

| Field | Value |
|-------|-------|
| **Purpose** | Run admissions CRM and application review |
| **Scope** | `/dashboard/admissions`, related exports |
| **Audience** | Admissions staff |
| **Prerequisites** | `admissions.*` permissions |
| **Version** | 1.0.0 |

## Procedures

### Configuration
- Templates/workflows via configuration studio (if permitted).  
- Public inquiry form: `/apply`.

### Daily operations
1. Open `/dashboard/admissions` — work tabs (leads/cases).  
2. Create/update leads; advance cases.  
3. Review guardian applications under `/apply/portal` context as needed.  
4. Funding export: `/api/admissions/funding-export` (authorized).  
5. Communications processor may run via API/cron — do not duplicate spam.

### Best practices
- Verify school scope before merges.  
- Treat inquiry PII as sensitive (public RPC abuse risk — Phase B).  
- Prefer clear status transitions over notes-only updates.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Lead not visible | School/permission scope |
| Email not sending | Resend env (`RESEND_API_KEY` / from domain) — escalate IT |
| Portal user stuck | Auth + application linkage |

## Related documents

- `../../03_API_DOCUMENTATION.md`
- User parent guide (apply flow)

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
