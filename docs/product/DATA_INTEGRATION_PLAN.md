# Enterprise Data Integration Architecture

**Product:** JAG Organizational Intelligence Operating System (OIOS)  
**Phase:** B2 — Productization  
**Status:** Specification complete (documentation only)  
**Depends on:** JAG v1.0 intelligence graph (`INTELLIGENCE_MODULE_IDS`), [EXECUTIVE_COMMAND_CENTER_SPEC.md](./EXECUTIVE_COMMAND_CENTER_SPEC.md)  
**Constraint:** Documentation only. No runtime code, UI, connector implementations, or API changes.

---

## Design Principles

1. **JAG is an intelligence platform**, not a system of record.  
2. **External systems remain authoritative** for accounting, HRIS, SIS, CRM, email, and banking.  
3. **JAG synchronizes** selected objects into a normalized cache for reasoning.  
4. **JAG enriches** with scores, confidence, provenance, and soft-domain synthesis.  
5. **JAG reasons** via the 39-domain pipeline and cognitive modules (`createIntelligenceService()`).  
6. **JAG never replaces** QuickBooks, Workday, PowerSchool, Salesforce, Gmail, etc.  
7. **Write-backs are explicit, rare, and permissioned** (e.g., create a CRM task) — default mode is read/sync.  
8. **Baseline / synthetic intelligence** is labeled until live connectors replace inputs (per ECC empty-state rules).  
9. **Scope always includes** `organizationId` (+ optional `schoolId`) matching intelligence `GraphScope`.  
10. **Provenance is mandatory:** every derived insight cites source system, object id, sync timestamp, and confidence.

---

## Section 1 — Integration Architecture

### 1.1 Integration philosophy

```
Source systems (SoR)
        |  OAuth / API key / SFTP / webhook / file drop
        v
+-------------------+
|  Connector plane  |  Auth, rate limits, pagination, cursors
+---------+---------+
          v
+-------------------+
| Synchronization   |  Schedules, events, retries, DLQ
+---------+---------+
          v
+-------------------+
| Normalization     |  Canonical entities + lineage
+---------+---------+
          v
+-------------------+
| Intelligence feed |  Baseline overrides / light DTOs / run requests
+---------+---------+
          v
+-------------------+
| OIOS pipeline     |  39 domains -> wisdom (+ cognitive)
+---------+---------+
          v
+-------------------+
| Executive insights|  Command Center widgets / Brief / Ask JAG
+---------+---------+
          v
+-------------------+
| Audit & compliance|  Access logs, sync logs, retention
+-------------------+
```

### 1.2 Layers (fixed)

| Layer | Responsibility | Owns data? |
|-------|----------------|------------|
| Source systems | Authoritative CRUD | **Yes (SoR)** |
| Connector plane | Auth, fetch, push (rare), vendor quirks | No |
| Sync plane | Jobs, cursors, idempotency, DLQ | Sync metadata |
| Normalization | Canonical models + field maps | JAG cache (derived) |
| Intelligence feed | Maps canonical to domain baselines / soft lights | Derived |
| Intelligence runtime | Domain engines (frozen packages) | Assessment results (product persistence TBD) |
| Executive product | ECC screens, actions, notifications | Product UX state |
| Audit | Who/what/when for sync + access | Audit store |

### 1.3 Architecture diagram (logical)

```
     +--------------+  +--------------+  +--------------+
     | Finance/ERP  |  | Banking/Plaid|  | CRM / SIS    |
     +------+-------+  +------+-------+  +------+-------+
     +------+-------+  +------+-------+  +------+-------+
     | HRIS/Payroll |  | M365/Google  |  | Docs/Comms   |
     +------+-------+  +------+-------+  +------+-------+
            |                 |                 |
            +--------+--------+--------+--------+
                     v
          +------------------------+
          |   Connector Registry   |
          | (per org, per vendor)  |
          +-----------+------------+
                      v
          +------------------------+
          |  Sync Orchestrator     |
          |  realtime|cron|manual  |
          +-----------+------------+
                      |
       +--------------+--------------+
       v              v              v
 Canonical Finance  People       Customer
 Canonical Ops      Documents    Comms
       |              |              |
       +--------------+--------------+
                      v
          +------------------------+
          | Intelligence Adapters  |
          | -> baselines / lights  |
          +-----------+------------+
                      v
          +------------------------+
          | createIntelligenceService
          | 39-domain pipeline     |
          +-----------+------------+
                      v
          +------------------------+
          | Executive Command Center
          +------------------------+
```

