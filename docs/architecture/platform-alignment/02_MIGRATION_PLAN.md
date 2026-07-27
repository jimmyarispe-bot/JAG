# Sprint 057 — Migration plan

**Constraint:** No breaking changes. Sprint 057 itself changes **documentation and constitution only**. Later phases may change behavior only behind flags or additive metadata.

---

## Principles

1. **Additive first** — new fields, manifests, and aliases; no deletion of permission keys or routes in early phases.  
2. **Tenant #1 continuous** — The Academy Way keeps AcademyOS working at every step.  
3. **One deploy topology** — applications are packs inside one canonical Vercel project, not separate production apps.  
4. **Docs before code** — each phase’s PRs cite this plan and ADR-PA-001.

---

## Phase 0 — Deployment truth (ops; no product code)

**Executed as [Sprint 058](./sprint-058/README.md).**

| Action | Detail | Status |
|--------|--------|--------|
| Canonical project | **`academy-os`** only — local `.vercel` linked | ✅ Documented + linked |
| Freeze drift | Lock **`the-jag-platform-jimmy`**, `the-jag-platform-2026`, `the-jag-platform` | ✅ Git disconnected (verified 2026-07-26) — [sprint-058/03_LEGACY_PROJECT_FREEZE.md](./sprint-058/03_LEGACY_PROJECT_FREEZE.md) |
| Aliases | Production = `academy-os-lac.vercel.app` on `academy-os` only; Preview never steals Production | ✅ Documented |
| Staging | Branch `staging` + Staging environment on `academy-os` | ✅ Documented |
| CI/CD | GitHub Actions + Vercel Git flow | ✅ [sprint-058/02_CI_CD_FLOW.md](./sprint-058/02_CI_CD_FLOW.md) |

**Exit:** Operators agree Tenant #1 URL is `academy-os` Production; legacy projects frozen (complete freeze checklist).

---

## Phase 1 — Metadata only (behavior unchanged)

**Executed as [Sprint 059](./sprint-059/README.md).**

| Action | Detail | Status |
|--------|--------|--------|
| Application catalog | Table `platform_applications` — Application #1 = AcademyOS (`academyos`) | ✅ Migration 200 |
| Tenant application list | Table `organization_applications` (org ↔ app enablement) | ✅ Migration 200 |
| Default | If missing → treat as `["academyos"]` (TS soft default + seed all orgs) | ✅ |
| Document Tenant #1 | The Academy Way slug `the-academy-way` + enablement metadata `tenant_number: 1` | ✅ [sprint-059](./sprint-059/) |
| TS loaders | `src/lib/platform/applications/` — **not** wired to UI/nav/IAM | ✅ |

**Exit:** Every org has an implicit or explicit AcademyOS enablement; no UI change required.

---

## Phase 2 — Branding triple (compat defaults)

| Action | Detail |
|--------|--------|
| Resolve | `platformName` (JAG) · `applicationName` (AcademyOS) · `tenantProductName` (org branding) |
| Defaults | Only when unset; existing `product_name` / legal name still drive tenant chrome |
| Remove | Global default **Founder's Edition** as ambient tenant chrome (steward-gated edition remains) |
| Flag | Optional `branding.triple_v1` if gradual rollout needed |

**Exit:** Chrome can state platform vs app vs tenant without forcing Education ERP copy.

---

## Phase 3 — Application manifest (move by reference)

| Action | Detail |
|--------|--------|
| Manifest | AcademyOS module list, home route, permission pack id — **re-exports**, no URL moves |
| Layout | Dashboard reads AcademyOS manifest when tenant has AcademyOS enabled |
| Platform packages | Stay under `src/lib/platform/` |

**Exit:** Code ownership of “what is AcademyOS” is explicit; users see same routes.

---

## Phase 4 — Nav ownership (flagged)

| Action | Detail |
|--------|--------|
| Split | Platform region (MC, integrations, admin, steward links) vs Application modules |
| Stop | Founder Morning Brief as `DASHBOARD_MODULES[0]` |
| Flag | `nav.v2` default **off** until Tenant #1 sign-off |

**Exit:** Flag-on preview matches target IA; flag-off preserves current shell.

---

## Phase 5 — Permissions (aliases only)

| Action | Detail |
|--------|--------|
| Keep | `JAG_ACCESS`, `ACADEMYOS_ACCESS`, module gates |
| Add | Optional aliases documented as application-pack entitlements |
| Docs | Catalog comments: JAG = platform steward; AcademyOS = App #1 |

**Exit:** No key removals; docs match constitution.

---

## Phase 6 — Cloud Console = platform ops

| Action | Detail |
|--------|--------|
| Copy | Prefer “JAG Cloud” / Platform Console over “AcademyOS Cloud Console” as sole brand |
| Provision | Seed `enabled_applications` for new tenants (default AcademyOS) |

**Exit:** New tenants are created as platform tenants with App #1 enabled.

---

## Phase 7 — Second application stub

| Action | Detail |
|--------|--------|
| Manifest | HealthcareOS or NonprofitOS empty pack + placeholder home |
| Prove | Test tenant can enable stub without new Vercel project |

**Exit:** Multi-app tenancy proven; no production vertical required yet.

---

## Phase 8 — Shared vertical cores (optional)

Promote finance GL / generic HR / communications providers to platform **only when** a second app needs them. Keep education-specific billing and credentials in AcademyOS.

---

## Branding assumptions to remove (by phase)

| Assumption | Phase |
|------------|-------|
| Product identity = AcademyOS everywhere | 2, 6 |
| Default edition = Founder's Edition for all users | 2 |
| Education ERP hardcoded shells | 0 (stop serving), 4 (nav) |
| Founder brief as AcademyOS module #0 | 4 |
| Multiple production Vercel projects for one repo | 0 |

---

## Module placement (target)

### JAG core

Identity, tenancy, config/branding engines, events, workflows, automation/MC engines, CRUD/release, integration bus, Cloud Console, design systems, intelligence infrastructure, auth protocol, steward surfaces.

### AcademyOS

Students, families, admissions, teacher, scheduling, scholarships, portal/apply, academic config, education permission pack, AcademyOS nav/home, education connectors.

### Tenant-configurable

Branding, org profile, schools, module/feature enablement, `enabled_applications`.

---

## Success criteria (alignment complete)

- Constitution and this package agree: Platform JAG · App AcademyOS · Tenant org.  
- Tenant #1 explicitly AcademyOS-enabled.  
- One production Vercel SHA for the monorepo.  
- Chrome can distinguish platform / application / tenant names.  
- AcademyOS domains sit behind an app manifest; platform engines avoid new education SoR imports (enforced gradually).  
- Second app stub can be enabled without a new deploy topology.

---

## Sprint 057 checklist (this sprint only)

- [x] Publish layer model  
- [x] Publish this migration plan  
- [x] Amend constitution + ADR  
- [ ] No runtime PRs in the Sprint 057 alignment commit set  
