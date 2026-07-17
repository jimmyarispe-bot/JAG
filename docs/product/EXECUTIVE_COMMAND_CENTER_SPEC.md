# Executive Command Center — Product Specification

**Product:** JAG Organizational Intelligence Operating System (OIOS)  
**Phase:** B1 — Productization  
**Status:** Specification complete (documentation only)  
**Audience:** Engineering, design, product, and pilot operators  
**Constraint:** This document is the blueprint. No UI code, no architecture changes, no intelligence package changes.

---

## 0. Product thesis

The Executive Command Center is the **CEO-facing operating surface** for JAG v1.0 intelligence.

It does not invent new intelligence. It **composes, prioritizes, and operationalizes** the existing 39-domain pipeline (organization-dna → wisdom) plus cognitive domains (success / executive / strategic / decision) already wired through `createIntelligenceService()`.

**Design principles**

1. Every screen exists for a business decision or monitoring job.  
2. Every widget maps to one or more real intelligence modules (domain keys from `INTELLIGENCE_MODULE_IDS`).  
3. Confidence, provenance, and soft-read limitations are always visible.  
4. Drill-down always lands on evidence + recommended action, never a dead end.  
5. Role views change **emphasis and permission**, not invent parallel products.  
6. Fortune 500, nonprofit, school, healthcare, and growth-company executives share one shell; vertical labels adapt (Customer ↔ Student/Family; Revenue ↔ Tuition/Grants).

**Non-goals (B1)**

- Building React screens  
- Changing DI, packages, or APIs  
- Inventing connectors not covered in required integrations (listed; built later in Phase B2+)

---

## 1. Executive Home Dashboard

### Purpose

Give an executive a **60-second situational picture** and a **5-minute action path** every morning: health, risks, opportunities, decisions waiting, and the top wisdom recommendation.

### Layout (desktop, 1440px+)

```
┌──────────────────────────────────────────────────────────────────────────┐
| Brand · Org switcher · Scope (org / school) · Ask JAG · Alerts · Profile |
├────────────┬─────────────────────────────────────────────────────────────┤
| Primary    | Row A: Health Score | Brief strip | Critical alerts (3 max) |
| nav        | Row B: Wisdom Top-1 | Opportunity Top-3 | Risk Top-3        |
| (left)     | Row C: Finance spark | Workforce spark | Customer spark     |
|            | Row D: Action Center (pending) | Predictive outlook         |
|            | Row E: Timeline (last 7 days)  | Graph health chip          |
└────────────┴─────────────────────────────────────────────────────────────┘
```

**First viewport budget:** Brand/org context, one health number, brief headline, one CTA group (Open Brief / Ask JAG / Review Approvals). No stats dump above the fold beyond health + critical alert count.

### Widget placement

| Zone | Widget ID | Title | Primary intelligence |
|------|-----------|-------|----------------------|
| A1 | `home.health.overall` | Organization Health | `organization-health`, `oios-core` |
| A2 | `home.brief.headline` | Today's brief headline | `wisdom`, `executive-decision`, `predictive` |
| A3 | `home.alerts.critical` | Critical alerts | Risk composite (see §6) |
| B1 | `home.wisdom.top` | Top recommendation | `wisdom` |
| B2 | `home.opportunity.top3` | Top opportunities | `opportunity`, `funding`, `revenue`, `innovation` |
| B3 | `home.risk.top3` | Top risks | See Risk Center mapping |
| C1 | `home.finance.spark` | Financial snapshot | `financial`, `revenue`, `funding` |
| C2 | `home.workforce.spark` | Workforce snapshot | `human-capital` |
| C3 | `home.customer.spark` | Customer / student snapshot | `customer` |
| D1 | `home.actions.pending` | Needs your decision | Action Center + `executive-decision`, `board-governance` |
| D2 | `home.predictive.outlook` | Outlook | `predictive` |
| E1 | `home.timeline.7d` | Last 7 days | Timeline (§14) + `institutional-memory` |
| E2 | `home.graph.status` | Intelligence graph status | Platform registry / pipeline |

### Navigation

**Primary left nav (fixed order)**

1. Home  
2. Brief  
3. Health  
4. Wisdom  
5. Opportunities  
6. Risks  
7. Finance  
8. Workforce  
9. Customers / Students  
10. Predictive  
11. Actions  
12. Graph  
13. Timeline  
14. Ask JAG  

Settings / Notifications / Integrations live under profile menu (not primary nav).

### Personalization

| Preference | Default | Storage |
|------------|---------|---------|
| Role lens | From auth claims | User profile |
| Vertical labels | Org type (school / nonprofit / enterprise / healthcare) | Org DNA / settings |
| Home widget order | Spec order above | User prefs (permutable C-row only) |
| Scope default | Last used org+school | Session |
| Brief delivery time | 06:30 local | Notification prefs |
| Quiet hours | Off | Notification prefs |

