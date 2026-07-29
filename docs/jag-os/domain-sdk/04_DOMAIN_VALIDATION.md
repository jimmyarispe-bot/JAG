# 04 — Domain Validation

`validateDomain(manifest, options)` / `validateDomainManifest`.

---

## Checks

| Area | What is validated |
|------|-------------------|
| Manifest completeness | Required strings + owner.name |
| Id format | `^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$` |
| Reserved ids | Core identity claims blocked |
| Constitutional | Domain must not name itself “JAG” / “JAG OS” |
| Versions | Semver + host compatibility |
| Capabilities | Known capability tokens only |
| Contributors | Declared vs registered; duplicates |
| Capability coupling | e.g. `action` requires Action contributor |
| Permissions | Warning if action capability with empty permissions |
| Runtime compatibility | `requiredRuntimeVersion` / `minimumCoreVersion` vs host |

---

## Options

```ts
validateDomain(manifest, {
  bundle, // DomainContributorBundle from builder
  host: {
    runtimeVersion: "1.0.0-rc",
    coreVersion: "1.0.0-rc",
    sdkVersion: "1.0.0",
  },
  strict: false, // treat warnings as errors when true
});
```

---

## Result

```ts
{
  ok: boolean;
  errors: DomainValidationIssue[];
  warnings: DomainValidationIssue[];
}
```

Issue codes include: `MANIFEST_INCOMPLETE`, `VERSION_INCOMPATIBLE`, `CONTRIBUTOR_MISSING`, `CONSTITUTIONAL_VIOLATION`, `RUNTIME_INCOMPATIBLE`, …

---

## Registry / lifecycle

Both `DomainRegistry.register` (default) and `DomainLifecycle.install` run validation before acceptance.