### 1.4 Audit logging (minimum fields)

Every sync and every insight access records:

`org_id`, `school_id?`, `actor_user_id?`, `connector_id`, `vendor`, `operation`, `object_type`, `object_id`, `direction` (in/out), `status`, `error_code?`, `started_at`, `finished_at`, `correlation_id`, `pii_classification`.

---

## Section 2 — Financial Systems

### 2.1 Supported platforms

| Platform | Mode | Phase |
|----------|------|-------|
| QuickBooks Online | API | Phase 1 |
| QuickBooks Desktop | Web Connector / export bridge | Phase 2 |
| Xero | API | Phase 1 |
| NetSuite | REST/SuiteQL | Phase 2 |
| Sage (Intacct / 50) | API / file | Phase 2-3 |
| Dynamics 365 Finance | API | Phase 2 |
| SAP (S/4 / B1) | API / IDoc bridge | Phase 3 |
| Oracle Fusion | API | Phase 3 |
| Bank feeds (via Section 3) | Linked | Phase 1 |
| Credit cards | Via bank/Plaid or ERP expense | Phase 1-2 |
| Payroll (GL impact) | Via HRIS Section 5 + journal sync | Phase 1-2 |
| AP / AR | ERP objects | Phase 1 |
| Budgeting / Forecasting | ERP plans + JAG predictive | Phase 2 |

### 2.2 Per-platform pattern (applies to each)

| Concern | Spec |
|---------|------|
| **Authentication** | OAuth 2.0 (QBO, Xero, Dynamics); Token/service account (NetSuite); Desktop connector cert + local agent (QBD); SFTP/API key where vendor requires |
| **Objects synchronized** | Chart of accounts, journal entries / transactions, invoices (AR), bills (AP), payments, vendors, customers (AR), employees (payroll mapping), budgets, classes/locations/departments, attachments metadata |
| **Frequency** | Incremental every 15-60 min (Phase 1); near-real-time webhooks where available (Phase 2); nightly full reconcile |
| **Conflict handling** | Source wins for financial amounts; JAG never overwrites SoR balances; duplicate detection by vendor id + hash; manual reconcile queue for mismatches |
| **Intelligence domains** | `financial`, `revenue`, `funding`, `operations`, `business-model`, `predictive`, `board-governance` (packets/KPIs), `economic` (context) |

### 2.3 Canonical finance objects (normalized)

`Account`, `JournalLine`, `Invoice`, `Bill`, `Payment`, `Vendor`, `FinanceCustomer`, `BudgetLine`, `CashPosition`, `PayrollJournalSummary`.

### 2.4 Write-back policy

Default **read-only**. Allowed write-backs (explicit feature flags): create draft bill/expense note, attach JAG-generated memo — never silent GL mutation.

---

## Section 3 — Banking

### 3.1 Supported channels

| Channel | Use | Phase |
|---------|-----|-------|
| Plaid | Balances, transactions, auth | Phase 1 |
| Stripe Treasury / Stripe balance | Merchant / treasury | Phase 1-2 |
| Direct OFX / QFX | File import | Phase 1 |
| CSV bank export | Manual / SFTP | Phase 1 |
| Bank APIs (open banking) | Region-specific | Phase 2-3 |
| Wire history | Via bank/ERP | Phase 2 |
| Credit facilities / loans | Via bank + ERP notes | Phase 2 |
| Merchant accounts | Stripe/processors | Phase 1-2 |

### 3.2 Objects and sync

| Object | Fields (min) | Frequency |
|--------|--------------|-----------|
| Account | id, name, type, currency, balance | 15-60 min |
| Transaction | id, posted_at, amount, memo, category?, counterparty? | 15-60 min |
| Credit facility | limit, drawn, rate, maturity | Daily |
| Loan | principal, payment schedule | Daily |

