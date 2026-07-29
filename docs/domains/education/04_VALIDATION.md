# 04 — Validation

---

## SDK validation

`buildEducationDomain()` / `registerEducationDomain()` run Domain SDK validation covering:

| Check | Expected |
|-------|----------|
| Manifest completeness | Pass |
| Constitutional (not claiming “JAG”) | Pass |
| Contributor registration vs declaration | Pass |
| Capability coupling (action → Action contributor) | Pass |
| Runtime / Core / SDK compatibility | Pass against `1.0.0-rc` / SDK `1.0.0` |

---

## Architectural validation

| Check | Result |
|-------|--------|
| Imports into `src/lib/jag/runtime` from Education | **Forbidden — none** |
| Education modifies Core | **No** |
| Education uses Domain SDK only for packaging | **Yes** |
| Action execute mutates SoR | **No** (`skipped`) |
| UI / React in domain package | **No** |

---

## Tests

`tests/unit/domains/education/education-domain.test.ts` covers:

- Manifest shape  
- Builder / registration  
- Validation  
- Lifecycle  
- Contributor discovery  
- SDK compatibility  
- Runtime registration via `asDomainAdapterApi()`  

---

## Checklist pointer

Shipping beyond foundation still requires the full [DOMAIN_ADAPTER_CHECKLIST.md](../../jag-os/runtime/DOMAIN_ADAPTER_CHECKLIST.md). D1 proves the plug-in path; later phases add real Education intelligence under the same contracts.
