# 03 — Runtime Registration

Education registers **only** through the Domain SDK → `DomainAdapter` → Runtime `DomainAdapterRegistrationApi`.

No Core changes. No alternate execution paths.

---

## One-shot helper

```ts
import { createJagRuntime } from "@/lib/jag/runtime";
import { registerEducationDomain } from "@/lib/domains/education";

const runtime = createJagRuntime();

const { domain, registry, lifecycle, validation } =
  await registerEducationDomain({
    registrationApi: runtime.registry.asDomainAdapterApi(),
  });
```

Effects:

1. Build Education `DomainPackage` via SDK builder  
2. Validate manifest + contributors + host versions  
3. SDK registry `register` + `enable`  
4. Lifecycle `install` → `initialize` → `activate`  
5. Adapter registers all eight contributors on the Runtime registry  

---

## Manual path

```ts
import { buildEducationDomain } from "@/lib/domains/education";
import { createDomainSdk } from "@/lib/jag/domain-sdk";

const domain = buildEducationDomain();
await domain.adapter.register(runtime.registry.asDomainAdapterApi());
```

---

## Verification

After activation:

```ts
runtime.registry.listContextContributors()   // includes education.context
runtime.registry.listIntentContributors()    // includes education.intent
runtime.registry.listCognitiveContributors() // includes education.cognition
runtime.registry.listExperienceContributors()
runtime.registry.listActionContributors()
runtime.registry.listEvidenceContributors()
runtime.registry.listMemoryContributors()
runtime.registry.listTwinContributors()
```