**Auth:** Plaid Link OAuth; Stripe restricted keys; OFX credentials in secrets vault; CSV via authenticated upload.

**Conflict handling:** Bank feed is SoR for cash movements; ERP reconciliation differences go to `recon_exception` queue.

**Intelligence domains:** `financial`, `funding` (runway/cash), `revenue` (merchant), `predictive`, `resilience` (liquidity stress).

---

## Section 4 — CRM

### 4.1 Supported platforms

Salesforce, HubSpot, Pipedrive, Zoho CRM, Microsoft Dynamics CRM, Custom CRM (webhook + CSV + generic REST adapter).

### 4.2 Objects synchronized

Leads, Contacts, Accounts/Organizations, Deals/Opportunities, Stages, Activities (calls/emails/meetings), Campaigns, Revenue pipeline forecasts (vendor-native).

### 4.3 Sync profile

| Concern | Spec |
|---------|------|
| Auth | OAuth 2.0 (Salesforce, HubSpot, Dynamics); API key (some Zoho/Pipedrive) |
| Frequency | Webhooks + 15 min incremental; nightly full |
| Conflicts | CRM wins for pipeline fields; JAG annotations stored as external note/task only if write-back enabled |
| Intelligence | `customer`, `revenue`, `market`, `opportunity`, `competitive`, `stakeholder`, `reputation` |

### 4.4 Canonical CRM objects

`Lead`, `Person`, `AccountOrg`, `Deal`, `Activity`, `PipelineStage`.

---

## Section 5 — HR / HRIS / Payroll

### 5.1 Supported platforms

BambooHR, ADP, Paychex, Gusto, Rippling, Workday, UKG.

### 5.2 Objects synchronized

Employees, contractors, org chart / reporting lines, compensation bands (scoped), job titles, locations, hire/term dates, performance review summaries (aggregated where PII policy requires), benefits enrollment flags, open requisitions, time-off balances (optional).

### 5.3 Sync profile

| Concern | Spec |
|---------|------|
| Auth | OAuth / API key / SCIM where offered |
| Frequency | Daily full for roster; hourly incremental for changes; payroll summaries post-pay-run |
| Conflicts | HRIS wins for employment status; JAG never becomes payroll SoR |
| PII | Strong classification; field-level redaction by role (ECC Section 17) |
| Intelligence | `human-capital`, `behavioral`, `cultural`, `operations`, `financial` (labor cost), `ethical` |

### 5.4 Canonical HR objects

`Worker`, `Position`, `OrgEdge`, `CompensationSummary`, `Requisition`, `LeaveBalance`, `PerfSignal` (aggregated).

---

## Section 6 — Education (SIS / LMS / School ops)

### 6.1 Supported platforms

AcademyOS (first-party preference), PowerSchool, FACTS, Blackbaud, Canvas, Google Classroom, Schoology.

### 6.2 Objects synchronized

Students, guardians/families, enrollment/registration, attendance, grades/transcripts summaries, courses/sections, schedules, scholarships/aid, IEPs/504 metadata (highly restricted), staff-section assignments, tuition invoices (if SIS-linked).

### 6.3 Sync profile

| Concern | Spec |
|---------|------|
| Auth | OAuth / district API keys / OneRoster / Ed-Fi where available |
| Frequency | Nightly roster; attendance near-daily; grades weekly or term-bound |
| Conflicts | SIS wins for enrollment; LMS wins for assignment completion |
| Compliance | **FERPA** minimization; directory vs confidential data split |
| Intelligence | `customer` (student/family journey), `operations`, `human-capital` (staffing), `funding` (aid), `impact`, `document` |

### 6.4 Canonical education objects

`Learner`, `Guardian`, `Enrollment`, `AttendanceFact`, `CourseSection`, `GradeSummary`, `AidAward`, `SupportPlanRef` (pointer only).

---

## Section 7 — Productivity

### 7.1 Platforms

Google Workspace, Microsoft 365 — Email, Calendar, Drive/OneDrive, Teams, Slack, Zoom, Google Meet.

