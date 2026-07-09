# Financial Intelligence — Phase 0: General Ledger Foundation (Design Specification)

**Status:** Draft for review · **Author:** Lead Architect, Financial Intelligence
**Date:** 2026-07-09 · **Applies to:** AcademyOS / "The JAG OS" (`school-platform`)
**Prereq reading:** `docs/architecture/platform-services.md`, `docs/architecture/CURRENT_ARCHITECTURE_REPORT.md`
**Scope:** Design specification only. **No implementation code or migrations are authored in this document.** DDL is illustrative spec, not final SQL.

---

## Table of contents

1. Executive summary
2. Business objectives
3. Accounting architecture
4. Chart of Accounts design
5. Fiscal calendar
6. Journal entry model
7. Posting engine
8. Approval workflows
9. Security model
10. Audit trail
11. Budget architecture
12. Dimensions
13. Cost centers
14. Grants
15. Programs
16. Campus accounting
17. Payroll allocation
18. Revenue recognition
19. QuickBooks integration
20. Executive Intelligence integration
21. Database schema
22. Migration plan
23. API plan
24. UI plan
25. Reporting
26. Future phases
27. Risks
28. Implementation roadmap

---

## 0. Finalized architecture decisions (2026-07-09)

Everything in this document is bound by these five decisions. They are not reopened below.

| # | Parameter | Decision |
|---|---|---|
| 1 | **Fiscal year** | **July 1 – June 30.** Period 1 = July … Period 12 = June, Period 13 = adjusting. `fiscal_year` labeled by ending year (FY2027 = Jul 2026 → Jun 2027). |
| 2 | **JE numbering** | **Per-school, FY-prefixed, resets each FY:** `JE-FY2027-000123`. Per-`(school, fiscal_year)` counter under row lock. |
| 3 | **Manual JE approval** | **Threshold only.** Manual entries with amount ≥ per-school threshold → `pending_approval`; else post directly. Adjusting entries not auto-routed. |
| 4 | **COA governance** | **Locked core + school extensions.** Authoritative network UCOA core; schools inherit automatically, add accounts only in reserved ranges, deactivate via overlay, never edit core. Only a network finance admin edits the core. |
| 5 | **UCOA baseline** | **NACUBO / non-profit UCOA core seeded now.** Line dimensions now: program, campus, fund, funding source. FL/GA state object/function codes deferred to Phase 4. |

**GL authority model:** Phased **mirror → authoritative**. The schema is authoritative-grade from day one (all controls enforced immediately); behavior is gated by a per-school `gl_mode` flag (`mirror` in Phases 0–2, `authoritative` from Phase 3). QuickBooks is the operational book of record during mirror; native GL becomes authoritative after reconciliation is proven.

---

## 1. Executive summary

AcademyOS already contains a **deep, real (non-mocked) finance stack**: operational billing/AR (`invoices`, `payments`, `family_billing_accounts`, credits/adjustments, payment plans), funding & scholarships (`funding_sources`, `state_funding_*`, `scholarship_funds`), payroll cost allocation (`payroll_cost_allocations`), a BI/profitability engine (`fi_*`), an executive KPI/reporting layer (`executive_*`, `rpt_*`), and a full dashboard + parent-portal surface. It also has five reusable **Platform Engines** (Workflow, Decision, Event, Intelligence Graph, Automation) plus an Activity/Audit service that every module must build on.

What it lacks is the **accounting spine**: a native double-entry general ledger, chart of accounts, journal entries, trial balance, and financial statements. Today the system treats **QuickBooks as the book of record** (import-only debit/credit in `fi_external_transactions`, plus `exportLedgerForGl()`).

**Phase 0 installs that spine** — a native, double-entry GL with a UCOA chart, a July–June fiscal calendar, balanced journal entries with DB-enforced integrity, a posting-rule model, and mirror-mode reconciliation against QuickBooks — all wired through the existing Platform Engines rather than new ones. It is **strictly additive**: no operational table, dashboard, or portal path changes. Sub-ledgers begin posting into the GL in Phase 2; the mirror flips to authoritative in Phase 3; statements, budgeting, and consolidation land in Phase 4; full fund/grant accounting in Phase 5.

The result at the end of the roadmap is a **CFO-grade Financial Intelligence platform**: GAAP-capable statements, fund accounting for grants/restricted net assets, multi-campus consolidation, budget-vs-actual, AP and bank reconciliation, Square payment capture, and executive/AI intelligence computed on a single authoritative ledger.

---

## 2. Business objectives

