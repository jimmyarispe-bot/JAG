# Module Architecture & Dependencies — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Map domain modules and npm/package dependency posture |
| **Scope** | `src/lib/*` modules, build validators, npm deps |
| **Audience** | Engineers, architects |
| **Prerequisites** | Repo checkout |
| **Version** | 1.0.0 |

---

## Domain modules (implementation)

| Module path | Primary UI | Notes |
|-------------|------------|-------|
| `src/lib/admissions/` | `/dashboard/admissions`, `/apply` | CRM + portal |
| `src/lib/students/`, `ssis/` | `/dashboard/students` | SIS |
| `src/lib/scheduling/` | `/dashboard/scheduling` | Scheduling |
| `src/lib/teacher/`, `instruction/` | `/dashboard/teacher` | Teacher workspace |
| `src/lib/finance/`, `financial-intelligence/` | `/dashboard/finance` | Dual finance stacks — see ADR-A1-002 |
| `src/lib/hr/` | `/dashboard/hr` | Workforce |
| `src/lib/scholarships/` | `/dashboard/scholarships` | Aid |
| `src/lib/portal/` | `/portal` | Family/student |
| `src/lib/executive/`, `edi/` | `/dashboard/executive`, `/exec` | Executive intel |
| `src/lib/compliance/` | `/dashboard/compliance` | Compliance |
| `src/lib/configuration/` | Config studio | Org setup |
| `src/lib/enterprise-data/` | `/dashboard/data` | EDP |
| `src/lib/intelligence-platform/` | `/dashboard/intelligence` | AIP |
| `src/lib/intelligence-network/` | `/dashboard/network` | AIN |
| `src/lib/integration-hub/` | `/dashboard/integrations` | Connectors |
| `src/lib/certification/` | `/dashboard/certification` | Cert center |
| `src/lib/cloud-platform/`, `operations-platform/` | `/cloud`, `/operations` | SaaS consoles |
| `src/lib/platform/*` | Cross-cutting | Activity, events, workflow, automation, identity, ULR, PAJ, etc. |

---

## Build-time dependency / registry validation

`npm run build` runs validators before `next build`:

- platform, admissions, workflow, decision, events, intelligence-graph, automation, ulr, hierarchy, execution-engine

Failure blocks production build.

---

## NPM runtime dependencies (production)

| Package | Role |
|---------|------|
| `next@16.2.9` | Framework |
| `react` / `react-dom` `@19.2.4` | UI |
| `@supabase/ssr`, `@supabase/supabase-js` | Data + auth |

Lean tree — see `docs/security/phase-b/06_DEPENDENCY_VULNERABILITY_REPORT.md` and `docs/architecture/audit/DEPENDENCY_GRAPH_AUDIT.md`.

---

## Procedures

1. New cross-cutting capability → `src/lib/platform/{service}/` per `PLATFORM_CONTRACT.md`.  
2. Domain mutations → module `actions.ts` + permission checks.  
3. Before merge: `npm run typecheck` and relevant validators.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Validator fails at build | Read script under `scripts/validate-*.mts` |
| Circular import suspicion | See DEPENDENCY_GRAPH_AUDIT |

## Related documents

- `docs/architecture/ENGINEERING_STANDARDS.md`
- `docs/architecture/PLATFORM_CONTRACT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