### 7.2 Objects synchronized

| Object | Notes |
|--------|-------|
| Mail metadata | Subject, participants, timestamps — **body optional / policy-gated** |
| Calendar events | Title, attendees, time, location |
| Files metadata | Name, path, owner, modified, ACL summary |
| Chat channels | Channel id, members (not full history by default) |
| Meeting artifacts | Recording links / transcripts if org enables |

**Auth:** OAuth admin consent (Workspace / Entra ID).  
**Frequency:** Calendar 15 min; Drive metadata hourly; mail metadata policy-dependent.  
**Intelligence:** `document`, `knowledge`, `institutional-memory`, `stakeholder`, `operations`, Ask JAG citations.

**Hard rule:** No silent full mailbox body ingest without explicit org policy + DLP review.

---

## Section 8 — Documents

### 8.1 Stores

Google Drive, SharePoint, Dropbox, Box, OneDrive, plus direct PDF upload.

### 8.2 Document classes (normalized)

Policies, Contracts, Board minutes, Strategic plans, Financial statements, Accreditation evidence, HR policies, Safety plans.

### 8.3 Sync profile

| Concern | Spec |
|---------|------|
| Auth | OAuth / service account with least privilege folders |
| Objects | File metadata + selected content extract (PDF/DOCX) |
| Frequency | Webhook on change + nightly crawl of approved folders |
| Versioning | Keep content hash + version id; prior extracts archived |
| Intelligence | `document`, `knowledge`, `legal-compliance-risk`, `board-governance`, `wisdom` evidence |

---

## Section 9 — Communications

| Channel | Ingest | Intelligence |
|---------|--------|--------------|
| Email | Metadata +/- body (policy) | stakeholder, reputation, customer |
| Slack / Teams | Channel metadata; optional message windows | collective, cultural, operations |
| SMS | Via Twilio/provider webhooks (opt-in) | customer, operations |
| Phone systems | CDR summaries | operations, customer |
| Support tickets | Zendesk/Intercom/ServiceNow | customer, operations, reputation |

**Conflict:** Ticket system remains SoR; JAG stores normalized `Ticket` + SLA signals.

---

## Section 10 — Operational Systems

| System class | Examples | Canonical objects | Domains |
|--------------|----------|-------------------|---------|
| ERP (non-finance modules) | NetSuite ops, SAP MM | Item, WO, PO | operations, financial |
| Inventory | Lightspeed, Fishbowl | SKU, stock level | operations |
| Facilities / CMMS | SchoolDude, UpKeep | WorkOrder, Asset | operations, environmental, resilience |
| Fleet | Samsara, Geotab | Vehicle, trip | operations, environmental |
| Scheduling | When I Work, ADP sched | Shift | human-capital, operations |
| POS | Square, Clover | Tender, sale | revenue, financial |
| Time tracking | TSheets, Clockify | TimeEntry | human-capital, financial |
| Asset management | Snipe-IT, ServiceNow AM | Asset | operations, systems |

**Sync:** Daily + event hooks for critical stockouts.  
**Intelligence:** `operations`, `systems`, `resilience`, `environmental`, `revenue`.

---

## Section 11 — Government and Public Data

| Source | Data | Cadence | Domains |
|--------|------|---------|---------|
| IRS / Exempt Org | Nonprofit filings (public) | Monthly/quarterly | funding, impact, reputation |
| Census | Demographics | Annual / ACS | market, economic, customer |
| BLS | Labor stats | Monthly | economic, human-capital |
| FRED | Macro series | Daily/weekly | economic, predictive |
| NOAA | Weather / climate | Daily | environmental, resilience |
| SEC | Public company filings | As published | competitive, economic, financial |
| State education agencies | Accountability / enrollment | Term/annual | customer, impact, political |
| Grant portals (Grants.gov, foundations) | Opportunities | Daily | funding, opportunity |
| Legislation trackers | Bills / regs | Daily | political, legal-compliance-risk |
| Economic indicators (composite) | Derived | Daily | economic, predictive |

