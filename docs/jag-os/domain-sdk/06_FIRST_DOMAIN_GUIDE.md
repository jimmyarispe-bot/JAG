# 06 — First Domain Guide (Education later)

**This guide explains how to build the Education domain.**  
**It does not implement Education.**

Education is only the first consumer of the Domain SDK. The same steps apply to Healthcare, Manufacturing, Government, Legal, and every other industry.

---

## 1. Preconditions

1. JAG Core is frozen ([11_CORE_STABILITY_POLICY.md](../runtime/implementation/11_CORE_STABILITY_POLICY.md)).  
2. You will **not** modify `src/lib/jag/runtime`.  
3. You will pass [DOMAIN_ADAPTER_CHECKLIST.md](../runtime/DOMAIN_ADAPTER_CHECKLIST.md).  
4. You will use `@/lib/jag/domain-sdk` only for packaging/registration.

---

## 2. Create a domain package (outside Core)

Suggested layout (example — not created in D0):

```text
src/lib/domains/education/   # or packages/domains/education
  manifest.ts
  adapter.ts
  contributors/
    context.ts
    intent.ts
    cognition.ts
    experience.ts
    action.ts
  index.ts
```

Do **not** place Education under `src/lib/jag/runtime` or `src/lib/jag/domain-sdk`.

---

## 3. Declare the manifest

Use Education-specific **ids and labels**, but the **schema is universal**:

```ts
createDomainBuilder({
  id: "education.academyos",          // example id — choose deliberately
  name: "education-academyos",
  displayName: "Education",           // NOT "JAG"
  version: "0.1.0",
  description: "Education domain intelligence package",
  owner: { name: "Education Domain Team" },
  requiredRuntimeVersion: "1.0.0-rc",
  minimumCoreVersion: "1.0.0-rc",
})
```

---

## 4. Register contributors (domain-owned)

Implement contributor interfaces from Runtime contracts:

| Contributor | Education responsibility (examples only) |
|-------------|------------------------------------------|
| Context | School / class / family context families |
| Intent | Enroll, grade, communicate candidates |
| Cognition | Domain evidence gather / recommend |
| Experience | Widgets / briefing fragments |
| Action | Mutating handlers + permission catalog |
| Evidence / Memory / Twin | Publication when ready |

Wire them with the builder:

```ts
.registerContextContributor(educationContextContributor)
.registerIntentContributor(educationIntentContributor)
.registerCognitiveContributor(educationCognitiveContributor)
.registerExperienceContributor(educationExperienceContributor)
.registerActionContributor(educationActionContributor)
.withPermission("education.enrollment.update", { actionScoped: true })
.build();
```

---

## 5. Host wiring

```ts
const runtime = createJagRuntime();
installIdentityRuntime(runtime);
installContextRuntime(runtime);
installIntentRuntime(runtime);
installCognitiveRuntime(runtime);
installExperienceRuntime(runtime);
installActionRuntime(runtime);

const sdk = createDomainSdk();
const registry = sdk.createRegistry({
  runtimeVersion: "1.0.0-rc",
  coreVersion: "1.0.0-rc",
});
registry.register(educationDomain);
registry.enable(educationDomain.manifest.id);

const lifecycle = sdk.createLifecycle({
  registrationApi: runtime.registry.asDomainAdapterApi(),
  runtimeVersion: "1.0.0-rc",
  coreVersion: "1.0.0-rc",
});
await lifecycle.install(educationDomain);
await lifecycle.initialize(educationDomain.manifest.id);
await lifecycle.activate(educationDomain.manifest.id);
```

---

## 6. Acceptance gate

Education (or any first domain) ships only when:

- [ ] Domain Adapter Checklist complete  
- [ ] SDK validation passes  
- [ ] Action gates proven (Intent + EvidenceSet)  
- [ ] No Core PR with Education business rules  
- [ ] Pack disable leaves no dangling Action contributors  

---

## 7. Explicit stop for Program D0

D0 delivers the **SDK only**.

Do not implement Education contributors, AcademyOS adapters, portals, or curriculum logic in this phase.
