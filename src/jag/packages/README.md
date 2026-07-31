# JAG OS — Universal Package Runtime

**Sprint 009.** Multi-package discovery, validation, and activation.

Packages are **declarative manifests**. This runtime owns lifecycle and dependency validation. Packages never implement engines.

```text
packages/
  contracts/   Manifest + extension ports
  manifest/    Version helpers
  validation/  Manifest rules (no engines)
  dependency/  Graph validation
  lifecycle/   Deterministic transitions
  events/      Lifecycle events
  registry/    Register / discover / activate
  loader/      Manifest → initialized (+ hooks)
  runtime/     Facade
  testing/     Test helpers
```

Docs: `docs/jag-os/packages/`

Do **not** import `@/packages/*` or `@/applications/*` from this tree. Hosts bind a `PackageManifestSource` or call `PackageRuntime.load(manifest)`.
