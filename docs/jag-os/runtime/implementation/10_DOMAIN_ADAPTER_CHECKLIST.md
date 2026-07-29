# 10 — Domain Adapter Checklist (Implementation)

**Phase Ω-7B**  
**Canonical checklist:** [../DOMAIN_ADAPTER_CHECKLIST.md](../DOMAIN_ADAPTER_CHECKLIST.md)

This file is the implementation-index entry for the mandatory domain adapter gate.  
Use the canonical checklist for all acceptance reviews.

---

## Code contracts

| Artifact | Path |
|----------|------|
| Domain adapter + registration API | `src/lib/jag/runtime/adapters/domain-adapter.ts` |
| Contributor type aliases / publication contracts | `src/lib/jag/runtime/adapters/contributors.ts` |
| Registry contributor APIs | `src/lib/jag/runtime/registry/registry.ts` |
| `asDomainAdapterApi()` | `RuntimeRegistry.asDomainAdapterApi()` |

---

## Host wiring (outside Core domain logic)

1. `createJagRuntime()`  
2. `installIdentityRuntime` … `installActionRuntime` as needed  
3. `await adapter.register(runtime.registry.asDomainAdapterApi())`  
4. `runtime.run({ … })`  

Mutating packs **must** install Action Runtime. There is no legacy Action provider fallback.

---

## Reviewer shortcut

- [ ] Checklist §1–§8 complete  
- [ ] No Core domain imports  
- [ ] Action gates green in tests  
- [ ] Contributor-only registration  
- [ ] Stability policy respected ([11_CORE_STABILITY_POLICY.md](./11_CORE_STABILITY_POLICY.md))
