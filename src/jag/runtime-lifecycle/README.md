# Runtime Lifecycle Manager

**Sprint 018** — Control plane for generated Runtime Specifications.

```text
Runtime Generation → Runtime Specification → Lifecycle Manager → Compiler → JAG Runtime
```

Versions are immutable. New generation = new version.

States: `draft → validated → approved → published → archived`

No persistence, deployment, or live execution in this sprint — contracts and in-memory governance only.

See `docs/jag-os/runtime-lifecycle/`.
