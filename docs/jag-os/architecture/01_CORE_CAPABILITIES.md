# 01 — JAG Core Capabilities

**Phase Ω-0** · Classification: **JAG CORE**  
**Authority:** [00_CANONICAL_ARCHITECTURE.md](./00_CANONICAL_ARCHITECTURE.md)

Universal capabilities shared by every organization. Constitutional review answers for this layer are typically: Core=YES · Outside education=YES · Domain-specific=NO · Presentation-only=NO · Violate=NO (unless duplicate/bleed noted).

---

## A. Canonical engine packages (`packages/platform/`)

| Package | Location | Purpose | Dependencies | Consumers | Classification | Reasoning | Violations | Future state |
|---------|----------|---------|--------------|-----------|----------------|-----------|------------|--------------|
| FinanceEngine (+ Treasury, Reconciliation, Revenue, Payables, Reporting, Planning) | `packages/platform/finance` | Multi-entity ledger & financial ops | Identity, Org | CFO, Finance UX, Education billing adapters | **JAG CORE** | Universal finance | Parallel stacks in `src/lib/platform/finance`, `src/lib/finance*` | Single owner: this package |
| ChiefFinancialOfficerEngine | `packages/platform/cfo` | Financial reasoning (EBITDA, runway, board, scenarios) | FinanceEngine | Exec context, APIs `/api/cfo` | **JAG CORE** | Universal CFO intelligence | Overlap with `financial-intelligence` | Soft-read FinanceEngine only |
| KnowledgeEngine | `packages/platform/knowledge` | Documents, OCR, evidence, KG, search | Identity, Org | All domains, Studio | **JAG CORE** | Universal knowledge | Parallel Studio KG, `lib/platform/knowledge-graph` | One KnowledgeEngine |
| OrganizationEngine / UOM | `packages/platform/organization` | Universal org, constitution, strategy, performance | — | All domains, Mr. JAG | **JAG CORE** | Law 9 sacred | Fragmented `lib/platform/organizations*` | Consolidate org services here |
| InnovationEngine | `packages/platform/innovation` | Opportunity portfolio / roadmaps | Signals, Org | Exec innovation context | **JAG CORE** | Cross-industry | Dual home `lib/platform/innovation` | Package is canonical |
| EvolutionEngine | `packages/platform/evolution` | Continuous improvement proposals | Repo evidence | Platform stewardship | **JAG CORE** | Platform evolution | — | Keep as Core |
| Mr. JAG™ | `packages/platform/mr-jag` | Help / Coach / Tutorials / Walkthroughs | Knowledge, Org | All contexts | **JAG CORE** *(composition-facing)* | Universal guide | Often used as product surface | Remain Core; UI via Orchestrator |

**Note:** `packages/platform/learning-intelligence` is a **facade** over Education learning SoR → classified under Domain (see 02), not Core SoR.

---

## B. JAG OS kernel & frameworks (`src/jag/`)

| Module | Location | Purpose | Classification | Reasoning | Future state |
|--------|----------|---------|----------------|-----------|--------------|
| Runtime / Kernel / Packages | `src/jag/runtime`, `kernel`, `packages` | Boot, package host, service resolve | **JAG CORE** | OS kernel | Keep |
| Canonical owners | `src/jag/canonical` | Single-owner registry | **JAG CORE** | Anti-duplication | Expand with Ω classifications |
| SDK / Blueprint / Modeling | `src/jag/sdk`, `blueprint-framework`, `blueprints`, `modeling` | Extension & config | **JAG CORE** | Configure, don’t fork | Keep |
| Capability packs / Marketplace / Runtime generation | `capability-packs`, `marketplace`, `runtime-generation`, `runtime-lifecycle` | Pack enablement | **JAG CORE** | Universal packaging | Keep |
| Organization Studio | `src/jag/studio` | Answers → org blueprint | **JAG CORE** | Distinct from `packages/studio` | Keep naming clear |
| Schema / Entities / Forms / Workflows / API / Graph | `src/jag/schema`, `entities`, `forms`, `workflows`, `api`, `graph` | Framework ownership | **JAG CORE** | Shared frameworks | Align with `lib/platform/*` owners |
| Processes / Decisions / Documents / Communications | `src/jag/processes`, `decisions`, `documents`, `communications` | Universal runtimes | **JAG CORE** | Canonical engines | Prefer these over legacy duplicates |
| Intelligence contracts | `src/jag/intelligence` | EI contracts, evidence graph, providers | **JAG CORE** | OS intelligence bus | Orchestrator consumes |
| Identity / Navigation / Diagnostics / Infrastructure | matching folders | OS concerns | **JAG CORE** | Universal | Keep |
| Experience shell port | `src/jag/experience` | Shell ownership | **EXPERIENCE COMPOSITION** | Presentation | Feed Orchestrator |

