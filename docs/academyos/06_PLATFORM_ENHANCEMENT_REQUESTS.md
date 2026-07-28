# Platform Enhancement Requests (PERs)

Discovered during Sprint 2.1. **Not implemented** — Foundation remains frozen.

| ID | Gap | Workaround in pack |
|----|-----|--------------------|
| PER-EI-InsightProviders | Live EI dashboard does not consume SDK `InsightProvider`s | Pack-local `buildEducationExecutiveDashboard` + Admissions Summary + registered provider |
| PER-Twin-EducationTypes | Closed `TwinEntityType` union has no Student/IEP/Enrollment | Map onto Person/Document/Event/Asset + metadata |
| PER-Root-Packages-Workspace | Optional npm workspaces for `packages/*` | Pack compiled via repo `include: **/*.ts` + path aliases |
| PER-AOS-EVENT-SOURCE | `JagEventSourceModule` has no `academyos` value | Emit with `sourceModule: "platform"` and `eventType: academyos.*` |
| PER-AOS-NAV | JAG platform nav has no AcademyOS Admissions entry | Pages at `/academyos/admissions` and `/academyos/parent` without nav edit |
| PER-TWIN-SERVICE-TYPE | Spec maps Support Service → Twin `Service`; union has `Product / Service` only | Map support services to `Product / Service` |
| PER-TWIN-CLASS-TYPE | Spec optionally treats Class as distinct Twin type | Map Class → `Product / Service` with `academyosKind=class` (Sprint 2.4) |
| PER-TWIN-ACCOUNT-TYPE | Spec maps Family Account → Account; Twin has no Account | Map Family Financial Account → Organization |
| PER-TWIN-FINANCE-TYPES | Desire first-class Invoice/Payment Twin types | Map finance artifacts → Document |
| PER-QBO-ENTITY-PUSH | QBO connector sync is report→Evidence centric; no first-class Customer/Invoice/Payment push API | Pack queues entities then calls Connector Runtime `sync()`; marks local sync records |
| PER-TWIN-EVIDENCE-TYPE | Spec maps Assessment → Evidence; Twin has no Evidence type | Map Assessment → Document (Sprint 2.5) |
| PER-TWIN-WORK-TYPE | Spec maps Intervention → Work Item; Twin has no Work Item | Map Intervention → Document + student timeline |
| PER-TWIN-WORKFORCE-ROLE | Desire first-class Role/Position Twin beyond Document | Map Position → Document (Sprint 2.7) |
| PER-MEMORY-WORKFORCE-BRIDGE | Desire native Organizational Memory API for performance reviews | Store opaque `memoryLinkId` on review metadata only |
| PER-TWIN-MESSAGING-TYPES | Desire first-class Message / Notification / Workflow Twin types | Map Notification, Message, Announcement, Workflow, Template → Document (Sprint 3.1) |
| PER-COMM-SMS-CONNECTOR | Desire first-class SMS send API on Connector Runtime | Queue SMS notifications as `Sent` with connector sync deferred |
| PER-COMM-PUSH-CHANNEL | Desire native push delivery primitives | Channel enabled as future-ready; notifications stay `Queued` |
| PER-AOS-AUTO-NOTIFY-BRIDGE | Desire automatic notification fan-out from every domain emit | RC-1 scenarios call `routeAcademyOsDomainEvent` explicitly after domain actions |
| PER-AOS-A11Y-LIVE-GATES | Desire CI-enforced axe gates on authenticated AcademyOS journeys | RC-2 documents journeys; `tests/a11y/critical-routes.spec.ts` remains persona-gated |
| PER-AOS-PERF-CI-BUDGETS | Desire platform-wide perf budget harness for pack dashboards | RC-2 records pack-local baselines; soft budgets documented in rc2/02_PERFORMANCE.md |
| PER-AOS-HOSTED-BACKUP-API | Desire Platform API for orchestrated Supabase backup/restore jobs | RC-3 documents host-managed backup workflow; `validateBackupRecovery()` checks docs only |
| PER-AOS-LIVE-TELEMETRY | Desire first-class Platform telemetry bus for API/queue latency | RC-3 monitoring uses pack-local baselines + in-process trends |
| PER-AOS-OPS-WORKER | Desire Platform background worker runtime for AcademyOS queues | Runbook treats queues as host-managed; no pack worker shipped |

Any future Platform Core change must be approved against the Platform Constitution before implementation.
