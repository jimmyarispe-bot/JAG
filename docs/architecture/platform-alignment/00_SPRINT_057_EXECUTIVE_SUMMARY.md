# Sprint 057 — JAG Platform Alignment

## Executive summary

| Field | Value |
|-------|--------|
| **Sprint** | 057 — JAG Platform Alignment (architecture track) |
| **Date** | 2026-07-26 |
| **Mode** | Documentation and constitutional amendment only |
| **Runtime code** | **Unchanged** in this sprint |

### Product decision (ratified)

| Concept | Definition |
|---------|------------|
| **Platform** | **JAG** — shared runtime, identity, tenancy, engines, Cloud Console, platform stewardship |
| **Application #1** | **AcademyOS** — school / education operations pack on JAG |
| **Tenant #1** | **The Academy Way** — organization running AcademyOS |
| Future applications | HealthcareOS, NonprofitOS, … (same platform, separate app packs) |

### Problem this sprint eliminates

Historical docs and UI conflated three different ideas:

1. **JAG** as a Founder-only *product face* peer to AcademyOS  
2. **AcademyOS** as both the *platform brand* and the *school ERP*  
3. **Organization** as tenancy without an explicit *application* membership  

That confusion produced wrong mental models, branding leaks (“Education ERP”, global “Founder's Edition”), and deployment sprawl (multiple Vercel projects serving different SHAs).

### Outcomes of Sprint 057

1. Canonical **Platform / Application / Tenant** layer model published.  
2. Constitution amended so JAG is the platform; AcademyOS is Application #1; organizations are tenants.  
3. Founder Protection (`JAG_ACCESS`) retained as **platform stewardship**, not “JAG the app.”  
4. Migration plan sequenced with **no breaking changes** and **no behavior change in this sprint**.  
5. ADR-PA-001 records the decision and amendment authority.

### Explicit non-goals (this sprint)

- No route renames, permission key renames, or nav refactors  
- No database migrations  
- No Vercel project changes (documented in migration plan for a later phase)  
- No HealthcareOS / NonprofitOS implementation  
- No regeneration of intelligence packages  

### Exit criteria (Sprint 057)

- [x] Layer model documented  
- [x] Constitution §1 / §4 reflect Platform / Application / Tenant  
- [x] ADR-PA-001 filed  
- [x] Migration plan published (behavior changes deferred to later phases)  
- [ ] Engineering standards reference this package (follow-up checklist item)  

### Next sprint input

Implementers must read [02_MIGRATION_PLAN.md](./02_MIGRATION_PLAN.md) before any PR that changes chrome, branding defaults, manifests, or deployment topology.