| Objective | What Phase 0 contributes | Full-roadmap outcome |
|---|---|---|
| **Single source of financial truth** | Native double-entry GL beneath all sub-ledgers | Authoritative ledger; QuickBooks demoted to reconciliation feed |
| **CFO-grade statements** | COA + balanced journal + trial balance | P&L, Balance Sheet, Cash Flow generated from GL (P4) |
| **Auditability** | Append-only ledger, `recordActivity()` on every mutation, immutable core COA | Defensible audit trail end-to-end (P0→) |
| **Comparability across schools** | Locked core UCOA; consistent codes network-wide | Consolidation, benchmarking, AI on a shared chart |
| **Grant & restricted-fund compliance** | `gl_funds` dimension + net-asset classes on COA | Fund accounting, draw-downs, compliance reporting (P5) |
| **Cost & margin transparency** | Line dimensions map to `fi_allocation_rules` / `payroll_cost_allocations` | Profitability on GL actuals, not heuristics |
| **Forecast/plan accuracy** | Fiscal periods + budget scaffold | Budget-vs-actual, GL-actual-based forecasting (P4) |
| **Executive & AI intelligence** | Events + Decision definitions over GL | KPI engine, insights, recommendations on authoritative data |
| **Multi-state expansion readiness** | UCOA core + program/campus dimensions | FL/GA state reporting via mapping layer (P4) |

Non-goals for Phase 0: statement generation, AP, bank reconciliation, Square, budgeting UI, FL/GA state reports (all sequenced into later phases).

---

## 3. Accounting architecture

**Layered model (additive, "extends, does not replace"):**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Executive Intelligence & Reporting (existing)                         │
│  executive_kpi_*, executive_grants, rpt_* views, dashboards, portal    │
├──────────────────────────────────────────────────────────────────────┤
│  Financial Intelligence / BI (existing)                                │
│  fi_profitability_snapshots, fi_allocation_rules, fi_scenarios, fi_*   │
├──────────────────────────────────────────────────────────────────────┤
│  NEW — General Ledger spine (Phase 0)                                  │
│  gl_chart_of_accounts · gl_journal_entries · gl_journal_lines          │
│  gl_fiscal_periods · gl_posting_rules · gl_funds · reconciliation      │
├──────────────────────────────────────────────────────────────────────┤
│  Sub-ledgers (existing operational)                                    │
│  invoices/payments (AR) · payroll_cost_allocations · scholarship_*     │
│  state_funding_* · [AP: P3] · financial_transactions (legacy)          │
├──────────────────────────────────────────────────────────────────────┤
│  Platform Engines (existing) — Workflow · Decision · Event ·           │
│  Intelligence Graph · Automation · Activity/Audit                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key principles**

1. **Double-entry, always balanced.** Every posted entry has Σdebits = Σcredits, enforced in Postgres (not app code).
2. **Append-only.** Posted entries are immutable; corrections are reversals. This is the audit backbone.
3. **Sub-ledgers post into the GL via events.** AR/payroll/scholarship/state-funding (and later AP) publish domain events; a poster subscribes and creates journal entries from `gl_posting_rules`. No sub-ledger writes the GL directly.
4. **Control accounts reconcile sub-ledgers to the GL.** AR control, cash, deferred tuition revenue, payroll clearing, scholarship liability.
5. **Dimensions, not account explosion.** Program/campus/fund/funding-source live on journal *lines*, matching the existing operational model.
6. **One authoritative chart.** Locked core UCOA; schools extend, never fork.
7. **Mirror before authoritative.** Controls on from day one; cutover gated by reconciliation evidence.

---

## 4. Chart of Accounts design

