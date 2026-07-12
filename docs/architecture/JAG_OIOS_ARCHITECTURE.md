# JAG OIOS Architecture

## Purpose

Define the permanent **JAG Organizational Intelligence Operating System (OIOS)** — the architecture every future intelligence domain, AI agent, workflow, and application must follow.

Package: `src/lib/platform/oios/`  
DI: `createOiosOperatingSystem()` → `createIntelligenceService().oios`  
Platform module: `oios-core`

## Design principle

Compose upward. Do not regenerate Sprint 021–030 packages. New domains register into OIOS; they do not fork the operating system.

## Domain model

```
Organizational DNA (genotype)
        ↓
OIOS Core (operating system)
  ├── Domain Registry
  ├── Digital Twin
  ├── State / Lifecycle / Context
  ├── Memory / Knowledge Graph
  ├── Health / Maturity / Scorecard
  ├── Strategy / Execution / Operating Model
  ├── Improvement Loop
  └── Governance (policies, standards, configuration)
        ↓
Intelligence Domains (applications)
```

## Dependency rules

1. `types.ts` and `contracts.ts` are leaf modules (no implementation imports).
2. OIOS may import **types** from Organizational DNA; DNA must never import OIOS.
3. Platform adapters may import OIOS + DNA; product packages must not import platform adapters.
4. Future domains depend on OIOS contracts/types — never on sibling domain implementations.
5. No circular imports across `oios` ↔ `intelligence/*` product packages.

## Module standards

Every intelligence domain package must provide:

| Surface | Requirement |
|---------|-------------|
| `types.ts` | Version const, DTOs, enums |
| `contracts.ts` | Leaf interfaces + dependencies bag |
| `models.ts` | Pure helpers |
| `index.ts` | Public API + `create{Domain}Intelligence()` |
| Platform adapter | `create{Domain}Module()` in `infrastructure/modules/` |
| README + CHANGELOG | Sprint attribution |

## Coding conventions

- Path alias: `@/lib/platform/oios/...`
- Factory: `createOiosOperatingSystem(options?)`
- Stack: `OiosStack { service, engine, registry, operatingSystem, organizationDna }`
- Deterministic tests via injectable `now` / `createId`
- Never use `any`; use `Record<string, unknown>` / typed DTOs

## Public APIs

```ts
createOiosOperatingSystem(options?) → OiosStack
stack.operatingSystem.bootstrap(scope?)
stack.service.build(request) → OiosResult
stack.service.query(result, request) → OiosQueryResult
stack.registry.register / activate / resolveOrder
```

Attached on intelligence service:

```ts
createIntelligenceService().oios
```

Platform context key: `oios`

## Extension model

1. Add domain package under `src/lib/platform/intelligence/{domain}/`
2. Register descriptor in OIOS domain catalog (or activate at runtime)
3. Add platform module adapter + dependency edges
4. Wire optionally through `createIntelligenceService`
5. Document in sprint + verification docs

See [`FUTURE_SPRINT_GUIDELINES.md`](./FUTURE_SPRINT_GUIDELINES.md).

## AI Agent architecture

Agents consume OIOS context (twin, state, memory, knowledge, scorecard) rather than scraping domain internals. See [`AI_AGENT_ARCHITECTURE.md`](./AI_AGENT_ARCHITECTURE.md).

## Organizational DNA integration

OIOS enriches from DNA via:

- `request.dnaResult` / `request.dna` / `request.dnaSeed`
- Optional `organizationDnaStack` on DI factory
- Platform pipeline: `organization-dna` → `oios-core`

## Digital Twin / Improvement / Lifecycle

See dedicated docs:

- [`DIGITAL_TWIN_ARCHITECTURE.md`](./DIGITAL_TWIN_ARCHITECTURE.md)
- [`ORGANIZATIONAL_LIFECYCLE.md`](./ORGANIZATIONAL_LIFECYCLE.md)
- Improvement loop stages: assess → prioritize → plan → execute → measure → learn

## Pipeline position

```
organization-dna → oios-core → human-capital → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive → board-governance
```
