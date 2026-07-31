# JAG Blueprint Engine

**Sprint 015** — Industry knowledge + organization identity → runtime specification → compiler.

```
Industry Blueprint
        ↓
Organization Blueprint
        ↓
Runtime Specification
        ↓
Model Compiler
        ↓
Package Runtime / JAG Engines
```

| Layer | Meaning |
|-------|---------|
| Industry Blueprint | What is common to an industry (Education, Healthcare, …) |
| Organization Blueprint | What is unique to an organization (The Academy Way) |
| Runtime Specification | What JAG will compile and execute (`ApplicationModel` alias) |

The Blueprint Engine is universal. It does not import `@/packages/*`.
