# Documentation Inventory & Gap Analysis — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Inventory existing docs; identify missing, outdated, duplicate, inconsistent content |
| **Scope** | `docs/` (~275 files), README, CI, Supabase, launch env |
| **Audience** | Documentation owners, architects, release managers |
| **Prerequisites** | Repo checkout |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

---

## 1. Inventory summary

| Area | Location | Count / status |
|------|----------|----------------|
| Architecture | `docs/architecture/` | ~116 — strong |
| Blueprints (future-leaning) | `docs/blueprints/` | ~50 — ahead of runtime |
| Governance / instructional | `docs/governance/` | ~45 |
| Product / connectors | `docs/product/` | ~26 |
| Security Phase B | `docs/security/phase-b/` | 13 |
| UX Phase D | `docs/ux/phase-d/` | 11 |
| Constitution | `docs/constitution/` | 7 |
| Launch | `docs/launch/` | 3 |
| **Ops Phase F** | `docs/operations/phase-f/` | **This package** |

---

## 2. Missing (pre–Phase F)

| Document class | Gap |
|----------------|-----|
| Operational runbooks | Deploy, rollback, incident, backup, queue recovery |
| API reference | No OpenAPI; no Server Action catalog |
| Database ERD / full RLS matrix | Schema in 171 SQL migrations only |
| DR / RTO / RPO | Not documented |
| Committed admin/user guides | Stub generators in certification only |
| Developer handbook | Partial via ENGINEERING_STANDARDS |
| Monitoring runbooks | Health probes only |
| Support SLAs | Missing |
| Phase F index | Missing |

---

## 3. Outdated

| Document | Issue | Remediation |
|----------|-------|-------------|
| Root `README.md` | Names “EduOS Phase 1”; migrations through **042** only; live **171** | Updated pointer (Phase F) |
| `docs/launch/PRODUCTION_ENV.md` | Claimed cron every 6h | Align to `vercel.json` `0 0 * * *` |
| Migration counts in launch/architecture reports | 129 / 131 / 154 vs 171 | Cite `supabase/migrations/` as source of truth |
| Certification auto-guides | Placeholder markdown in DB | Prefer Phase F guides |

---

## 4. Duplicates / inconsistency risks

- Sprint docs vs `CURRENT_ARCHITECTURE_REPORT.md` vs `PLATFORM_*` constitution stack  
- Blueprints vs shipped runtime (do not treat blueprints as production behavior)  
- Dual executive surfaces documented in UX Phase D  
- Cron schedule drift (fixed in PRODUCTION_ENV as part of Phase F)

---

## 5. Missing diagrams (pre–Phase F)

| Diagram | Status after Phase F |
|---------|----------------------|
| System / deploy topology | Added in `architecture/01_SYSTEM_AND_PLATFORM.md` |
| Package / module dependency | Cross-link `DEPENDENCY_GRAPH_AUDIT.md` + summary diagram |
| Executive / knowledge graph | Cross-link ADRs + architecture reports |
| ERD | **Still gap** — generate via tooling in Wave F.1 |
| Sequence: queue cron | Added in monitoring/deploy docs |

---

## 6. Procedures

1. Treat `docs/operations/phase-f/README.md` as ops entrypoint.  
2. Prefer canonical architecture docs over sprint narratives for production questions.  
3. When code changes authz/API/schema, update Phase F API/DB indexes in the same PR.  
4. Never publish certification stub guides as customer-facing without rewrite.

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Conflicting migration counts | Count files in `supabase/migrations/*.sql` |
| Feature in blueprint not in UI | Check `CURRENT_ARCHITECTURE_REPORT` / route inventory — likely not shipped |
| Env var unknown | `src/lib/platform/env/schema.ts` + `PRODUCTION_ENV.md` |

## Related documents

- `00_DOCUMENTATION_READINESS_ASSESSMENT.md`
- `15_DOCUMENTATION_GAP_CLOSURE_REPORT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial inventory |