Personalization **cannot hide** Critical alerts or pending Approvals for CEO/Founder roles.

### Executive workflow (Home)

1. Land on Home → read Health + Brief headline (≤15s).  
2. If Critical alerts > 0 → open Risk Center filtered to critical.  
3. Else open Brief → accept or snooze recommended actions.  
4. Clear Action Center items that require decision today.  
5. Optionally Ask JAG about the top wisdom item.  
6. Leave Home; system records engagement for success metrics (§19).

---

## 2. Organization Health

### Purpose

Answer: **Is the organization healthy, improving, or deteriorating — and where?**

### Screen layout

- Hero: Overall Health Score (0–100) + status band + 30/90-day trend sparkline  
- Secondary: Department / domain health grid  
- Tertiary: Historical comparison (period A vs B)  
- Drawer: Drill-down detail for selected cell  

### Widgets

| Widget ID | Content | Intelligence |
|-----------|---------|--------------|
| `health.overall` | Composite score + band | `organization-health`, `oios-core` health |
| `health.trend` | 30/90/365 trend | `organization-health` + history stores |
| `health.departments` | Grid: Ops, Finance, People, Customer, Risk, Wisdom signal | `operations`, `financial`/`revenue`, `human-capital`, `customer`, `legal-compliance-risk` + risk composite, `wisdom` |
| `health.history.compare` | Two-period delta table | History via domain repositories / institutional-memory |
| `health.drivers` | Top positive / negative drivers | Soft lights from contributing domains |

### Drill-down behavior

| Click | Navigates to | Powered by |
|-------|--------------|------------|
| Overall score | Health detail + driver list | `organization-health`, `oios-core` |
| Operations cell | Operations intelligence result view | `operations` |
| Finance cell | Financial Snapshot | `financial`, `revenue` |
| People cell | Workforce Snapshot | `human-capital` |
| Customer cell | Customer / Student Snapshot | `customer` |
| Risk cell | Risk Center | Risk composite |
| Wisdom cell | Wisdom Center | `wisdom` |
| Trend point | Timeline filtered to that day | Timeline + memory |

---

## 3. Executive Brief

### Purpose

**Morning briefing:** What happened, why it matters, what to do, with confidence and sources.

### Structure (ordered sections — do not reorder)

1. **Headline** (one sentence)  
2. **What happened** (≤5 bullets, last 24h / since last brief)  
3. **Why it matters** (impact on health, cash, people, mission)  
4. **Recommended actions** (≤5, ranked; each links to Action Center item)  
5. **Risks** (≤3)  
6. **Opportunities** (≤3)  
7. **Confidence** (score + level + factor list)  
8. **Sources** (domain keys + result requestIds + document refs when available)  

### Widgets

| Widget ID | Intelligence |
|-----------|--------------|
| `brief.compose` | `wisdom` (primary), `executive-decision`, `predictive`, `collective` |
| `brief.actions` | Action Center bindings + `organizational-improvement` |
| `brief.risks` | Risk composite |
| `brief.opportunities` | `opportunity`, `funding`, `revenue`, `innovation` |
| `brief.confidence` | Domain confidence scores (wisdom / decision) |
| `brief.sources` | Result metadata + `document` / `knowledge` soft refs |
| `brief.history` | Prior briefs via `institutional-memory` |

### Workflow

Open Brief → Accept / Defer / Dismiss each recommended action → Accepted items appear in Action Center with owner + due date → Brief marked consumed for engagement metrics.

---

## 4. Wisdom Center

### Purpose

Surface **terminal organizational judgment**: recommendations with trade-offs, ethics, and long-term impact — not a chat dump.

### Layout

- Left: Ranked recommendations list  
- Center: Selected recommendation detail (Judgment Framework)  
- Right: Evidence / confidence / related domains  

### Widgets

| Widget ID | Content | Intelligence |
|-----------|---------|--------------|
| `wisdom.recommendations` | Ranked list | `wisdom` |
| `wisdom.tradeoffs` | Explicit trade-off statements | `wisdom` trade-off engines |
| `wisdom.judgment` | Executive Judgment Framework panel | `wisdom` + `ethical` soft read |
| `wisdom.evidence` | Evidence quality + citations | `wisdom`, `knowledge`, `document`, `institutional-memory` |
| `wisdom.confidence` | Confidence factors | `wisdom` confidence |
| `wisdom.ethical` | Ethical impact summary | `ethical` |
| `wisdom.longterm` | Long-term impact | `wisdom`, `impact`, `resilience` |
| `wisdom.collective` | Collective alignment signal | `collective` |

