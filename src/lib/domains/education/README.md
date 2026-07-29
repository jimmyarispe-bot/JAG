# Education Domain (D1 Foundation)

First industry package for **JAG™ Organizational Intelligence Operating System**.

This is **not** AcademyOS. It is the Education intelligence layer that plugs into JAG through the Domain SDK.

## Package

`src/lib/domains/education`

## What D1 delivers

| Area | Content |
|------|---------|
| Manifest | Declared via Domain SDK |
| Contributors | Placeholder Context · Intent · Cognition · Experience · Action · Evidence · Memory · Twin |
| Contracts | Education context families, intents, action catalog, evidence/memory/twin tokens |
| Registration | SDK registry + Runtime `asDomainAdapterApi()` |

## What D1 does **not** deliver

- Education business workflows
- AcademyOS product surfaces
- React / pages / portals
- Algorithms or recommendation engines
- Core or Runtime modifications

## Quick use

```ts
import { createJagRuntime } from "@/lib/jag/runtime";
import { registerEducationDomain } from "@/lib/domains/education";

const runtime = createJagRuntime();
const result = await registerEducationDomain({
  registrationApi: runtime.registry.asDomainAdapterApi(),
});
```

## Docs

See [`docs/domains/education/`](../../../docs/domains/education/).

## Checklist

Must remain aligned with [`DOMAIN_ADAPTER_CHECKLIST.md`](../../../docs/jag-os/runtime/DOMAIN_ADAPTER_CHECKLIST.md).