---

## C. Declarative capability packs (`src/packages/` — non-industry)

| Pack | Location | Purpose | Classification |
|------|----------|---------|----------------|
| identity.core | `src/packages/identity` | Identity capability pack | **JAG CORE** |
| work.core | `src/packages/work` | Work capability pack | **JAG CORE** |
| documents.core | `src/packages/documents` | Documents pack | **JAG CORE** |
| communications.core | `src/packages/communications` | Communications pack | **JAG CORE** |
| decision.core | `src/packages/decision` | Decision pack | **JAG CORE** |
| analytics.core | `src/packages/analytics` | Analytics pack | **JAG CORE** |
| policy.core | `src/packages/policy` | Policy pack | **JAG CORE** |
| reporting.core | `src/packages/reporting` | Reporting pack | **JAG CORE** |
| scheduling.core | `src/packages/scheduling` | Universal scheduling primitives | **JAG CORE** |

---

## D. Platform implementation home (`src/lib/platform/` — Core candidates)

| Area | Paths (representative) | Purpose | Classification | Violations / notes |
|------|------------------------|---------|----------------|--------------------|
| Identity / Auth / IAM | `identity`, `authentication`, `auth-email`, `iam` | AuthZ/AuthN | **JAG CORE** | — |
| Organizations | `organizations`, `organization-platform`, `jag-organization`, `hierarchy` | Tenancy / org tree | **JAG CORE** | Fragmented vs `@organization` |
| Workflows / Forms / Schema / Entities / API / SDK | `workflows`, `workflow`, `forms`, `schema`, `entities`, `api`, `sdk` | Frameworks | **JAG CORE** | Dual workflow trees |
| Notifications / Email / Events / Activity | `notifications`, `email`, `events`, `activity` | Messaging primitives | **JAG CORE** | Parallel edu comms |
| Digital Twin (platform) | `digital-twin` | Twin domains | **JAG CORE** | Also `src/lib/digital-twin` |
| Evidence | `evidence` | Evidence primitives | **JAG CORE** | Also `evidence-center` |
| Graph / KG | `graph`, `knowledge-graph`, `intelligence-graph`, `executive-graph` | Graphs | **JAG CORE** | Multiple KG stacks |
| Finance / Accounting (lib) | `finance`, `accounting` | Enterprise FI | **JAG CORE** *(duplicate)* | Must converge to `packages/platform/finance` |
| Automation / Rules / Integrations / Marketplace | `automation`, `rules`, `integrations`, `marketplace`, `imports` | Platform ops | **JAG CORE** | Some edu catalog bleed |
| CRUD / Release / Readiness / Diagnostics / Env | `crud`, `release`, `readiness`, `diagnostics`, `env`, `persistence` | Gates & ops | **JAG CORE** | — |
| Execution / Autonomy / Governance | `execution`, `execution-engine`, `operational-loop`, `autonomy`, `governance` | Operating loops | **JAG CORE** | — |
| JAG work / collab | `jag`, `jag-work` | Multi-agent / work model | **JAG CORE** | — |
| Decisions queue | `decisions` | Decision queue UX data | **JAG CORE** | Distinct from Decision engine |

