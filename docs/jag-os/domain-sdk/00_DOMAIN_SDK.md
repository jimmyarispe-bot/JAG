# 00 — Domain SDK Overview

**Program D0 — Universal Domain Framework**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md) · [UNIVERSAL_ORGANIZATION_MODEL.md](../../../UNIVERSAL_ORGANIZATION_MODEL.md) · [DOMAIN_ADAPTER_CHECKLIST.md](../runtime/DOMAIN_ADAPTER_CHECKLIST.md) · [11_CORE_STABILITY_POLICY.md](../runtime/implementation/11_CORE_STABILITY_POLICY.md)  
**Package:** `src/lib/jag/domain-sdk`  
**Status:** Core frozen — domains extend via SDK only

---

## 1. Purpose

The Domain SDK defines **how any industry plugs into JAG** without modifying Core.

Education is the first planned consumer. Healthcare, Manufacturing, Government, Legal, Hospitality, Retail, Energy, Construction, Insurance, and every future industry use **the same SDK**.

---

## 2. Architecture

```text
Domain packages (Education · Healthcare · …)
        │
        ▼
Domain SDK (manifest · builder · registry · lifecycle · validation)
        │
        ▼
DomainAdapter + Contributors
        │
        ▼
JAG Runtime Core (architecturally frozen)
```

---

## 3. Non-negotiables

| Rule | Meaning |
|------|---------|
| No Core changes | SDK lives outside `src/lib/jag/runtime` |
| No Education code in SDK | SDK is industry-agnostic |
| No business logic in SDK | Contributors are registered, not implemented here |
| Single extension model | Contributor registration → contracts → registry |
| Checklist mandatory | [DOMAIN_ADAPTER_CHECKLIST.md](../runtime/DOMAIN_ADAPTER_CHECKLIST.md) |

---

## 4. Module map

| File | Responsibility |
|------|----------------|
| `domain-sdk.ts` | Facade (`createDomainSdk`) |
| `domain-manifest.ts` | Manifest schema |
| `domain-builder.ts` | Fluent package assembly |
| `domain-registry.ts` | Installed domain catalog |
| `domain-lifecycle.ts` | install / activate / remove |
| `domain-validation.ts` | Completeness + constitution |
| `domain-version.ts` | Compatibility |
| `domain-capabilities.ts` | Capability tokens |
| `domain-metadata.ts` | Owner, deps, permissions |

---

## 5. Document index

| Doc | Topic |
|-----|-------|
| [01_DOMAIN_MANIFEST.md](./01_DOMAIN_MANIFEST.md) | Manifest fields |
| [02_DOMAIN_LIFECYCLE.md](./02_DOMAIN_LIFECYCLE.md) | Lifecycle states |
| [03_DOMAIN_BUILDER.md](./03_DOMAIN_BUILDER.md) | Builder API |
| [04_DOMAIN_VALIDATION.md](./04_DOMAIN_VALIDATION.md) | Validation rules |
| [05_DOMAIN_VERSIONING.md](./05_DOMAIN_VERSIONING.md) | Versions |
| [06_FIRST_DOMAIN_GUIDE.md](./06_FIRST_DOMAIN_GUIDE.md) | How to build Education later (no implementation) |