### Executive Judgment Framework (fixed fields)

Every selected recommendation must show:

1. Strategic value  
2. Long-term impact  
3. Confidence level  
4. Evidence quality  
5. Trade-off balance  
6. Organizational alignment  
7. Ethical integrity  
8. Wisdom score  

(Maps to Wisdom Intelligence lens fields shipped in v1.0.)

### Drill-down

| Click | Destination |
|-------|-------------|
| Recommendation | Detail panel (same screen) |
| Related domain chip | That domain's center or Graph focus |
| Evidence item | Document / Knowledge viewer |
| Promote to action | Action Center create flow |
| Ask about this | Ask JAG with recommendation context preloaded |

---

## 5. Opportunity Center

### Purpose

Prioritize **value-creating moves**: revenue, funding, partnerships, innovation, savings, operational improvement.

### Tabs (fixed)

1. All (ranked)  
2. Revenue  
3. Funding  
4. Partnerships / Ecosystem  
5. Innovation  
6. Cost savings / Efficiency  
7. Operational improvements  

### Widgets

| Widget ID | Tab | Intelligence |
|-----------|-----|--------------|
| `opp.rank` | All | `opportunity` |
| `opp.revenue` | Revenue | `revenue`, `business-model`, `market` |
| `opp.funding` | Funding | `funding` |
| `opp.partnerships` | Partnerships | `ecosystem`, `stakeholder`, `opportunity` |
| `opp.innovation` | Innovation | `innovation` |
| `opp.savings` | Cost savings | `operations`, `organizational-improvement`, `financial` |
| `opp.ops` | Operational | `operations`, `organizational-improvement` |
| `opp.filters` | All | Priority / confidence / time-to-value |

### Priority ordering

1. Priority band (critical → monitor)  
2. Expected value × confidence  
3. Time-to-capture  
4. Strategic alignment (wisdom / DNA soft signals)

### Drill-down

Opportunity row → Opportunity detail (score, owners, dependencies, risks, next step) → Create Action / Ask JAG / Open related Finance or Funding snapshot.

---

## 6. Risk Center

### Purpose

Unified **risk portfolio** across financial, operational, legal/compliance, cyber (via systems/resilience + LCR), reputation, political, economic, environmental, behavioral, systems, and resilience.

### Risk categories (fixed taxonomy)

| Category | Primary intelligence | Secondary |
|----------|----------------------|-----------|
| Financial | `financial`, `revenue`, `funding` | `economic` |
| Operational | `operations` | `systems`, `resilience` |
| Legal | `legal-compliance-risk` | `document` |
| Compliance | `legal-compliance-risk` | `board-governance` |
| Cyber / Systems | `systems`, `resilience` | `document` |
| Reputation | `reputation` | `stakeholder`, `customer` |
| Political | `political` | `stakeholder` |
| Economic | `economic` | `market` |
| Environmental | `environmental` | `resilience` |
| Behavioral | `behavioral` | `cultural`, `human-capital` |
| Systems | `systems` | `ecosystem` |
| Resilience | `resilience` | `systems`, `environmental` |

### Widgets

| Widget ID | Content |
|-----------|---------|
| `risk.heatmap` | Category × severity matrix |
| `risk.priority.list` | Ranked open risks |
| `risk.trend` | Emerging vs declining |
| `risk.early.warning` | Early-warning signals from domain engines |
| `risk.ethics` | Ethical escalation flags (`ethical`) |

### Priority ordering

1. Severity / priority band  
2. Time-to-impact (predictive)  
3. Controllability  
4. Cascading dependency count (graph)

### Drill-down

Risk → detail (drivers, affected domains, scenarios, recommended mitigations) → Action Center / Predictive scenario / Graph focus.

---

## 7. Financial Snapshot

### Purpose

Answer: **Can we fund the plan, and is the trajectory healthy?**

### Widgets

| Widget ID | Metric | Intelligence |
|-----------|--------|--------------|
| `fin.revenue` | Revenue | `revenue`, `financial` |
| `fin.expenses` | Expenses | `financial`, `operations` |
| `fin.cash` | Cash | `financial`, `funding` |
| `fin.forecast` | Forecast | `predictive`, `revenue`, `funding` |
| `fin.runway` | Runway | `funding`, `financial` |
| `fin.ebitda` | EBITDA / operating surplus | `financial`, `revenue` |
| `fin.variance` | Budget variance | `financial`, `board-governance` KPIs |
| `fin.mix` | Funding mix (nonprofit/school) | `funding` |