---

## E. Adjacent Core services (`src/lib/`)

| Module | Location | Purpose | Classification | Notes |
|--------|----------|---------|----------------|-------|
| Memory | `src/lib/memory` | Organizational Memory | **JAG CORE** | Law 7 evidence chain |
| Digital Twin (lib) | `src/lib/digital-twin` | Twin registry/timeline | **JAG CORE** | Unify with platform twin |
| Evidence Center | `src/lib/evidence-center` | Catalog, pipeline, KG sync | **JAG CORE** | — |
| Connectors | `src/lib/connectors` | Connector framework | **JAG CORE** | Domain connectors in packs |
| Goals / Risk / Work | `src/lib/goals`, `risk`, `work` | Universal ops objects | **JAG CORE** | — |
| Finance platform | `src/lib/finance-platform` | Invoices/payments/plans APIs | **JAG CORE** *(candidate)* | Align with FinanceEngine |
| Financial intelligence | `src/lib/financial-intelligence` | Profitability / FI analytics | **JAG CORE** *(CFO-adjacent)* | Soft-read only |
| HR platform | `src/lib/hr-platform` | Broader HR lifecycle | **JAG CORE** *(candidate)* | Separate edu `hr` UX |
| Executive intelligence services | `src/lib/executive-intelligence` | Insights/alerts/briefs data | **JAG CORE** *(candidate)* | Not a portal product |
| Founder intelligence | `src/lib/founder-intelligence` | Founder brief services | **JAG CORE** *(candidate)* | Overlaps platform founder |
| Platform SDK | `src/lib/platform-sdk` | SDK helpers | **JAG CORE** | — |
| Jag-platform / Jag-business | `src/lib/jag-platform`, `jag-business` | Platform APIs helpers | **JAG CORE** | — |

---

## F. Product / engineering Studio (`packages/studio/`)

| Area | Purpose | Classification |
|------|---------|----------------|
| architecture, repository, catalog, graph, knowledge, dependencies, impact | Repo & architecture intelligence | **JAG CORE** |
| policies, governance, certification, quality, products, release*, per | Release & governance | **JAG CORE** |
| recommendations, search, insights, documentation, decision-center, workspaces | Studio UX composition | **EXPERIENCE COMPOSITION** *(Studio product)* |
| integrations (AcademyOS RC3) | Bridge | Domain bridge (see 02) |

---

## G. APIs that expose Core (`src/app/api/`)

Representative Core API families: `/api/cfo`, `/api/finance`, `/api/knowledge`, `/api/organization`, `/api/innovation`, `/api/evolution`, `/api/mr-jag`, `/api/jag-platform`, `/api/work`, `/api/studio`, `/api/platform`, `/api/observability`.

---

## H. Future Core (not implemented — reserved)

| Capability | Status |
|------------|--------|
| **Experience Orchestrator™** | Spec only — [03_EXPERIENCE_COMPOSITION.md](./03_EXPERIENCE_COMPOSITION.md) |
| Shared Notification Engine consolidation | Planned (consolidation 07) |
| Single Reporting execution engine | Planned |

---

## Constitutional review (layer summary)

| # | Question | Answer |
|---|----------|--------|
| 1 | Belong in JAG Core? | **YES** for items in this document |
| 2 | Benefit orgs outside education? | **YES** |
| 3 | Domain-specific? | **NO** (if YES, move to 02) |
| 4 | Presentation only? | **NO** (engines/frameworks) |
| 5 | Violate Constitution? | **NO** for ownership; **YES** where duplicates/bleed listed → see [05](./05_CONSTITUTIONAL_VIOLATIONS.md) |
| 6 | Duplicate another capability? | **YES** in several finance/twin/KG/comms/org trees — documented, not fixed in Ω-0 |
