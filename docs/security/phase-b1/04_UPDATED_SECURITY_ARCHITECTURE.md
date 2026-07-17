# Updated Security Architecture — B.1

| Field | Value |
|-------|-------|
| **Purpose** | Delta to security architecture after remediation |
| **Version** | 1.0.0 |

## Authorization

- Central engine unchanged (`authorization-service`).  
- New: `tenant-access.ts` for org/school IDOR binding.  
- New: `mfa-enforce.ts` on privileged dashboard routes.  

## Data plane

- Migration `172` complements `171`.  
- Finance: `can_access_finance_school`.  
- Views: invoker RLS.  
- Notes/relationships: org membership.  

## Edge / app

- Security headers in Next config.  
- Rate limit: Upstash → RPC → memory.  
- Anon vs service-role clients explicit.  

## Canonical docs

- `docs/architecture/SECURITY_MODEL.md` (principles)  
- `docs/security/phase-b/` (audit baseline)  
- This folder (remediation)

## ADR

See `docs/architecture/adr/ADR-B1-001-security-remediation.md`.