**Standard:** NACUBO / non-profit UCOA core (Decision #5). Account types: `asset`, `liability`, `net_asset`, `revenue`, `expense`. Net-asset classes (`unrestricted`, `temporarily_restricted`, `permanently_restricted`) and functional-expense categories (`program`, `administration`, `fundraising`) are first-class for non-profit reporting.

**Governance (Decision #4 — locked core + school extensions):**

- **Core rows:** `school_id = null`, `is_core = true`. The single authoritative network chart; all schools inherit automatically (no per-school copy). Editable only by a **network finance admin** (`finance.gl.manage_network_coa`).
- **School extension rows:** `school_id = <school>`, `is_core = false`, `account_code` must fall inside a reserved range (validated against `gl_coa_extension_ranges` per `account_type`). Added via `finance.gl.manage_coa`. May not reuse a core code.
- **Deactivation overlay:** schools cannot edit shared core rows; per-school suppression of an unused core account is recorded in `gl_coa_school_overrides`. Effective activity = core `is_active` AND (no override OR override `is_active`).
- **Postability:** summary/parent rows are `is_postable = false`; only leaf accounts receive journal lines.
- **Consolidation guarantee:** because the core is identical everywhere, consolidation, benchmarking, forecasting, and AI may assume shared core codes.

**Account structure (illustrative core ranges — final ranges TBD with finance):**

| Type | Example core accounts |
|---|---|
| Asset (1xxx) | 1010 Cash – Operating, 1200 Accounts Receivable (control), 1250 Grants Receivable |
| Liability (2xxx) | 2010 Accounts Payable (control), 2300 Deferred Tuition Revenue, 2400 Scholarship Liability, 2500 Payroll Clearing |
| Net assets (3xxx) | 3000 Unrestricted, 3100 Temporarily Restricted, 3200 Permanently Restricted |
| Revenue (4xxx) | 4010 Tuition Revenue, 4100 Scholarship Revenue, 4200 State Funding/ESA, 4300 Grant Revenue, 4400 Contributions |
| Expense (5xxx–7xxx) | 5010 Instructional Salaries, 5100 Benefits, 5200 Payroll Taxes, 6xxx Facility/Technology, 7xxx Administration |

Reserved extension bands (e.g. `x900–x999` per type) are defined in `gl_coa_extension_ranges` at seed time.

---

## 5. Fiscal calendar

**Decision #1: July 1 – June 30.**

- `gl_fiscal_periods`: 12 monthly periods + Period 13 (adjusting), per school per fiscal year.
- `fiscal_year` labeled by ending year: **FY2027 = Jul 1 2026 → Jun 30 2027**, Period 1 = July 2026.
- **Period status lifecycle:** `future → open → pending_close → closed → locked`. Posting is rejected into any period not `open` (enforced in the posting RPC). `locked` is terminal — even adjusting entries require re-opening by a network admin (audited).
- Period seeding is generated per school on onboarding from the fixed July start (no per-school configuration — Decision #1 fixed the boundary network-wide).
- YTD, close, and forecast-vs-actual roll up on this calendar; the existing `budget_forecast_snapshots.period_start/end` continue to work and will be aligned to fiscal periods in P4.

---

## 6. Journal entry model

**Header (`gl_journal_entries`) + lines (`gl_journal_lines`).** One header, ≥2 lines, balanced.

**Numbering (Decision #2):** `JE-FY<yyyy>-<6-digit>`, e.g. `JE-FY2027-000123`; a per-`(school, fiscal_year)` counter increments under row lock; resets each FY. `unique(school_id, entry_number)` holds because FY is embedded.

**Entry types:** `standard`, `recurring`, `adjusting`, `closing`, `opening`, `reversal`, `system_posted` (created by the sub-ledger poster in P2).

**Posting status:** `draft → pending_approval → posted → reversed | void`. Only `posted` entries hit the trial balance.

**Source lineage:** `source_module`, `source_event_type`, `source_reference_type/id` link a system entry back to the invoice/payment/bill/allocation that produced it — the basis for sub-ledger ↔ GL reconciliation and Intelligence Graph edges.

**Immutability & reversal:** posted entries are never mutated. A correction creates a linked `reversal` entry (`reverses_entry_id` / `reversed_by_entry_id`). This preserves a complete, tamper-evident history.

**Mirror flag:** `is_mirror = true` during Phases 0–2 (native entries shadow QuickBooks); `false` once authoritative (Phase 3+). No schema change at cutover — only the flag and `gl_mode`.

**Balance rule (line level):** each line has exactly one of `debit_amount`/`credit_amount` > 0 (both ≥ 0, not both > 0). Header balance (Σdebit = Σcredit) is asserted atomically at post time.

---

## 7. Posting engine

**Atomicity & integrity in Postgres, not app code** (matching existing RPC patterns `calculate_tuition_invoice_totals`, `sync_billing_account_balance`).

`post_gl_journal_entry(p_entry jsonb, p_lines jsonb) → uuid`:
1. Resolve fiscal period; **reject** if status ≠ `open`.
2. Assert Σdebits = Σcredits; reject `unbalanced`.
3. Assert every `account_id` is `is_postable` and belongs to the school (or inherited core).
4. Insert header + lines atomically; assign `entry_number` from the FY counter; set `posted_at`.
5. Return entry id.

**Service `src/lib/financial-intelligence/gl/gl-posting.ts`** (design):
- `postJournalEntry()` → calls RPC, then `recordActivity({eventType:'gl.entry.posted', moduleKey:'finance'})` + `writePlatformAudit()`, then `publishEvent({eventType:'gl.entry.posted'},{persist})`.
- `reverseJournalEntry(entryId, reason)` → linked reversal.
- `createOpeningBalances()` → `opening` entries at go-live/backfill.
- `computeTrialBalance({schoolId, fiscalPeriodId})` → reads `rpt_gl_trial_balance`.

**Posting-rule model (`gl_posting_rules`)** — the event→account map consumed by the Phase 2 sub-ledger poster (declared in P0, fired in P2):

| source_event_type | Debit | Credit | Amount source |
|---|---|---|---|
| `invoice.posted` | AR control | Tuition / Deferred revenue | invoice.total_amount |
| `payment.received` | Cash | AR control | payment.amount |
| `scholarship.disbursed` | Scholarship expense | AR control / Scholarship liability | award.amount |
| `payroll.allocated` | Program payroll expense (by dim) | Payroll clearing | allocation.allocated_amount |
| `state_funding.received` | Cash | AR control / Deferred revenue | receipt.amount |

Selectors resolve accounts by explicit code or by control-type; `dimension_mapping` copies payload fields (program, campus, funding source, student) onto the resulting lines.

---

## 8. Approval workflows

**Manual JE approval (Decision #3 — threshold only):**
- The poster routes a **manual** entry with `amount ≥ school threshold` to `posting_status = 'pending_approval'`; below threshold posts directly (subject to `finance.gl.post`).
- Adjusting entries are **not** auto-routed (accepted tradeoff; revisit if audit flags it).
- System/sub-ledger postings (P2) bypass this — they follow posting rules.

**Engine reuse (do not hand-roll):**
- **Workflow Engine (B-04)** — `gl_manual_journal_approval` (short FSM: `pending_approval → approved(post) | rejected`) and `gl_period_close` (`open → pre_close_review → adjusting → pending_approval → closed → locked`), reusing `approval/framework.ts` for human sign-off. Segregation of duties via the `finance.gl.post` vs `finance.gl.approve` permission split (a poster cannot approve their own over-threshold entry).
- **Decision Engine (B-05)** — `ref_fi_journal_posting_validation` (rules: unbalanced, closed period, direct post to a control account, anomalous amount) and `ref_fi_period_close_readiness` (open sub-ledger items, unreconciled bank/QB variance).

Threshold is stored per school (`school_settings.gl_manual_je_approval_threshold`); value TBD with finance.

---

## 9. Security model

**Auth:** Supabase-only; `middleware.ts` authenticates; authorization in layouts/pages/actions + Postgres RLS. **`getIdentityContext()`** is the canonical authorization context (permissions, org assignments, accessible schools, enterprise-admin flags).

**New permission keys** (seeded into `platform_permissions`/`platform_role_permissions`, `module='finance'`, category `general_ledger`):

| Key | Scope | Grant to |
|---|---|---|
| `finance.gl.view` | Read GL/trial balance | FINANCE, SCHOOL_LEADER, CEO, EXECUTIVE_DIRECTOR, FOUNDER |
| `finance.gl.post` | Create/post entries | FINANCE, EXECUTIVE_DIRECTOR |
| `finance.gl.approve` | Approve over-threshold / close | EXECUTIVE_DIRECTOR, CEO, FOUNDER |
| `finance.gl.reverse` | Reverse entries | FINANCE, EXECUTIVE_DIRECTOR |
| `finance.gl.manage_coa` | **School extension accounts only** | EXECUTIVE_DIRECTOR, CEO, FOUNDER |
| `finance.gl.manage_network_coa` | **Core UCOA template only** | FOUNDER (network finance admin) |
| `finance.gl.close_period` | Period close/lock | EXECUTIVE_DIRECTOR, CEO, FOUNDER |

**RLS (paired `_rls` migration):**
- All `gl_*` school-scoped tables: staff policy `can_access_school(school_id)` for select/all.
- Core template rows (`school_id is null` on `gl_chart_of_accounts`, `gl_posting_rules`): `select` to all authenticated; writes only under `finance.gl.manage_network_coa`.
- School COA extensions + `gl_coa_school_overrides`: `can_access_school` + `finance.gl.manage_coa`.
- **No guardian access** to any `gl_*` table (unlike billing tables, which expose `is_guardian_of_family` policies).

**Guard layers:** page `requirePagePermission`, API `guardApiRoute`, action `assertPermission`, plus row-level RLS. Separation of duties enforced by permission split + workflow approver ≠ poster.

---

## 10. Audit trail

**Reuses the platform Activity/Audit stack — no new audit table.**

- Every GL mutation calls `recordActivity()` (catalog event type) → dual-writes `platform_activity_events` + legacy `platform_timeline_events`, fans out to Integration Hub.
- `writePlatformAudit()` records the security-relevant action in `platform_audit_events`.
- **Append-only ledger** = the primary audit guarantee: posted entries are immutable; every change is a new (reversal) entry with full lineage.
- **Event persistence:** `gl.entry.posted` / `gl.entry.reversed` / `gl.period.closed` envelopes persist to `platform_event_records` (replayable).
- **Decision persistence:** posting-validation and close-readiness decisions persist to `platform_decision_records` with explainability.
- **Intelligence Graph:** reference edges (`journal_entry.affects.account`, `journal_entry.sourced_from.invoice`) via the existing `"persisted"` provider (`recordGraphEdge`) — no new provider key (the union is closed).
- **Immutable core COA + period lock** ensure structural changes and closed-period edits are traceable and controlled.

Retention/whodunit: `created_by`, `posted_by`, `closed_by`, `reconciled_by`, `updated_by` on all relevant tables (FK to `users`, `on delete set null`), consistent with the codebase's actor-column convention.

---

## 11. Budget architecture

**Phase 0 scaffolds; Phase 4 delivers the module.** Existing `budget_forecast_snapshots` (forecast-vs-actual rollup) and `executive_strategic_goals.budget_amount` remain.

**Target design (P4, specified now so the GL is shaped for it):**
- `gl_budgets` (header: school_id, fiscal_year, scenario/version, status) + `gl_budget_lines` (account_id × fiscal_period × dimensions {program, campus, fund} × amount).
- **Budget-vs-actual** = `gl_budget_lines` joined to posted `gl_journal_lines` on account + period + dimensions → variance views (`rpt_gl_budget_variance`).
- Budget approval reuses the Workflow Engine; variance alerts route through Automation → Mission Control (reusing `financial-intelligence/automation.ts`).
- Budgets carry the **same line dimensions** as the GL, so variance can be sliced by program/campus/fund with no mapping.

Because dimensions and periods are fixed in Phase 0, the budget module in P4 is a pure additive layer.

---

## 12. Dimensions

**Hybrid COA principle:** analytic granularity lives on **journal lines**, not in account codes. Line dimensions (all mapping to existing operational keys):

| Dimension | Column | Maps to existing |
|---|---|---|
| Program | `program` (text) | Same enum used across `invoices`, `tuition_plans`, `payroll_cost_allocations`, `rpt_financial_kpis` |
| Campus | `campus_id` | `campuses` (multi-campus scope) |
| Fund | `fund_id` | `gl_funds` → links `scholarship_funds`, `executive_grants` |
| Funding source | `funding_source_code` | `funding_sources.code` (parent/ESA/scholarship/grant/...) |
| Grant | `grant_id` | `executive_grants` |
| Student | `student_id` | `students` (unit economics) |
| Employee | `employee_id` | `employees` (payroll allocation) |
| Generic | `entity_type` / `entity_id` | polymorphic, mirrors `financial_transactions` |

**Payoff:** `fi_allocation_rules` (methods enrollment/instructional_hours/revenue/square_feet/headcount/fixed) and `payroll_cost_allocations` output posts to GL lines **without a translation layer**, and profitability/consolidation can group by any dimension directly.

---

## 13. Cost centers

Cost centers are expressed through the **campus + program + fund** dimension combination rather than a separate cost-center table:

- A **cost center** = (campus_id, program) for operating costs; grant/restricted costs add fund_id.
- The existing **cost-allocation engine** (`fi_allocation_rules` + `financial-intelligence/cost-allocation.ts`) computes allocations by method; Phase 2 posts allocated amounts to GL expense accounts tagged with the cost-center dimensions.
- Direct costs (payroll) flow from `payroll_cost_allocations` (already program/funding/grant-tagged) → `payroll.allocated` event → GL.
- Reporting rolls costs up campus → school → region → org via the dimension keys (see §16).

No new cost-center entity is introduced — this avoids duplicating the dimension model.

---

## 14. Grants

**Existing:** `executive_grants` (pipeline stage, `award_amount`, `spent_amount`, `restricted_fund`, `reporting_deadline`, funder/donor), `grant_credit` on invoices, `grant_code` on `payroll_cost_allocations`.

**Phase 0 scaffold:** `gl_funds` rows of `fund_type = 'grant'` link to `executive_grants` (`linked_grant_id`); GL lines carry `grant_id`, so grant revenue/expense is captured on the ledger from the first posting.

**Phase 5 (full grant accounting):**
- Grant budget + expense ledger (draw-down tracking: awarded vs spent vs remaining computed from posted GL lines by `grant_id`).
- Restricted-revenue recognition and net-asset release (temporarily restricted → unrestricted as grant conditions are met).
- Compliance reporting against `executive_grants.reporting_deadline`, reusing the **Universal Deadline Engine** (migration `098`) and Automation → Mission Control alerts (`grant_compliance` alert type already exists in `fi_financial_alerts`).

---

## 15. Programs

`program` is a first-class line dimension (Decision #5). Program values reuse the existing constrained set (`academy_fl_campus`, `academy_fl_virtual`, `academy_ga_campus`, `academy_ga_hybrid`, `academy_hs`, `academy_virtual`).

- Program-level P&L = GL lines grouped by `program` (revenue accounts − expense accounts).
- Feeds the existing **program profitability** engine (`fi_profitability_snapshots` where `entity_type='program'`, `rpt_fi_program_profitability`) — Phase 2 makes those computations GL-actual-based instead of derived from operational tables.
- Program remains orthogonal to campus and fund, so a virtual program spanning campuses reports cleanly.

---

## 16. Campus accounting

**Multi-campus is a core Phase 0 concern** because consolidation depends on it.

- `campus_id` on every journal line; `campuses` is `school_id`-scoped within the org hierarchy `org_organizations → org_regions → schools → campuses`.
- **Consolidation** rolls posted GL lines up the hierarchy: campus → school → region → org, grouping on the shared core COA codes (guaranteed identical by Decision #4).
- Inter-campus/inter-entity transactions use the `entity_type/entity_id` dimension and dedicated elimination accounts (defined in P4 when consolidated statements are generated; eliminations are out of scope for P0 postings).
- The existing campus-aware surfaces (`executive_kpi_snapshots.campus_id`, `fi_profitability_snapshots` `entity_type='campus'`) become GL-backed in P2/P4.
- **Reporting views** currently school-level (`rpt_financial_kpis`) gain campus grouping in P4.

---

## 17. Payroll allocation

**Existing (reuse):** `payroll_records`, `payroll_cost_allocations` (allocation by program/funding_source/grant/student via instructional minutes), `contractor_pay_ledger`, and `allocatePayrollFromScheduling()` in `finance/payroll-allocation.ts` (allocates by instructional minutes from `instructional_sessions`).

**GL integration:**
- Phase 2: an approved payroll allocation raises `payroll.allocated`; the poster maps it via `gl_posting_rules` to **Dr program payroll expense** (dimension-tagged with program/campus/fund/grant/employee) / **Cr payroll clearing**; the payroll cash payment clears the clearing account.
- Benefits and payroll-tax estimates (`financial-intelligence/cost-allocation.ts` `estimatePayrollCosts`) post to their UCOA expense accounts with the same dimensions.
- Because `payroll_cost_allocations` is already dimension-tagged, no remodeling is needed — it maps 1:1 onto GL lines.

---

## 18. Revenue recognition

Native double-entry enables proper recognition (vs. today's cash/operational view):

- **Tuition:** on invoice → **Dr AR control / Cr Deferred Tuition Revenue** (`2300`); recognized ratably over the service period (monthly, aligned to fiscal periods) via recurring `system_posted` entries **Dr Deferred / Cr Tuition Revenue** (`4010`). Payment → **Dr Cash / Cr AR control**.
- **Scholarships:** award/disbursement → scholarship expense / contra-revenue per policy, tied to `scholarship_award_payments` and `scholarship_funds`.
- **State funding/ESA:** expected (`state_funding_expected_payments`) vs received (`state_funding_received_payments`) → receivable/deferred handling; recognition on the funded service period.
- **Grants:** restricted revenue recognized as conditions are met, with net-asset release (P5).
- **Sibling discounts, credits, adjustments, late fees:** already modeled operationally (`invoice_line_items`, `billing_credits`, `billing_adjustments`); posting rules map each `line_type` to the correct revenue/contra account.

Recognition rules are expressed as `gl_posting_rules` + recurring entries, so policy changes are configuration, not code. Phase 0 defines the rule set; Phase 2 activates posting; the deferred-revenue mechanics make P4 statements GAAP-capable.

---

## 19. QuickBooks integration

**Existing:** `fi_import_batches`, `fi_external_accounts` (imported COA mirror), `fi_external_transactions` (imported GL lines with debit/credit + `reconciliation_status`), plus `financial-intelligence/quickbooks-import.ts` / `csv-import.ts` and `exportLedgerForGl()`.

**Mirror phase (P0–P2):** QuickBooks remains the **book of record**. Native GL postings run and are fully validated but flagged `is_mirror = true`. `gl_reconciliation_batches` compares native vs QuickBooks balances per fiscal period, linking to `fi_import_batches`. Imported QuickBooks COA maps to core accounts via `gl_chart_of_accounts.external_account_id`.

**Cutover to authoritative (P3):** once per-period reconciliation variance is consistently zero, set `gl_mode = 'authoritative'`; new native entries are `is_mirror = false`; QuickBooks import demotes to a **reconciliation-only** feed (or is retired). **No schema change** — only the flag and reconciliation history gate the flip.

This preserves the current QuickBooks workflow with zero disruption while the native ledger earns trust.

---

## 20. Executive Intelligence integration

The GL becomes the **authoritative feed** for the existing executive/BI layer — replacing heuristic multipliers with actuals:

- **KPI Engine** (`executive_kpi_definitions`/`_snapshots`, `executive/kpi-center.ts`): `collection_rate`, `operating_margin`, `grant_utilization` recomputed from GL. New GL-native KPIs (e.g. days-cash-on-hand, net-asset ratios).
- **Profitability engine** (`fi_profitability_snapshots`): P2 makes class/teacher/program/student/school/campus margins GL-actual-based.
- **Forecasting** (`budget_forecast_snapshots`, `executive_forecast_scenarios`, `fi_scenarios`, `projectCashBurn`): baselines shift from operational heuristics to GL actuals.
- **Decision Engine**: FI decisions (budget-variance priority, collection risk, grant-compliance risk) score on GL data and raise **Mission Control** items.
- **Board/executive reporting** (`/api/finance/board-export`, `/api/executive/board-export`, `executive_report_templates`): board packs sourced from GL statements (P4).
- **Intelligence Graph**: GL edges enrich cross-domain traversal (entity → journal impact → account → fund/grant).

No new intelligence engine is built — FI registers definitions into the existing engines.

---

## 21. Database schema

New tables (all `public` schema, `gl_` prefix, `numeric(14,2)` money, `school_id` tenant scope, network templates `school_id = null`). DDL is illustrative spec.

**21.1 `gl_chart_of_accounts`** — UCOA account master; `is_core`, `is_postable`, `net_asset_class`, `functional_category`, `is_control_account`/`control_type`, `parent_account_id`, `source_system`, `external_account_id` (→ `fi_external_accounts`). `unique(school_id, account_code)`.

**21.2 `gl_coa_extension_ranges`** — reserved code bands per `account_type` (`code_low`/`code_high`) for school extension accounts.

**21.3 `gl_coa_school_overrides`** — per-school deactivation overlay for inherited core accounts. `unique(school_id, account_id)`.

**21.4 `gl_fiscal_periods`** — `fiscal_year`, `period_number` (1–13), `period_start/end`, `status` (`future/open/pending_close/closed/locked`), `closed_by/at`. `unique(school_id, fiscal_year, period_number)`.

**21.5 `gl_journal_entries`** — header; `entry_number`, `entry_date`, `fiscal_period_id`, `entry_type`, `source_module/event_type/reference_*`, `posting_status`, `is_mirror`, `reverses_entry_id`/`reversed_by_entry_id`, `approval_workflow_instance_id`, `posted_at/by`. `unique(school_id, entry_number)`.

**21.6 `gl_journal_lines`** — detail; `account_id`, `debit_amount`/`credit_amount` (checks: both ≥ 0, not both > 0, at least one > 0), dimensions (`campus_id`, `program`, `fund_id`, `funding_source_code`, `grant_id`, `student_id`, `employee_id`, `entity_type/id`), `memo`. Indexes on entry, account, and dimension tuple.

**21.7 `gl_funds`** — fund registry; `fund_code`, `fund_type`, `net_asset_class`, `linked_scholarship_fund_id`, `linked_grant_id`. `unique(school_id, fund_code)`.

**21.8 `gl_posting_rules`** — event→account map; `source_event_type`, `trigger_condition` jsonb, `debit_account_selector`/`credit_account_selector` jsonb, `amount_source`, `dimension_mapping` jsonb, `priority`, effective dating. Network defaults `school_id = null`.

**21.9 `gl_reconciliation_batches`** — mirror-phase control; `fiscal_period_id`, `qb_import_batch_id` (→ `fi_import_batches`), `native_balance`, `qb_balance`, `variance`, `status`, `reconciled_by/at`.

**21.10 Views:** `rpt_gl_trial_balance` (posted lines grouped by school/period/account with debit/credit totals and net). Materialized `gl_account_balances` deferred to P4.

**21.11 RPC:** `post_gl_journal_entry(jsonb, jsonb) → uuid` (atomic, balance-enforcing, period-guarded, entry-number-assigning).

**Config:** `school_settings.gl_mode` (`mirror`/`authoritative`, default `mirror`), `school_settings.gl_manual_je_approval_threshold`.

Full column-level DDL was drafted in the prior revision of this spec and will be reproduced verbatim in the migration files at build time.

---

## 22. Migration plan

House convention: paired `_foundation.sql` (DDL) + `_rls.sql`, idempotent, sequential numbering after `155`.

| Migration | Contents |
|---|---|
| `156_release_gl_foundation.sql` | Tables 21.1–21.9, trial-balance view (21.10), `post_gl_journal_entry` RPC (21.11), NACUBO UCOA core seed (`is_core=true`), extension-range seed, default `gl_posting_rules`, `gl_mode`/threshold columns. |
| `157_release_gl_foundation_rls.sql` | RLS enable + policies (§9), permission-key seeds + role grants. |

**Data migration:** one-time backfill job maps historical `financial_transactions` → `opening` GL entries (`entry_type='opening'`, `is_mirror=true`), establishing opening balances without disturbing operational tables.

**Ordering & safety:** additive only; no `alter`/`drop` on existing finance tables except adding `school_settings` columns. Fully reversible (drop new `gl_*` objects). `npm run build` runs all platform validators + the new GL registry validator before `next build`.

---

## 23. API plan

New route handlers under `src/app/api/finance/gl/` (all permission-guarded via `guardApiRoute`, real Supabase data):

| Route | Method | Guard | Purpose |
|---|---|---|---|
| `/api/finance/gl/journal` | POST | `finance.gl.post` | Create/post a manual journal entry (routes to approval if ≥ threshold) |
| `/api/finance/gl/journal/[id]/reverse` | POST | `finance.gl.reverse` | Reverse a posted entry |
| `/api/finance/gl/trial-balance` | GET | `finance.gl.view` | Trial balance for school/period (JSON + CSV) |
| `/api/finance/gl/coa` | GET/POST | view / `manage_coa` | List effective COA; add school extension account |
| `/api/finance/gl/periods/[id]/close` | POST | `finance.gl.close_period` | Initiate period-close workflow |
| `/api/finance/gl/reconciliation` | GET/POST | `finance.gl.view`/`manage` | Mirror reconciliation batch vs QuickBooks import |

Server actions (`"use server"`) in `gl/actions.ts` mirror these for form-driven UI, each `assertPermission`-guarded and routed through `recordActivity()`.

---

## 24. UI plan

New workspace at `/dashboard/finance/gl/` (gated by `finance.gl.view`), reusing existing primitives — **no new component system**:

- **GL overview** — `StatCard`s (net income MTD/YTD, cash position, unposted count, open period) + trial-balance snapshot. Upgrade AR-aging/revenue lists to the existing `BarChart`/`DonutChart` (`workspace-design-system/charts/`).
- **Journal entries** — `ViewTabs` + entry table (reuse `InvoiceList` table pattern) + create form (reuse `BillingForms` patterns); approval queue for over-threshold entries.
- **Chart of Accounts** — hierarchical account tree; core rows read-only badge; add-extension form (school admins); network-admin core editor behind `finance.gl.manage_network_coa`.
- **Trial balance & period close** — trial-balance report (CSV export) + period-close checklist driven by the close workflow.
- **Reconciliation** — mirror-phase native-vs-QuickBooks variance view.

Chrome reuses `FinanceExperienceShell`, `PageHeader`, `ViewTabs`, `EmptyState`, `Metric`/`StatCard`, `formatCurrency`. Registration wired via `import "@/lib/financial-intelligence/registry/register"` in `src/app/dashboard/finance/layout.tsx`.

---

## 25. Reporting

**Phase 0:** `rpt_gl_trial_balance` (the proof the ledger is balanced and queryable) + CSV export through the existing board-export pattern (`buildFinanceBoardExport`, `/api/finance/board-export`).

**Phase 4 (GL-derived statements):** `rpt_gl_income_statement` (P&L by period/program/campus/fund), `rpt_gl_balance_sheet` (with net-asset classes), `rpt_gl_cash_flow`, `rpt_gl_budget_variance`, and multi-campus consolidation views. These extend the existing `rpt_*` view family and feed `executive_report_templates`/board packs.

**Reuse:** existing CSV builders (`financial-intelligence/reporting.ts`), executive board export, and the Enterprise Data Platform export surface (`fi.import`/export). Statements are reconciled back to QuickBooks during mirror, generated natively after cutover.

---

## 26. Future phases

| Phase | Delivers | Key targets closed |
|---|---|---|
| **P1** | Journal-entry UI polish, recurring/adjusting entries, trial balance, period close | Journal Entries, Trial Balance |
| **P2** | Sub-ledger posters (AR/payroll/scholarship/state-funding) via Event Engine; control-account reconciliation; profitability on GL actuals | GL made real; #6/#15/#16 GL-backed |
| **P3** | Accounts Payable (vendors/bills/payments), Bank Reconciliation, **Square** payment capture; **flip to authoritative** | AP, Bank Rec, Square |
| **P4** | Financial statements (P&L/BS/Cash Flow), budgeting + budget-vs-actual, multi-campus consolidation, FL/GA state codes + mapping | Statements, Budgeting, Cash Flow, Multi-campus |
| **P5** | Fund & grant accounting (restricted net assets, draw-downs, compliance), executive/AI enrichment on authoritative GL | Grant Accounting, Restricted Funds, deepened KPI/Forecasting |

---

## 27. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Dual-book divergence during mirror** | Native GL and QuickBooks disagree | `gl_reconciliation_batches` per period; do not flip to authoritative until variance is consistently zero |
| **Unbalanced/incorrect postings** | Corrupt ledger | Balance + period + postability enforced in `post_gl_journal_entry` RPC; append-only + reversals; posting-validation Decision rules |
| **Posting-rule misconfiguration (P2)** | Wrong accounts hit | Network-default rules reviewed by finance; rules are effective-dated + auditable; reconciliation catches drift |
| **COA governance drift** | Loss of comparability | Locked immutable core; extensions only in reserved ranges; core edits gated to network admin + audited |
| **Revenue-recognition policy errors** | Misstated statements | Recognition as configurable rules + recurring entries; deferred-revenue control accounts; reviewed before P4 statements |
| **Performance at scale** | Slow trial balance/statements | Indexed lines; materialized `gl_account_balances` in P4; period-scoped queries |
| **Scope creep into P2+ during P0** | Delivery risk | Hard scope gate: P0 is spine + mirror only; posters/AP/Square/statements explicitly deferred |
| **Permission/RLS gaps** | Unauthorized GL access | New keys + paired RLS; no guardian access; separation of duties (poster ≠ approver); RLS probes in tests |
| **State-reporting assumptions** | FL/GA rework | State codes deferred to P4 as line dimensions + mapping layer; UCOA core chosen to map cleanly |

---

## 28. Implementation roadmap

**Phase 0 — GL Foundation (this spec).** COA (locked core + extensions), July–June fiscal calendar, balanced double-entry journal, posting RPC + rule model (declared), mirror reconciliation, trial balance, permissions/RLS, engine registrations (Event/Workflow/Decision/Graph/Activity). `gl_mode='mirror'`; nothing in the live path changes.

**Phase 1 — Journal & close UX.** Manual/recurring/adjusting entries UI, approval queue, trial-balance screen, period-close workflow.

**Phase 2 — Sub-ledger → GL.** Publish + subscribe AR/payroll/scholarship/state-funding events; poster maps via rules to control accounts; reconcile sub-ledgers; backfill; profitability on GL actuals.

**Phase 3 — Cash cycle + cutover.** Accounts Payable, Bank Reconciliation, Square integration; flip `gl_mode='authoritative'` once reconciliation is clean.

**Phase 4 — Statements, budgeting, consolidation.** P&L/Balance Sheet/Cash Flow from GL; budget module + variance; multi-campus consolidation; FL/GA state codes + mapping; chart upgrades.

**Phase 5 — Fund/grant accounting + intelligence.** Restricted net assets, grant draw-downs + compliance (Universal Deadline Engine), executive/AI enrichment and GL-actual forecasting.

**Cross-cutting each phase:** `recordActivity()` + `writePlatformAudit()` on every mutation; registry convention + build-gate validator; paired `_foundation`/`_rls` migrations with `school_id` scope; reuse existing UI primitives and Platform Engines — never a parallel path.

### Non-blocking implementation-detail inputs (needed before/at build, not for design)
1. Manual-JE approval **threshold amount** (and whether it varies by school/campus).
2. Specific **NACUBO UCOA edition/version** to seed as the core template.
3. Exact **reserved extension code ranges** per account type for `gl_coa_extension_ranges`.

---

*Status: architecture finalized; specification complete. **No implementation code or migrations generated.** Next step on explicit go-ahead: author the `156`/`157` migration pair + `gl/` service scaffold + registry behind the build gate, with `gl_mode='mirror'`.*