Vertical adaptation: schools emphasize tuition + aid + grants; nonprofits emphasize restricted/unrestricted; enterprises emphasize margin + ARR where modeled.

### Drill-down

Metric → trend + variance drivers → Opportunity/Risk related items → Board packet link when `board-governance` packet exists.

---

## 8. Workforce Snapshot

### Purpose

Answer: **Do we have the people capacity and health to execute?**

### Widgets

| Widget ID | Metric | Intelligence |
|-----------|--------|--------------|
| `hc.hiring` | Hiring pipeline / priorities | `human-capital` |
| `hc.turnover` | Turnover | `human-capital` |
| `hc.capacity` | Capacity / workforce plan | `human-capital` |
| `hc.engagement` | Engagement | `human-capital`, `behavioral` |
| `hc.performance` | Performance distribution | `human-capital` |
| `hc.burnout` | Burnout risk | `human-capital` |
| `hc.succession` | Bench strength (exec view) | `human-capital` |

### Drill-down

Metric → HC result sections → Risk Center (behavioral) if burnout critical → Action (hiring approval, retention plan).

---

## 9. Customer / Student Snapshot

### Purpose

Answer: **Are the people we serve growing, staying, and satisfied?**

### Widgets

| Widget ID | Metric | Label variants | Intelligence |
|-----------|--------|----------------|--------------|
| `cu.growth` | Growth | Customers / Enrollment | `customer` |
| `cu.retention` | Retention | Retention / Persistence | `customer` |
| `cu.satisfaction` | Satisfaction | CSAT / Family satisfaction | `customer` |
| `cu.enrollment` | Enrollment / headcount served | Schools / nonprofits | `customer`, `operations` |
| `cu.pipeline` | Pipeline | Admissions / Sales pipeline | `customer`, `revenue`, `market` |
| `cu.journey` | Journey health | Journey map summary | `customer` |

### Drill-down

Metric → Customer Intelligence result → Opportunity (retention offers) / Risk (churn) / Reputation.

---

## 10. Predictive Intelligence

### Purpose

Answer: **What futures should we prepare for?**

### Widgets

| Widget ID | Content | Intelligence |
|-----------|---------|--------------|
| `pred.forecasts` | KPI forecasts | `predictive` |
| `pred.risks.future` | Emerging risks | `predictive` + Risk Center domains |
| `pred.opps.future` | Emerging opportunities | `predictive`, `opportunity`, `innovation` |
| `pred.scenarios` | Scenario cards | `predictive`, domain scenario engines |
| `pred.confidence` | Intervals / confidence | `predictive` confidence |
| `pred.compare` | Scenario compare table | `predictive`, `executive-decision` |

### Drill-down

Forecast → drivers → Scenario detail → Decision packet (`executive-decision`) → Action / Board.

---

## 11. Executive AI Conversation ("Ask JAG")

### Purpose

Conversational access to **the same intelligence graph**, with memory, evidence, and citations — not a free-floating chatbot.

### Capabilities (specified behavior)

| Capability | Requirement |
|------------|-------------|
| Ask JAG | Natural-language questions scoped to org (+ school) |
| Conversation memory | Persist thread; tie to `institutional-memory` / learning services |
| Evidence | Every substantive claim links to domain result or document |
| Citations | Show domain key, requestId, timestamp, confidence |
| Recommended actions | Extract actionable items into Action Center |
| Follow-up reasoning | Multi-turn; may invoke `decision` / `strategic` / `wisdom` cognitive paths |
| Refusal / uncertainty | If confidence low or data synthetic/baseline, say so explicitly |

### Context injection (required)

On open from a screen, preload: current scope, active widget entity ids, last brief id, selected recommendation/risk/opportunity if any.

### Intelligence mapping

| Turn type | Modules |
|-----------|---------|
| Status / health | `organization-health`, `oios-core` |
| Judgment / "what should we do" | `wisdom`, `executive-decision` |
| Forecast | `predictive` |
| People | `human-capital` |
| Money | `financial`, `revenue`, `funding` |
| Customers | `customer` |
| Why / explain | `executive-graph`, domain reasoners |

### Non-goals

- Unscoped web search as primary answer  
- Actions without confirmation for CEO-critical operations  

---

## 12. Action Center

### Purpose

Turn intelligence into **owned work**: tasks, approvals, decisions, delegation, follow-ups, deadlines.

### Widgets

| Widget ID | Content | Sources |
|-----------|---------|---------|
| `act.tasks` | Open tasks | Brief accepts, Ask JAG extracts, manual |
| `act.approvals` | Approvals queue | `board-governance`, role policies |
| `act.decisions` | Pending decisions | `executive-decision` |
| `act.delegation` | Delegated items | Action model |
| `act.followups` | Follow-ups | Learning loop destinations |
| `act.deadlines` | Calendar of due items | Action model + grant/board calendars (`funding`, `board-governance`) |

