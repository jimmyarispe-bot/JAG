# Architecture documentation — current truth

| Field | Value |
|-------|--------|
| **Pinned** | 2026-07-17 (Phase A.1 Wave 0 / H-A8) |
| **Governing law** | [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) |
| **Current assessment** | [phase-a/](./phase-a/) — Release Phase A package |
| **Intelligence product claims** | [phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md](./phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md) |
| **Module ID authority** | `INTELLIGENCE_MODULE_IDS` in `src/lib/platform/intelligence/infrastructure/types.ts` |
| **Migration authority** | `supabase/migrations/` (head through **183**) |
| **RC product packages** | [../platform/rc-packages.md](../platform/rc-packages.md) |
| **RC-6 audits / releases** | [../releases/](../releases/) |

---

## Start here (read in order)

1. [PLATFORM_CONSTITUTION.md](./PLATFORM_CONSTITUTION.md) — Platform / Application / Tenant + IAM rules  
2. [platform-alignment/](./platform-alignment/) — **Sprint 057** JAG Platform Alignment (definitions + migration; docs before behavior)  
3. [phase-a/00_EXECUTIVE_ARCHITECTURE_REPORT.md](./phase-a/00_EXECUTIVE_ARCHITECTURE_REPORT.md) — CONDITIONAL GO + risks  
4. [phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md](./phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md) — what may be claimed as production intelligence  
5. [phase-a/ARCHITECTURE_SCORECARD.md](./phase-a/ARCHITECTURE_SCORECARD.md) — current scores  
6. [phase-a/07_PRIORITIZED_REMEDIATION_PLAN.md](./phase-a/07_PRIORITIZED_REMEDIATION_PLAN.md) — remediation waves  

---

## Phase A package

| Doc | Role |
|-----|------|
| [00_EXECUTIVE_ARCHITECTURE_REPORT.md](./phase-a/00_EXECUTIVE_ARCHITECTURE_REPORT.md) | Leadership summary |
| [01_SYSTEM_ARCHITECTURE.md](./phase-a/01_SYSTEM_ARCHITECTURE.md) | System map |
| [02_MODULE_DEPENDENCY_REPORT.md](./phase-a/02_MODULE_DEPENDENCY_REPORT.md) | Dependencies |
| [03_TECHNICAL_DEBT_REPORT.md](./phase-a/03_TECHNICAL_DEBT_REPORT.md) | Debt |
| [04_DUPLICATION_ANALYSIS.md](./phase-a/04_DUPLICATION_ANALYSIS.md) | Duplication |
| [05_LAYERING_AND_BOUNDARIES.md](./phase-a/05_LAYERING_AND_BOUNDARIES.md) | Layers |
| [06_ARCHITECTURE_RISK_REGISTER.md](./phase-a/06_ARCHITECTURE_RISK_REGISTER.md) | Risks |
| [07_PRIORITIZED_REMEDIATION_PLAN.md](./phase-a/07_PRIORITIZED_REMEDIATION_PLAN.md) | Plan |
| [ARCHITECTURE_SCORECARD.md](./phase-a/ARCHITECTURE_SCORECARD.md) | Scorecard |
| [PRODUCTION_INTELLIGENCE_CONTRACT.md](./phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md) | C-A3 contract |
| [H-A9_OPS_GATE_EVIDENCE.md](./phase-a/H-A9_OPS_GATE_EVIDENCE.md) | Migration ops gate |
| [PHASE_A1_COMPLETION_REPORT.md](./phase-a/PHASE_A1_COMPLETION_REPORT.md) | Wave 0 completion |
| [phase-b/](./phase-b/) | Architecture stabilization (Phase B) |
| [phase-c/](./phase-c/) | Production readiness & security validation (Phase C) |
| [phase-d/](./phase-d/) | Performance & scalability validation (Phase D) |

---

## Still current (supporting)

| Doc | Role |
|-----|------|
| [platform-alignment/](./platform-alignment/) | Sprint 057 — JAG = platform · AcademyOS = App #1 · The Academy Way = Tenant #1 |
| [platform-alignment/sprint-058/](./platform-alignment/sprint-058/) | Sprint 058 — canonical Vercel project `academy-os` · Prod/Staging/Preview · CI/CD |
| [platform-alignment/sprint-059/](./platform-alignment/sprint-059/) | Sprint 059 — `platform_applications` + org enablement (metadata only) |
| [adr/ADR-PA-001-platform-application-tenant.md](./adr/ADR-PA-001-platform-application-tenant.md) | ADR accepting the layer model |
| [INTELLIGENCE_SURFACES_MAP.md](./INTELLIGENCE_SURFACES_MAP.md) | Which intelligence package to use (H-A1) |
| [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) | Platform shape |
| [PLATFORM_CONTRACT.md](./PLATFORM_CONTRACT.md) | Sprint 000 maturity contract |
| [SECURITY_MODEL.md](./SECURITY_MODEL.md) | Security model |
| [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md) | Engineering standards |
| [adr/](./adr/) | Architecture decision records |
| Stabilization A1–A5 (`STABILIZATION_A*.md`) | Completed intelligence commons work |

---

## Historical (do not use for release decisions)

These documents are **superseded for current-state claims**. Keep for archaeology only.

| Doc | Superseded by |
|-----|----------------|
| [CURRENT_ARCHITECTURE_REPORT.md](./CURRENT_ARCHITECTURE_REPORT.md) (2026-07-05) | Phase A + constitution |
| [audit/](./audit/) scorecards & audits (pre A1–A5 / pre Phase A) | `phase-a/*` |
| [INTELLIGENCE_DOMAIN_MODEL.md](./INTELLIGENCE_DOMAIN_MODEL.md) catalog slices | `INTELLIGENCE_MODULE_IDS` + Phase A |

Each historical file carries a banner pointing here.
