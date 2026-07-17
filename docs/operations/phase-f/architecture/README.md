# Architecture Documentation Package — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Single entry for production architecture documentation |
| **Scope** | System, platform, modules, graphs, DB, infra, integration, security, AI |
| **Audience** | Engineers, architects, security, ops |
| **Prerequisites** | Read `PLATFORM_CONSTITUTION.md` |
| **Version** | 1.0.0 |

## Package contents

| Doc | Content |
|-----|---------|
| [01_SYSTEM_AND_PLATFORM.md](./01_SYSTEM_AND_PLATFORM.md) | Deployed topology, layers, surfaces |
| [02_MODULE_AND_DEPENDENCIES.md](./02_MODULE_AND_DEPENDENCIES.md) | Modules + dependency notes |
| [03_DATA_GRAPH_AND_AI.md](./03_DATA_GRAPH_AND_AI.md) | Executive graph, knowledge/intelligence, AI |
| [04_SECURITY_AND_INTEGRATION.md](./04_SECURITY_AND_INTEGRATION.md) | Security + integrations index |

## Canonical sources (authoritative detail)

| Topic | Path |
|-------|------|
| Full architecture snapshot | `docs/architecture/CURRENT_ARCHITECTURE_REPORT.md` |
| Constitution | `docs/architecture/PLATFORM_CONSTITUTION.md` |
| Platform architecture | `docs/architecture/PLATFORM_ARCHITECTURE.md` |
| Contract / maturity | `docs/architecture/PLATFORM_CONTRACT.md` |
| Platform services | `docs/architecture/platform-services.md` |
| Security model | `docs/architecture/SECURITY_MODEL.md` |
| IAM | `docs/architecture/IAM_FOUNDATION.md` |
| Caching | `docs/architecture/CACHING_STRATEGY.md` |
| Exec graph ADR | `docs/architecture/adr/ADR-A1-001-executive-graph-packages.md` |
| Finance dual-stack ADR | `docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md` |
| Dependency audit | `docs/architecture/audit/DEPENDENCY_GRAPH_AUDIT.md` |
| Phase B security | `docs/security/phase-b/` |

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Phase F index package |
