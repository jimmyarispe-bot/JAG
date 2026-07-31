# JAG Universal Application Modeling Engine

**Sprint 014** — Platform capability that compiles declarative `ApplicationModel`s into package registrations.

```
Application Model → Model Compiler → Package Registrations → Package Runtime → JAG Engines
```

Applications (Academy, Healthcare, …) are **models**, not handwritten engine wiring.

## Layout

| Folder | Purpose |
|--------|---------|
| `application-model/` | Canonical `ApplicationModel` contract |
| `*-model/` | Per-engine model contracts |
| `compiler/` | Model → registry registration |
| `validation/` | Structural model validation |
| `runtime/` | Compiler ports / compile result types |
| `testing/` | Test helpers |

## Boundary

The compiler is **universal**. It must not import `@/packages/*` or `@/applications/*`. Industry meaning lives only in application models.