### States

`proposed` → `accepted` → `in_progress` → `blocked` → `done` / `dismissed` / `escalated`

### Drill-down

Item → linked intelligence evidence → complete / reassign / escalate / ask JAG.

---

## 13. Intelligence Graph

### Purpose

Make the **39-domain DAG** legible: relationships, dependencies, recommendation flow, closed learning loop.

### Visualization requirements

| Element | Spec |
|---------|------|
| Nodes | One per `INTELLIGENCE_MODULE_IDS` entry (39) |
| Edges | Hard deps from module registration + soft-read relationships (dashed) |
| Terminal | `wisdom` highlighted as terminal |
| Learning loop | Overlay showing recommendation → action → outcome → memory → next brief |
| Focus mode | Click domain → dim others; show publishers/consumers |
| Health tint | Node color from last result health/priority |
| Pipeline run | Optional animate last successful pipeline order |

### Widgets

| Widget ID | Content |
|-----------|---------|
| `graph.canvas` | Interactive graph |
| `graph.legend` | Hard vs soft vs learning edges |
| `graph.inspector` | Selected domain: last result summary, confidence, links to centers |
| `graph.run.status` | Last pipeline status / module order |

### Drill-down

Node → domain center or inspector; Edge → dependency explanation; Learning loop node → Timeline / Action.

---

## 14. Organization Timeline

### Purpose

Chronological truth of **decisions, events, recommendations, learning, results, outcomes**.

### Event types (fixed)

| Type | Source |
|------|--------|
| Decision | `executive-decision`, Action Center |
| Event | Ops/alerts, integrations |
| Recommendation | `wisdom`, `opportunity`, Brief |
| Learning | Learning services / closed loops |
| Result | Domain assessment completed |
| Outcome | Measured follow-up (when instrumented) |

### Widgets

| Widget ID | Content |
|-----------|---------|
| `time.stream` | Vertical chronology |
| `time.filters` | Type, domain, actor, severity |
| `time.search` | Semantic search via `knowledge` / `institutional-memory` |

### Drill-down

Event → originating center + Ask JAG with event context.

---

## 15. Notifications

### Channels

In-app bell, email digest, mobile push (when mobile ships).

### Types

| Type | Trigger | Default audience |
|------|---------|------------------|
| Executive alert | Priority ≥ high on watched domains | Exec+ |
| Critical alert | Priority critical / early-warning fire | CEO, Founder, on-call exec |
| Daily briefing | Scheduled Brief ready | Subscribers |
| Weekly summary | Weekly rollup | Exec+, Board (optional) |
| Threshold alert | User-defined KPI breach | Creator + role defaults |
| Escalation | Action overdue / risk unacked | Manager → Exec → CEO |

### Rules

- Critical alerts bypass quiet hours for CEO/Founder.  
- Board Member role receives weekly summary + board-packet notifications only by default.  
- Every notification deep-links to the exact widget/entity.

---

## 16. Mobile Experience

### Purpose

Executives decide and monitor on the move — not full Graph editing on phone.

### Phone layout

- Bottom tabs: Home · Brief · Actions · Ask JAG · More  
- More: Health, Wisdom, Risks, Opportunities, Finance, Workforce, Customers, Predictive, Timeline, Graph (read-only), Settings  
- Home: stacked A/B widgets only (Health, Brief, Critical, Top Wisdom, Pending Actions)  
- Swipe actions: Accept / Snooze recommendation; Approve / Deny approval items  

### Tablet layout

- Split view: list + detail for Wisdom, Risks, Opportunities, Actions  
- Graph readable with pan/zoom; limited edit  

### Offline behavior

| Available offline | Not available offline |
|-------------------|------------------------|
| Last cached Brief | New full pipeline runs |
| Cached Health / Finance / Workforce / Customer sparks | Live Ask JAG (queue message) |
| Action inbox (view) | Approvals that require server authz |
| Push notification payload deep links (open when online) | Graph live dependency refresh |

Conflict policy: server wins on re-sync; user notified of rejected offline actions.

### Mobile notifications

Mirror §15; Critical uses OS interrupt level where permitted.

---

## 17. User Roles

Role changes **default home widgets, nav emphasis, and permissioned actions** — same product shell.

