# JAG Studio Foundation™ — Overview

JAG Studio is the internal operating environment used to build, inspect, validate, certify, and release JAG itself.

**AcademyOS is the first customer.** Future industry packs (HealthcareOS, GovernmentOS, ManufacturingOS) are also built through Studio.

## Boundaries

- Lives in `packages/studio/`
- Consumes Platform SDK, Twin, Connectors, and diagnostics via public APIs
- Does **not** modify Platform Foundation, AcademyOS packages, or SDK APIs

## Modules

| Module | Path |
|--------|------|
| Architecture | `architecture/` |
| Repository | `repository/` |
| Products | `products/` |
| Release | `release/` |
| Testing | `testing/` |
| PER Engine | `per/` |
| Documentation | `documentation/` |
| Insights | `insights/` |
| Workspaces | `workspaces/` |

## Install

```ts
installJagStudio({ organizationId, freshSdk: true })
```

Registers the Studio extension + `studio.platform-insights` Insight Provider.