**Auth:** Public APIs / registered keys; no PII expected (except restricted education datasets — avoid unless agreement in place).

**Conflict:** Public data never overrides org SoR; used as **context lights** only.

---

## Section 12 — AI Sources

| Provider | Role | Phase |
|----------|------|-------|
| OpenAI | LLM reasoning assist for Ask JAG / Brief prose | Phase 1 |
| Azure OpenAI | Enterprise residency option | Phase 1 |
| Anthropic | Alternate LLM | Phase 2 |
| Google (Gemini / Vertex) | Alternate LLM + embeddings | Phase 2 |
| Local / VPC models | Air-gapped pilots | Phase 3 / Future |
| Embeddings + vector search | Knowledge retrieval | Phase 1 |
| Knowledge graph | Entity links across canonical objects | Phase 2 |

**Rules**

- LLMs **do not** invent financial facts; they narrate grounded citations from sync + intelligence results.  
- Prompts include org scope + confidence + "baseline vs live" flags.  
- Embeddings index normalized documents + approved knowledge articles — not raw payroll files by default.

**Intelligence touchpoints:** Ask JAG, Brief composition, `knowledge`, `document`, `wisdom` narration (scores still from domain engines).

---

## Section 13 — Storage Strategy

### 13.1 Per data class

| Data type | Source of truth | Local cache | Historical archive | Retention (default) | Versioning | Encryption | Backups | Audit trail |
|-----------|-----------------|-------------|--------------------|---------------------|------------|------------|---------|-------------|
| GL / ERP transactions | ERP | Normalized rows + cursor | Monthly cold archive | 7 years (configurable) | By vendor id + hash | AES-256 at rest | Daily | Sync + access |
| Bank transactions | Bank/Plaid | Normalized | 7 years | Same | Hash | Same | Daily | Sync |
| CRM deals | CRM | Normalized | 3-7 years | Stage history | Vendor id | Same | Daily | Sync |
| HR roster | HRIS | Normalized (minimized) | Employment tenure + 7y after term (policy) | Point-in-time snapshots | Worker id | Same + field ACL | Daily | Sync + access |
| Student PII | SIS | Minimized store | Per FERPA policy | Strict | Learner id | Same + stricter ACL | Daily | Sync + access |
| Documents | Drive/SharePoint | Metadata + extract | Content versions | Hash/version | Same | Daily | Sync + access |
| Comms metadata | Mail/Chat | Metadata store | 1-3 years | Event id | Same | Daily | Sync |
| Public stats | Agency | Series store | Indefinite series | Observation date | Same | Weekly | Sync |
| Intelligence results | JAG engines | Product result store (target) | Assessment history | requestId | Same | Daily | Access |
| Actions / notifications | JAG product | Product DB | 3-7 years | State machine | Same | Daily | Access |
| Embeddings | JAG | Vector index | Rebuildable | Chunk id | Same | Rebuild | Rebuild log |
| Secrets | Vault | Never in app DB | N/A | Rotate | Vault encryption | Vault HA | Secret access log |

### 13.2 Data ownership model

| Party | Owns | May copy |
|-------|------|----------|
| Customer org | All SoR data | Grants JAG sync license |
| Vendor | APIs / uptime | — |
| JAG | Connectors, canonical schemas, enrichment, assessments, product UX state | Deletes/exports on contract end |

---

## Section 14 — Synchronization

### 14.1 Modes

| Mode | When used |
|------|-----------|
| Real-time / webhook | CRM stage changes, ticket create, Drive file update, Plaid transaction (where available) |
| Scheduled | Finance incremental (15-60m), HR daily, SIS nightly, public data daily |
| Manual | First connect backfill, support replay, CSV upload |
| Event-driven internal | Action completed -> learning loop; Brief schedule |

### 14.2 Reliability

| Mechanism | Spec |
|-----------|------|
| Retry | Exponential backoff with jitter; max attempts per policy |
| Idempotency | Upsert by `(connector_id, object_type, external_id)` |
| Cursoring | Opaque vendor cursor stored per stream |
| Dead-letter queue | Failed batches after max retries; operator UI; no silent drop |
| Poison messages | Quarantine + alert; do not block whole connector |
| Monitoring | Lag, error rate, backlog depth, last success per stream |
| Backfill | Windowed historical import with rate-limit budget |
| Partial failure | Stream-level isolation (AR can fail without blocking banking) |

