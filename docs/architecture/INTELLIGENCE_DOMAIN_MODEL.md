# Intelligence Domain Model

## Purpose

Define how intelligence domains exist inside JAG OIOS — registration, status, dependency order, and future activation.

## Canonical domain catalog

`OIOS_INTELLIGENCE_DOMAINS` in `src/lib/platform/oios/types.ts`:

### Active (shipped)

- organization-dna
- organization-health
- financial
- founder
- executive
- executive-graph
- executive-decision
- predictive
- board-governance

### Registered (future)

- human-capital
- revenue
- funding
- opportunity
- operations
- customer
- knowledge
- document
- legal
- compliance
- risk
- market
- innovation
- impact

## Domain descriptor

```ts
interface DomainDescriptor {
  domain: OiosIntelligenceDomain;
  status: "registered" | "active" | "dormant" | "deprecated";
  dependencies: OiosIntelligenceDomain[];
  priority: number;
  description: string;
}
```

## Registry API

`IntelligenceDomainRegistry` (OIOS package):

- `register(descriptor)`
- `get(domain)` / `list()`
- `activate(domain)` / `deactivate(domain)`
- `resolveOrder(domains?)` — dependency-respecting order

Note: this is distinct from the cognitive `IntelligenceDomainRegistry` in `intelligence/registry.ts` (success/executive/strategic/decision routing). OIOS registry is the product-domain catalog. Exported from intelligence as `OiosIntelligenceDomainRegistry`.

## Dependency rules

1. Domains declare dependencies by domain id only.
2. Platform module DAG must agree with OIOS registry intent.
3. Future domains should depend on `organization-dna` and typically consume `oios` context.
4. Domains must not import sibling domain implementations.

## Future domain registration model

1. Keep the domain key in `OIOS_INTELLIGENCE_DOMAINS` (already reserved for listed futures).
2. Implement package + platform adapter.
3. Activate status from `registered` → `active`.
4. Add module id to `INTELLIGENCE_MODULE_IDS` and default provider order.
5. Extend verification tests for new pipeline position.
