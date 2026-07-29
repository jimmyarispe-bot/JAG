# 00 — Education Domain Overview

**Program D1 — Education Domain Foundation**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [DOMAIN_ADAPTER_CHECKLIST.md](../../jag-os/runtime/DOMAIN_ADAPTER_CHECKLIST.md) · [Domain SDK](../../jag-os/domain-sdk/00_DOMAIN_SDK.md)  
**Package:** `src/lib/domains/education`  
**Status:** Foundation + Enrollment + Framework + Attendance + Intelligence Graph (D2.4) + Planner (D2.5) + Orchestrator (D2.6) + Observability (D2.7) + Knowledge Model (D3.0) + Policy Engine (D3.1) + Academic Progress (D4.0) + Student Success Synthesis (D4.1) + Student Support Capability Pack (D4.2) + Capability Pack Registry (D5.0) + Academic Operations Capability Pack (D5.1)

---

## 1. Purpose

Prove that JAG supports industry-specific intelligence **without changing Core**.

Education is the first domain package. It plugs in exclusively through the Domain SDK and Runtime contributor contracts.

---

## 2. What this is / is not

| Is | Is not |
|----|--------|
| Education intelligence package | AcademyOS product |
| Domain SDK consumer | Core fork |
| Contracts + placeholders | Business workflows |
| Runtime registration demo | UI / React / portals |

---

## 3. Layout

```text
src/lib/domains/education/
  manifest/        DomainManifest
  builder/         SDK builder wiring
  registry/        registerEducationDomain()
  contributors/    factory
  context/         contracts + placeholder
  intent/          catalog + placeholder
  cognition/       intelligence pipeline (planner → orchestrator → graph)
  knowledge/       canonical knowledge model (D3.0 — definitions only)
  capabilities/    capability pack registry (D5.0 — discoverable packs)
  policy/          policy evaluation engine (D3.1 — evaluation only)
  experience/      fragment tokens + placeholder
  actions/         action catalog + skipped execute
  evidence/        source tokens + placeholder
  memory/          kind tokens + placeholder
  twin/            entity tokens + placeholder
  types/           ids / permissions
```

---

## 4. Success criteria (D1)

- First domain package exists outside Core  
- No Runtime / Core modifications  
- SDK validation passes  
- Runtime contributor registration works  
- Placeholders only — no Education business logic  

---

## 5. Document index

| Doc | Topic |
|-----|-------|
| [01_MANIFEST.md](./01_MANIFEST.md) | Manifest fields |
| [02_CONTRIBUTORS.md](./02_CONTRIBUTORS.md) | Contributor surface |
| [03_RUNTIME_REGISTRATION.md](./03_RUNTIME_REGISTRATION.md) | Host wiring |
| [04_VALIDATION.md](./04_VALIDATION.md) | Validation evidence |
