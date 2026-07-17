# Administrator Guide — Finance

| Field | Value |
|-------|-------|
| **Purpose** | Operate billing and financial operations UI |
| **Scope** | `/dashboard/finance`, FI reports, exports |
| **Audience** | Finance staff |
| **Prerequisites** | `finance.*` / `FINANCE_ACCESS` as required |
| **Version** | 1.0.0 |

## Procedures

### Configuration
- Chart/funding setup via configuration studio when permitted.  
- Payment providers: prefer live connectors; **do not rely on `square_planned` simulation in production** (Phase B).

### Daily operations
1. `/dashboard/finance` tabs — accounts, transactions, families.  
2. Family account drill-in `/dashboard/finance/families/[id]`.  
3. Board export via authorized finance export routes.  
4. FI imports/reports only with FI permissions.

### Best practices
- Dual-control for write-offs/adjustments when policy requires.  
- Verify school/org before exports.  
- Escalate RLS/permission anomalies as security incidents.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Cannot open finance | Permission / layout gate |
| Parent payment confusion | Confirm provider mode with IT |
| Report mismatch | Confirm FI vs operational finance stack (ADR-A1-002) |

## Related documents

- `docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md`
- `docs/security/phase-b/SECURITY_REPORT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
