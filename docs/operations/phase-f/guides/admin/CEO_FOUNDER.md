# Administrator Guide — CEO / Founder

| Field | Value |
|-------|-------|
| **Purpose** | Operate executive surfaces daily |
| **Scope** | `/dashboard`, `/exec`, mission control, executive intel |
| **Audience** | Founder / CEO with `JAG_ACCESS` / founder permissions |
| **Prerequisites** | Login; permissions granted by IT |
| **Version** | 1.0.0 |

## Procedures

### Configuration
- Branding & org titles: `/dashboard/admin/branding`, configuration studio (with admin perms).  
- Do not change RLS/SQL — escalate to IT.

### Permissions
- Access is **permission-based** (`JAG_ACCESS`, executive permissions). Role titles are display labels.

### Daily operations
1. Open `/dashboard` morning brief / mission control.  
2. Review `/exec/brief` and `/exec/health`.  
3. Use `/exec/ask` for guided questions (verify data sensitivity).  
4. Drill into `/dashboard/executive/*` for KPIs when needed.  
5. Avoid Phase-2 Exec nav items until IT confirms routes are live (see UX Phase D).

### Best practices
- Prefer one executive home (`/exec` **or** dashboard executive) to reduce context switching.  
- Exports: use board-export APIs only when authorized.  
- Never share service-role keys.

## Troubleshooting

| Issue | Action |
|-------|--------|
| `/exec` forbidden | Missing `JAG_ACCESS` — contact IT |
| Empty graph | May be placeholder — confirm with engineering |
| Nav 404 | Phase-2 item — ignore or report |

## Related documents

- `docs/ux/phase-d/02_WORKFLOW_REVIEW.md`
- `docs/architecture/adr/ADR-A1-001-executive-graph-packages.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