### 14.3 Sync architecture diagram

```
Webhook/Cron/Manual
        |
        v
  Sync Orchestrator --> Lease job --> Connector.fetch(cursor)
        |                                  |
        |                                  v
        |                           Normalize + validate
        |                                  |
        |                                  v
        |                           Upsert canonical store
        |                                  |
        +-------- success -----------------+ update cursor
        |
        +-------- failure --> retry --> DLQ --> alert
```

---

## Section 15 — Security

| Control | Requirement |
|---------|-------------|
| OAuth | Prefer user/admin OAuth; short-lived tokens; refresh in vault |
| API keys | Vault only; never logs/env in client bundles |
| Service accounts | Least-privilege folders/roles; separate per org |
| RBAC | Align to ECC roles (Founder through Advisor); field-level for HR/SIS |
| Encryption | TLS in transit; AES-256 at rest; KMS-managed keys |
| Secrets | Central secrets manager; rotation schedule |
| PII | Classification tags; minimize; purpose limitation |
| FERPA | Education records: directory vs confidential; parental rights workflows later |
| HIPAA readiness | No PHI connectors in Phase 1; BAA path before healthcare clinical data |
| SOC2 readiness | Access reviews, change mgmt, sync audit, incident runbooks |
| GDPR | DPA, residency options, erasure/export pipelines |
| Audit logging | Section 1.4 + admin impersonation flags |

**Hard bans:** Store raw bank passwords; train foundation models on customer SoR data without contract; cross-org data bleed.

---

## Section 16 — Intelligence Mapping (39 domains)

For each domain: **Required** = needed for non-baseline production quality; **Optional** = improves confidence; **Outputs** = consumed by ECC; **Dependencies** = upstream domains / data classes.

