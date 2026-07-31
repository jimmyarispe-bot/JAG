# Academy Application Model

Sprint 014 proof: Academy is expressed as an `ApplicationModel` and compiled by the JAG Modeling Engine.

| File | Role |
|------|------|
| `academy.application.ts` | Builds declarative Academy model from package definitions |
| `compile.ts` | `compileAcademyApplication()` → universal compiler + Academy ports |
| `ports.ts` | Package-local permission/report/terminology handlers |

The compiler under `src/jag/modeling` has **no** Academy imports.
