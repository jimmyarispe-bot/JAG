# 05 — Domain Versioning

---

## Version planes

| Plane | Constant / field | Meaning |
|-------|------------------|---------|
| SDK | `DOMAIN_SDK_VERSION` (`1.0.0`) | This framework |
| Runtime contract | `DOMAIN_SDK_RUNTIME_CONTRACT` (`1.0.0-rc`) | Ω-7B freeze baseline |
| Core minimum | `DOMAIN_SDK_MINIMUM_CORE` | Minimum host Core |
| Domain | `manifest.version` | Pack semver |
| Required Runtime | `manifest.requiredRuntimeVersion` | What pack needs |
| Minimum Core | `manifest.minimumCoreVersion` | What pack needs |
| Required SDK | `manifest.requiredSdkVersion?` | Optional |

---

## Range syntax

Supported by `satisfiesVersion` / `checkVersionCompatibility`:

| Range | Meaning |
|-------|---------|
| `1.2.3` | Exact major.minor.patch (as requirement: treated as `>=` for Runtime/Core mins) |
| `^1.2.3` | Compatible major, ≥ base |
| `~1.2.3` | Compatible minor, ≥ base |
| `>=1.2.3` | Greater or equal |

Bare `requiredRuntimeVersion` / `minimumCoreVersion` values are normalized to `>=` for host checks.

---

## Compatibility function

```ts
checkVersionCompatibility({
  domainVersion,
  runtimeVersion,
  coreVersion,
  requiredRuntimeVersion,
  minimumCoreVersion,
  sdkVersion?,
  requiredSdkVersion?,
});
```

---

## Policy alignment

Follows [11_CORE_STABILITY_POLICY.md](../runtime/implementation/11_CORE_STABILITY_POLICY.md):

- Additive SDK changes → minor
- Breaking SDK / contract changes → major + constitutional review
- Domain packs version independently of Core