| Role | Sees first | Can approve | Nav emphasis | Restricted |
|------|------------|-------------|--------------|------------|
| Founder | Health, Wisdom, Cash/Runway, Actions | Yes (org-wide) | Home, Wisdom, Finance, Actions | None within org |
| CEO | Brief, Health, Risks, Actions | Yes | Brief, Risks, Opportunities, Actions | Configurable board-only packs |
| Executive | Domain of ownership + Actions | Within portfolio | Health, Actions, Predictive | Outside portfolio (read-limited) |
| School Leader | Student snapshot, Ops, Workforce, Brief | School scope | Customers/Students, Workforce, Risks | Other schools |
| Department Head | Dept health + Actions | Dept | Health drill-down, Actions | Cross-dept finance detail |
| Manager | Team workforce + Actions | Team tasks | Workforce, Actions | Org-wide finance/wisdom (summary only) |
| Board Member | Board packets, weekly summary, Health, Risks | Board resolutions only | Brief (board edition), Finance variance, Governance | Ops minutiae; Ask JAG limited to board scope |
| Advisor | Read-mostly Health, Wisdom, Opportunities | No (comment only) | Wisdom, Opportunities, Graph | Actions create (suggest only) |

**Scope enforcement:** `organizationId` + optional `schoolId` on every query — matches intelligence `GraphScope`.

---

## 18. Drill-Down Rules (global)

Every widget must define all four:

1. **Primary click** → destination screen + entity id  
2. **Secondary click / menu** → Ask JAG · Create Action · Open Graph focus · Copy citation  
3. **Intelligence powering it** → domain key(s) + result field path  
4. **Empty / low-confidence state** → explicit copy ("Baseline model — connect data source") + CTA to integrations  

**Never:** click → null route; click → raw JSON; click → unrelated marketing page.

### Master drill-down matrix (summary)

| From widget family | Primary destination |
|--------------------|---------------------|
| Home health | Organization Health |
| Home brief headline | Executive Brief |
| Home wisdom top | Wisdom Center (selected) |
| Home opportunity/risk top | Opportunity / Risk detail |
| Home finance/workforce/customer sparks | Respective Snapshot |
| Home actions | Action Center filtered |
| Snapshot metrics | Domain detail + Action/Risk/Opp |
| Graph node | Domain center or inspector |
| Notification | Exact entity deep link |
| Ask JAG citation | Source center + evidence |

---

## 19. Success Metrics

Instrument product analytics (separate from intelligence confidence).

| Metric | Definition | Target (pilot) |
|--------|------------|----------------|
| Time to insight | Home load → first meaningful interaction with Brief or Health drill | < 60s median |
| Decision quality | % of accepted wisdom/decision actions later marked outcome-positive | Baseline then +10% QoQ |
| Executive engagement | Weekly active executives opening Brief ≥3 days/week | ≥ 70% of seated execs |
| Task completion | Actions from Brief completed by due date | ≥ 60% |
| Risk reduction | Count of critical risks open > 14 days | Downward trend |
| Opportunity capture | Opportunities moved to `in_progress` / `won` | Upward trend |
| Organization health improvement | 90-day health score delta | Non-negative for pilot orgs |

Dashboards for these metrics live in an internal **Product Ops** view (not CEO Home).

---

## 20. Complete screen specification (inventory)

| # | Screen ID | Route (logical) | Primary job |
|---|-----------|-----------------|-------------|
| 1 | `screen.home` | `/exec` | Situational awareness |
| 2 | `screen.brief` | `/exec/brief` | Morning briefing |
| 3 | `screen.health` | `/exec/health` | Org health |
| 4 | `screen.wisdom` | `/exec/wisdom` | Judgment and recommendations |
| 5 | `screen.opportunities` | `/exec/opportunities` | Value capture |
| 6 | `screen.risks` | `/exec/risks` | Risk portfolio |
| 7 | `screen.finance` | `/exec/finance` | Financial snapshot |
| 8 | `screen.workforce` | `/exec/workforce` | People snapshot |
| 9 | `screen.customers` | `/exec/customers` | Customer/student snapshot |
| 10 | `screen.predictive` | `/exec/predictive` | Foresight |
| 11 | `screen.ask` | `/exec/ask` | AI conversation |
| 12 | `screen.actions` | `/exec/actions` | Execution |
| 13 | `screen.graph` | `/exec/graph` | 39-domain graph |
| 14 | `screen.timeline` | `/exec/timeline` | Chronology |
| 15 | `screen.notifications` | `/exec/notifications` | Alert inbox |
| 16 | `screen.settings` | `/exec/settings` | Prefs, integrations entry |

Mobile maps to the same screen IDs with layouts in §16.

---

## 21. Widget inventory (complete list)

