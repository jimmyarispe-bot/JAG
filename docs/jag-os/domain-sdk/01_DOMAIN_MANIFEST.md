# 01 — Domain Manifest

Every domain package **must** declare a `DomainManifest`.

---

## Required fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Stable dotted/kebab id (`healthcare.clinical`) |
| `name` | string | Machine name |
| `displayName` | string | Human label (must not be “JAG”) |
| `version` | semver | Domain package version |
| `description` | string | What the pack contributes |
| `owner` | `{ name, email?, organization?, url? }` | Ownership |
| `supportedCapabilities` | capability[] | identity · context · intent · cognition · experience · action · evidence · memory · twin |
| `contributors` | `{ id, kind }[]` | Declared contributor surface |
| `requiredRuntimeVersion` | semver / range | Runtime contract requirement |
| `minimumCoreVersion` | semver / range | Minimum Core |
| `permissions` | `{ key, … }[]` | Permission keys for Action |
| `dependencies` | `{ domainId, versionRange }[]` | Other domains (not Core) |
| `featureFlags` | `Record<string, boolean>` | Pack-local flags |

Optional: `requiredSdkVersion`, `metadata`.

---

## Reserved ids

These ids are **forbidden** (constitutional):

`jag`, `jag.core`, `jag.runtime`, `runtime`, `core`, `sdk`, `domain-sdk`

---

## Example (generic)

```ts
{
  id: "example.industry",
  name: "example-industry",
  displayName: "Example Industry",
  version: "1.0.0",
  description: "Sample domain package",
  owner: { name: "Domain Team" },
  supportedCapabilities: ["context", "cognition", "action"],
  contributors: [
    { id: "example.context", kind: "context" },
    { id: "example.cognition", kind: "cognition" },
    { id: "example.action", kind: "action" },
  ],
  requiredRuntimeVersion: "1.0.0-rc",
  minimumCoreVersion: "1.0.0-rc",
  permissions: [{ key: "example.action.run", actionScoped: true }],
  dependencies: [],
  featureFlags: {},
}
```

Create via `createDomainManifest(...)` or the Domain Builder.
