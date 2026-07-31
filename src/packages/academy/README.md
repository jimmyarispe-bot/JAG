# Academy — Application Package #1

**Reference package** for The JAG OS Package Runtime (Sprint 010 Phase 1).

Academy **registers** capabilities. It does **not** implement JAG engines.

## Layout

```text
academy/
  manifest.ts          AcademyPackageManifest
  package.ts           Identity + version
  host.ts              JagPackageHost binding (composition root)
  register.ts          PackageLoader entry
  registration/        Phase 1 contribution modules
  testing/             Test helpers
```

## Phase 1 contributions

entities · forms · workflows · navigation · permissions · reports · terminology · localization

**Not yet:** processes · decisions · documents · communications

## Boot

1. Composition root imports `@/packages/academy/host` (binds host).
2. `startJAG()` → `PackageLoader.loadSync(AcademyPackageManifest)`.
3. Host registers contributions + composes DI/health.

JAG never imports this package from engine code.