| Widget ID | Screen | Intelligence domain keys |
|-----------|--------|--------------------------|
| `home.health.overall` | Home | organization-health, oios-core |
| `home.brief.headline` | Home | wisdom, executive-decision, predictive |
| `home.alerts.critical` | Home | risk composite |
| `home.wisdom.top` | Home | wisdom |
| `home.opportunity.top3` | Home | opportunity, funding, revenue, innovation |
| `home.risk.top3` | Home | risk composite |
| `home.finance.spark` | Home | financial, revenue, funding |
| `home.workforce.spark` | Home | human-capital |
| `home.customer.spark` | Home | customer |
| `home.actions.pending` | Home | executive-decision, board-governance, actions |
| `home.predictive.outlook` | Home | predictive |
| `home.timeline.7d` | Home | institutional-memory, timeline |
| `home.graph.status` | Home | platform registry |
| `health.*` | Health | organization-health, oios-core, operations, financial, revenue, human-capital, customer, legal-compliance-risk, wisdom |
| `brief.*` | Brief | wisdom, executive-decision, predictive, collective, opportunity, funding, document, knowledge |
| `wisdom.*` | Wisdom | wisdom, ethical, impact, resilience, collective, knowledge, document, institutional-memory |
| `opp.*` | Opportunities | opportunity, revenue, funding, ecosystem, stakeholder, innovation, operations, organizational-improvement, business-model, market, financial |
| `risk.*` | Risks | financial, revenue, funding, operations, legal-compliance-risk, systems, resilience, reputation, stakeholder, customer, political, economic, environmental, behavioral, cultural, human-capital, ethical, ecosystem, predictive |
| `fin.*` | Finance | financial, revenue, funding, predictive, operations, board-governance |
| `hc.*` | Workforce | human-capital, behavioral |
| `cu.*` | Customers | customer, operations, revenue, market, reputation |
| `pred.*` | Predictive | predictive, opportunity, innovation, executive-decision |
| `ask.*` | Ask JAG | cognitive + domain routing via createIntelligenceService |
| `act.*` | Actions | executive-decision, board-governance, funding calendars, learning loop |
| `graph.*` | Graph | all 39 modules + learning overlay |
| `time.*` | Timeline | institutional-memory, knowledge, all result events |
| `notif.*` | Notifications | derived from risk/brief/actions thresholds |

**Risk composite** = union of category mapping in §6, prioritized per §6 ordering.

---

## 22. Navigation map

```
Home
 ├─ Brief
 ├─ Health ──► domain snapshots / Risk / Wisdom
 ├─ Wisdom ──► Actions · Ask JAG · Graph
 ├─ Opportunities ──► Finance · Funding · Actions
 ├─ Risks ──► Predictive · Actions · Graph
 ├─ Finance ──► Opportunities · Board packets
 ├─ Workforce ──► Risks(behavioral) · Actions
 ├─ Customers ──► Opportunities · Reputation
 ├─ Predictive ──► Decisions · Scenarios
 ├─ Actions ──► Brief · Ask JAG
 ├─ Graph ──► any domain center
 ├─ Timeline ──► any event source
 └─ Ask JAG (context from any screen)

Notifications → deep link into the above
Settings → Integrations (Phase B2) · Preferences · Roles
```

---

## 23. User workflows (canonical)

### W1 — Morning executive (CEO)

Home → Brief (accept 2 actions) → clear 1 approval in Actions → skim Risks if critical > 0 → done.

### W2 — Judgment call

Wisdom → select recommendation → review trade-offs/ethics → Ask JAG "what breaks if we wait 90 days?" → Create Action → assign owner.

### W3 — Cash anxiety

Finance → runway red → Opportunities Funding tab → select grant/match → Action + notify Development lead.

### W4 — Board prep

Board Member weekly summary → Finance variance → Risks heatmap → open Board packet (`board-governance`) → vote/acknowledge.

### W5 — School leader enrollment

Customers/Students → retention dip → Risk + Opportunity → Workforce capacity check → Actions for admissions huddle.

---

## 24. Data sources

| Layer | Source | Notes |
|-------|--------|-------|
| Intelligence results | `createIntelligenceService()` domain stacks | In-memory today; product must cache/persist for multi-user (Phase B hardening) |
| Cognitive runs | success / executive / strategic / decision modules | Via service router |
| Identity / scope | Existing auth + org/school claims | Required for GraphScope |
| Documents | `document`, `knowledge` | Citations |
| Memory | `institutional-memory`, learning services | Briefs, timeline |
| Board artifacts | `board-governance` packets | Approvals |
| Product actions | New Action store (product DB) | Not an intelligence domain |
| Notifications | Product notification service | Triggers from intelligence thresholds |
| Integrations | External systems (below) | Feed baselines / replace synthetic inputs |

---

## 25. Intelligence mapping (39 domains → screens)

