# Administrator Guide — IT / Platform Administrators

| Field | Value |
|-------|-------|
| **Purpose** | Configure tenants, users, permissions, integrations, environments |
| **Scope** | `/dashboard/admin`, config studio, cloud/ops (if applicable), Supabase/Vercel |
| **Audience** | IT admins, platform admins |
| **Prerequisites** | Platform admin permissions; secret store access for ops tasks |
| **Version** | 1.0.0 |

## Procedures

### Configuration
1. Organizations/schools: `/dashboard/admin/organizations`, configuration studio campuses.  
2. Users/roles/permissions: `/dashboard/admin/users`, `/roles`, `/permissions`.  
3. Feature flags / API keys: admin sections as permitted.  
4. Branding: `/dashboard/admin/branding`.  
5. Integrations: `/dashboard/integrations` + vault keys.  
6. Env vars: Vercel + `docs/launch/PRODUCTION_ENV.md`.

### Permissions
- Assign **permissions**, not informal role grants alone.  
- Founder surfaces require `JAG_ACCESS`.  
- Portal: `portal.parent.access` / `portal.student.access`.  
- Audit: `/dashboard/admin/audit`.

### Daily operations
- Review audit log for permission changes.  
- Confirm `/api/health` and `/api/ready`.  
- Monitor cron success.  
- Apply migrations only via change control (`04_DATABASE_DOCUMENTATION.md`).

### Best practices
- Least privilege.  
- Never put service role in client bundles.  
- Rotate secrets per runbook.  
- Keep Phase B / Phase D gaps on remediation backlog.

## Troubleshooting

| Issue | Action |
|-------|--------|
| User sees wrong modules | Permission groups / school membership |
| Ready 503 | Env missing |
| Migration failed | Restore path; eng pair |
| Connector down | Hub health + vault |

## Related documents

- `../../02_OPERATIONS_MANUAL.md`
- `../../05_DEVELOPER_HANDBOOK.md`
- `docs/architecture/IAM_FOUNDATION.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