| # | Domain | Required data | Optional data | Outputs (ECC) | Dependencies |
|---|--------|---------------|---------------|---------------|--------------|
| 1 | organization-dna | Org profile, mission, structure | Strategy docs | Settings, Graph | — |
| 2 | oios-core | Health inputs, execution baselines | Ops KPIs | Health, Home | dna |
| 3 | organization-health | Composite inputs from finance/ops/HC/customer | Surveys | Health | oios, ops, financial, HC, customer |
| 4 | financial | GL, cash, AP/AR | Budgets | Finance, Risk | banking, ERP |
| 5 | founder | Founder signals / early metrics | — | Founder home | dna, financial |
| 6 | executive | Exec KPIs | Briefs history | Brief, Ask JAG | health, decision |
| 7 | executive-graph | Cross-domain graph inputs | — | Graph explain | multiple lights |
| 8 | executive-decision | Scenarios, options | Board packets | Actions, Predictive | graph, predictive |
| 9 | predictive | Time series KPIs | Macro (FRED) | Predictive, Brief | financial, revenue, customer |
| 10 | board-governance | Packets, resolutions, KPIs | Minutes docs | Approvals, Board role | financial, decision |
| 11 | human-capital | Roster, hire/term, jobs | Perf, engagement | Workforce | HRIS |
| 12 | revenue | Revenue actuals, pipeline | Pricing | Finance, Opp | ERP, CRM |
| 13 | funding | Grants, cash runway inputs | Grant portals | Finance, Opp | banking, ERP, public grants |
| 14 | opportunity | Pipeline + funding + innovation signals | Market | Opportunities | CRM, funding, innovation |
| 15 | organizational-improvement | Ops gaps, opportunity links | — | Actions, Opp | opportunity, ops |
| 16 | business-model | Revenue mix, margins | Market | Opp, Finance | revenue, financial |
| 17 | operations | Attendance/throughput, tickets, inventory | Facilities | Health, Risk | SIS/ops systems |
| 18 | customer | CRM/SIS enrollment, retention, sat | Support tickets | Customers | CRM, SIS |
| 19 | knowledge | Docs, approved articles | Comms summaries | Ask JAG, Brief | Drive/M365 |
| 20 | document | Files + extracts | Contracts | Citations, LCR | Drive/SharePoint |
| 21 | legal-compliance-risk | Policies, obligations, incidents | Legislation feeds | Risk | documents, public law |
| 22 | market | Pipeline, competitors, census | SEC | Opp, Customers | CRM, public |
| 23 | innovation | Initiatives, R&D spend | Patents | Opp | ops, financial |
| 24 | impact | Outcomes, mission KPIs | Grants impact | Wisdom, Brief | SIS, funding |
| 25 | economic | FRED/BLS/Census | Local indicators | Risk, Predictive | public |
| 26 | competitive | Competitor set, win/loss | SEC, market | Opp, Risk | CRM, public |
| 27 | political | Policy/legislation tracking | Lobby notes | Risk | public |
| 28 | environmental | Facilities energy, NOAA | Fleet | Risk | ops, public |
| 29 | stakeholder | CRM accounts, board, partners | Comms | Opp, Risk | CRM, board |
| 30 | reputation | Reviews, tickets, media | Social (future) | Risk, Customers | comms, CRM |
| 31 | behavioral | Engagement, absenteeism proxies | Surveys | Risk, Workforce | HC, SIS |
| 32 | cultural | Org surveys, turnover patterns | Comms tone (gated) | Risk | HC |
| 33 | ethical | Policy adherence, incident flags | — | Wisdom, Risk | LCR, documents |
| 34 | systems | IT asset/uptime signals | Security posture | Risk, Graph | ops/IT |
| 35 | resilience | Continuity plans, incidents | NOAA | Risk, Wisdom | systems, environmental |
| 36 | ecosystem | Partnerships, network orgs | — | Opp partnerships | CRM, stakeholder |
| 37 | institutional-memory | Prior assessments, briefs, decisions | Docs | Timeline, Brief | product + knowledge |
| 38 | collective | Cross-team signals | Comms (gated) | Wisdom, Brief | memory, cultural |
| 39 | wisdom | Downstream lights + judgment inputs | All optional enrichments | Wisdom, Brief, Home | collective (+ soft reads) |

Cognitive modules `success`, `executive`, `strategic`, `decision` consume the same normalized context builder — not separate SoR connectors.

---

## Section 17 — Connector Priority

### Ranking criteria (customer value)

1. Unblocks ECC Finance / Workforce / Customers with live truth  
2. Common among target pilots (Academy, enrichments.org, schools, nonprofits, SMBs)  
3. OAuth maturity / low integration risk  
4. Enables Brief + Wisdom evidence quality  
5. Compliance sensitivity (harder = later)

### Phase 1 (build first)

| Rank | Connector | Why |
|------|-----------|-----|
| 1 | QuickBooks Online | Ubiquitous SMB/nonprofit finance |
| 2 | Plaid (banking) | Cash/runway truth |
| 3 | Google Workspace **or** Microsoft 365 (pick pilot stack) | Docs + calendar + identity |
| 4 | HubSpot **or** Salesforce (pilot CRM) | Pipeline / families / donors |
| 5 | BambooHR **or** Gusto / Rippling | Workforce roster |
| 6 | AcademyOS / primary SIS for school pilots | Student journey |
| 7 | Stripe (payments/treasury as applicable) | Revenue actuals |
| 8 | OpenAI / Azure OpenAI + embeddings | Ask JAG / retrieval |
| 9 | CSV/OFX manual upload | Universal fallback |
| 10 | FRED + Census basic series | Economic context lights |

### Phase 2

Xero, NetSuite, Dynamics Finance/CRM, ADP/Paychex/Workday (tiered), PowerSchool/FACTS/Blackbaud, Canvas/Google Classroom, Slack/Teams deeper ingest, SharePoint/Dropbox/Box, Zendesk/Intercom, Grants.gov + major foundation portals, Plaid investments/liabilities, legislation tracker, NOAA.

### Phase 3

Sage, SAP, Oracle, UKG, Schoology, advanced phone CDRs, CMMS/fleet/POS deep links, SEC bulk, IRS exempt bulk analytics, multi-region open banking.