| # | Domain key | Primary screens |
|---|------------|-----------------|
| 1 | organization-dna | Settings context, Graph, Ask JAG |
| 2 | oios-core | Health, Home |
| 3 | organization-health | Health, Home |
| 4 | financial | Finance, Risk, Home |
| 5 | founder | Founder home emphasis, Brief |
| 6 | executive | Brief, Ask JAG |
| 7 | executive-graph | Graph, Ask JAG explain |
| 8 | executive-decision | Actions, Predictive, Brief |
| 9 | predictive | Predictive, Home, Brief |
| 10 | board-governance | Actions, Finance, Board role |
| 11 | human-capital | Workforce, Risk(behavioral) |
| 12 | revenue | Finance, Opportunities |
| 13 | funding | Finance, Opportunities |
| 14 | opportunity | Opportunities, Home |
| 15 | organizational-improvement | Opportunities, Actions |
| 16 | business-model | Opportunities, Finance |
| 17 | operations | Health, Risk, Customers |
| 18 | customer | Customers, Home, Reputation |
| 19 | knowledge | Ask JAG, Brief sources, Timeline |
| 20 | document | Citations, Compliance evidence |
| 21 | legal-compliance-risk | Risk (legal/compliance) |
| 22 | market | Opportunities, Customers pipeline |
| 23 | innovation | Opportunities |
| 24 | impact | Wisdom long-term, Brief |
| 25 | economic | Risk, Finance context |
| 26 | competitive | Opportunities, Risk |
| 27 | political | Risk |
| 28 | environmental | Risk, Resilience |
| 29 | stakeholder | Opportunities, Risk, Reputation |
| 30 | reputation | Risk, Customers |
| 31 | behavioral | Risk, Workforce |
| 32 | cultural | Risk, Workforce (context) |
| 33 | ethical | Wisdom, Risk escalation |
| 34 | systems | Risk, Graph |
| 35 | resilience | Risk, Wisdom long-term |
| 36 | ecosystem | Opportunities partnerships |
| 37 | institutional-memory | Timeline, Brief history |
| 38 | collective | Wisdom, Brief |
| 39 | wisdom | Wisdom, Brief, Home |

Cognitive: `success`, `executive`, `strategic`, `decision` power Ask JAG and Brief reasoning paths.

---

## 26. Required integrations

Integrations are **product dependencies** for live (non-baseline) snapshots. Spec only — implementation is later Phase B work.

| Integration | Feeds | Screens unlocked beyond baseline |
|-------------|-------|----------------------------------|
| QuickBooks / accounting | GL, cash, expenses, revenue actuals | Finance (live) |
| Banking (read-only) | Cash / balances | Finance cash/runway |
| Google Workspace / Microsoft 365 | Documents, calendar, identity | Citations, deadlines, Ask JAG |
| CRM / SIS / admissions | Pipeline, enrollment, retention | Customers/Students |
| HRIS | Headcount, turnover, hiring | Workforce |
| Grants CRM / foundation DBs | Pipeline funding | Funding opportunities |
| Security posture (optional) | Cyber signals | Risk cyber/systems |
| Email / Slack / Teams | Notification delivery | Notifications |

Until connected: UI must label widgets **"Model baseline — connect data"** per drill-down empty state rules.

---

## 27. Future enhancements (out of B1 build scope)

| Enhancement | Why later |
|-------------|-----------|
| Full offline Ask JAG with on-device summarization | Model/runtime dependency |
| Editable Graph (re-wire soft deps) | Architecture policy: DAG is platform-owned |
| Custom widget marketplace | Needs stable widget SDK |
| Multi-org portfolio CEO view | Pilot is single-org first |
| Voice brief | Mobile polish after core |
| Auto-approve policies | Requires mature Action + authz |
| Live collaboration cursors on Actions | Product ops maturity |

---

## 28. Build acceptance checklist (for implementers)

A screen is done only when:

- [ ] Maps to a screen ID in §20  
- [ ] Every widget has an ID from §21  
- [ ] Every widget declares intelligence domain keys  
- [ ] Every widget has drill-down per §18  
- [ ] Role variations from §17 applied  
- [ ] Empty/low-confidence states implemented  
- [ ] Mobile behavior defined if in §16 phone tabs  
- [ ] Notifications deep-link if they can raise alerts  
- [ ] No invented intelligence domains or fake metrics  

---

## 29. Document control

| Field | Value |
|-------|-------|
| Owner | Product (Executive experience) |
| Depends on | JAG v1.0 intelligence graph (`INTELLIGENCE_MODULE_IDS`) |
| Architecture | Frozen — do not change packages to satisfy UI |
| Next specs | Data Integration Plan (B2), Pilot Deployment Plan, Production Hardening |

**End of Executive Command Center Specification**