### Future

Local LLMs, social listening, clinical HIPAA data planes, marketplace third-party connectors, customer-built generic REST connector UI.

---

## Deliverable summaries

### Enterprise integration architecture

See Section 1 diagrams and layer table — SoR -> connector -> sync -> normalize -> intelligence feed -> OIOS -> ECC -> audit.

### Integration matrix (condensed)

| Category | Phase 1 exemplars | SoR | Primary domains |
|----------|-------------------|-----|-----------------|
| Financial | QBO, Xero | ERP | financial, revenue, funding |
| Banking | Plaid, OFX/CSV | Bank | financial, funding |
| CRM | HubSpot, Salesforce | CRM | customer, revenue, opportunity |
| HR | BambooHR, Gusto | HRIS | human-capital |
| Education | AcademyOS, PowerSchool | SIS | customer, operations |
| Productivity | Google/M365 | Workspace | document, knowledge |
| Documents | Drive/SharePoint | Doc store | document, LCR |
| Comms | Slack/Teams (light) | Chat | collective, reputation |
| Ops | POS/CMMS (later) | Ops apps | operations |
| Public | FRED, Census | Agencies | economic, political, environmental |
| AI | Azure OpenAI | Model provider | Ask JAG, knowledge |

### Sync architecture

Section 14 — webhook/cron/manual -> orchestrator -> connector -> normalize -> upsert -> cursor / DLQ -> monitors.

### Data ownership model

Section 13.2 — customer owns SoR; JAG owns connectors, canonical cache, enrichments, assessments, product state.

### Security model

Section 15 — OAuth-first, vault secrets, RBAC + field ACL, encryption, FERPA/HIPAA/GDPR/SOC2 readiness gates.

### Storage strategy

Section 13.1 table by data class (SoR, cache, archive, retention, versioning, encryption, backups, audit).

### Connector roadmap

Section 17 Phase 1-3 + Future.

### Build order (engineering sequence)

1. Connector Registry + secrets + sync orchestrator + DLQ + audit log  
2. Canonical schema v1 (Finance, People, Customer, Document)  
3. QBO + Plaid + CSV/OFX  
4. Intelligence adapters -> `financial` / `funding` / `revenue` baselines  
5. Workspace docs metadata + embeddings  
6. CRM **or** SIS (per pilot)  
7. HRIS roster  
8. ECC Finance/Workforce/Customers live badges (remove baseline labels)  
9. Brief/Ask JAG citation from live sources  
10. Expand Phase 2 vendors behind same contracts  

### Risk assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Treating JAG as accounting SoR | Financial/legal error | Read-only default; UI copy; no silent writes |
| PII over-collection | FERPA/GDPR incident | Minimize fields; role ACL; DPIA |
| Stale sync presented as live | Bad executive decisions | Lag SLOs; "as of" timestamps on widgets |
| Vendor rate limits | Incomplete Brief | Backoff, prioritization, partial UI states |
| Baseline confusion | Trust loss | Mandatory baseline labeling until connected |
| Cross-tenant bleed | Catastrophic | Org-scoped credentials + query filters |
| LLM hallucination on money | Misstatement | Grounding + citation required; refuse if ungrounded |
| Desktop/QBD fragility | Support load | Prefer QBO; QBD as Phase 2 bridge |
| HIPAA accidental PHI | Compliance failure | Block clinical connectors until BAA |
| DLQ neglect | Silent data loss | Alerts + operator console SLA |

---

## Document control

| Field | Value |
|-------|-------|
| Owner | Product / Platform Integrations |
| Non-goals | Runtime implementation in this task |
| Next | Connector implementation epic; Pilot data contracts for Academy + enrichments.org |
| Related | [EXECUTIVE_COMMAND_CENTER_SPEC.md](./EXECUTIVE_COMMAND_CENTER_SPEC.md), [JAG_V1_INTELLIGENCE_GRAPH.md](../architecture/JAG_V1_INTELLIGENCE_GRAPH.md) |

**End of Enterprise Data Integration Architecture**
