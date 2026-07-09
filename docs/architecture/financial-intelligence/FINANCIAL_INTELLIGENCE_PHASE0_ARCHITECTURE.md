# Financial Intelligence — Phase 0 Architecture

**Status:** Finalized architecture (design only) · **Date:** 2026-07-09
**Owner:** Lead Architect, Financial Intelligence · **Platform:** AcademyOS / "The JAG OS" (`school-platform`)
**Companion document:** `docs/architecture/FINANCIAL_INTELLIGENCE_PHASE0_GL_SPEC.md` (full 28-section specification)
**Scope:** Architecture and decisions only. **No code or migrations.**

> This document captures the finalized Financial Intelligence Phase 0 architecture: the vision, the general-ledger foundation, and the ten decision areas locked on 2026-07-09. It is the canonical orientation doc; the companion GL_SPEC holds the exhaustive table/DDL/API/UI detail.

---

## 1. Financial Intelligence vision

AcademyOS already runs a **real, non-mocked** finance stack — operational billing/AR, funding & scholarships, payroll cost allocation, a profitability/BI engine (`fi_*`), and an executive KPI/reporting layer — on top of five reusable Platform Engines (Workflow, Decision, Event, Intelligence Graph, Automation) and an Activity/Audit service.

What it lacks is the **accounting spine**. Today QuickBooks is the book of record; the platform imports debit/credit data (`fi_external_transactions`) and exports for external GL. The vision for Financial Intelligence is to make AcademyOS itself a **CFO-grade financial system of record and intelligence platform**:

- A **native double-entry general ledger** as the single source of financial truth.
- **GAAP-capable financial statements**, fund accounting for grants and restricted net assets, and multi-campus consolidation.
- **Comparability across the network** through one authoritative chart of accounts.
- **Executive and AI intelligence computed on authoritative actuals**, not heuristics.
- **Stakeholder-facing financial transparency** — parents, executives, board, and funders each see the financial truth relevant to them, governed by permissions.

**Guiding principles**

1. **Additive, never a rewrite.** Every operational table, dashboard, and portal path stays; the GL is installed beneath them.
2. **One source of truth.** Sub-ledgers post into the GL; nothing computes financial truth in parallel.
3. **Reuse the Platform Engines.** All intelligent behavior registers into the existing engines — no new engines, no parallel paths.
4. **Auditable by construction.** Append-only ledger, immutable core chart, `recordActivity()` on every mutation.
5. **Mirror before authoritative.** Controls enforced from day one; QuickBooks stays authoritative until native reconciliation is proven.

---

## 2. GL architecture

**Model:** native double-entry general ledger, layered additively:

```
Executive Intelligence & Reporting (existing) — KPIs, board packs, dashboards, portal
Financial Intelligence / BI (existing)         — fi_profitability_snapshots, fi_allocation_rules, fi_scenarios
NEW — General Ledger spine (Phase 0)           — chart of accounts · journal entries · lines
                                                  fiscal periods · posting rules · funds · reconciliation
Sub-ledgers (existing operational)             — invoices/payments (AR) · payroll_cost_allocations
                                                  scholarship_* · state_funding_* · [AP: Phase 3]
Platform Engines (existing)                    — Workflow · Decision · Event · Graph · Automation · Activity
```

**Core objects (new, `gl_` prefix):** `gl_chart_of_accounts`, `gl_coa_extension_ranges`, `gl_coa_school_overrides`, `gl_fiscal_periods`, `gl_journal_entries`, `gl_journal_lines`, `gl_funds`, `gl_posting_rules`, `gl_reconciliation_batches`, plus a `rpt_gl_trial_balance` view and an atomic `post_gl_journal_entry` RPC.

**Integrity guarantees**

- **Balanced, always:** every posted entry has Σdebits = Σcredits, enforced in Postgres (the posting RPC), not in app code.
- **Append-only:** posted entries are immutable; corrections are linked reversals.
- **Period-guarded:** postings rejected into any period not `open`.
- **Dimensions on lines, not accounts:** program/campus/fund/funding-source live on journal lines and map 1:1 to the existing operational model (see §5 COA governance and the GL_SPEC dimension section).

**Authority model — phased mirror → authoritative.** The schema is authoritative-grade from day one; a per-school `gl_mode` flag (`mirror` | `authoritative`) gates behavior. In Phases 0–2 native entries shadow QuickBooks (`is_mirror = true`); once `gl_reconciliation_batches` shows consistently zero variance per period, Phase 3 flips `gl_mode = 'authoritative'` with **no schema change**.

**Sub-ledger posting.** Operational modules publish domain events (`invoice.posted`, `payment.received`, `payroll.allocated`, `scholarship.disbursed`, `state_funding.received`); a poster subscribes and creates journal entries from `gl_posting_rules`, hitting control accounts (AR, cash, deferred revenue, payroll clearing, scholarship liability). Rules are declared in Phase 0 and activated in Phase 2.

---

## 3. Journal numbering

**Decision:** per-school, fiscal-year-prefixed, resets each fiscal year.

- **Format:** `JE-FY<yyyy>-<6-digit>` → e.g. `JE-FY2027-000123`.
- **Fiscal year:** July 1 – June 30; `fiscal_year` labeled by ending year (FY2027 = Jul 2026 → Jun 2027). Sequence resets to `000001` on July 1.
- **Generation:** a per-`(school, fiscal_year)` counter increments under row lock at post time.
- **Uniqueness:** `unique(school_id, entry_number)` holds because the fiscal year is embedded in the string.
- **Auditability:** contiguous per-FY numbering makes gap detection trivial for auditors; the FY prefix makes every entry self-describing.

Sub-ledger/system entries share the same sequence and format (`entry_type = 'system_posted'`), so origin is captured via `source_module`/`source_event_type`, not via a divergent number scheme.

---

## 4. Approval workflow

**Decision:** threshold-only approval for **manual** journal entries.

- Manual entries with `amount ≥ per-school threshold` route to `posting_status = 'pending_approval'`; below threshold they post directly (subject to `finance.gl.post`).
- **Adjusting entries are not auto-routed** (accepted tradeoff — a large adjusting entry below threshold skips review; revisit if audit flags it).
- **System/sub-ledger postings bypass approval** — they follow posting rules deterministically.

**Engine reuse (no hand-rolled logic):**

- **Workflow Engine (B-04):**
  - `gl_manual_journal_approval` — short FSM `pending_approval → approved (post) | rejected`.
  - `gl_period_close` — `open → pre_close_review → adjusting → pending_approval → closed → locked`, reusing `approval/framework.ts`.
- **Decision Engine (B-05):**
  - `ref_fi_journal_posting_validation` — rules for unbalanced, closed period, direct-post-to-control-account, anomalous amount.
  - `ref_fi_period_close_readiness` — open sub-ledger items, unreconciled QuickBooks/bank variance.

**Separation of duties:** the `finance.gl.post` and `finance.gl.approve` permissions are distinct; an approver must differ from the poster on over-threshold entries. Threshold value stored per school (`school_settings.gl_manual_je_approval_threshold`, value TBD with finance).

---

## 5. COA governance

**Decision:** locked core + school extensions. One authoritative network chart; schools inherit and extend, never fork.

- **Core rows** — `school_id = null`, `is_core = true`. The single authoritative network chart, inherited automatically by every school (no per-school copy). **Editable only by a network finance admin** (`finance.gl.manage_network_coa`). Core accounts cannot be deleted, renumbered, or redefined by a school.
- **School extension rows** — `school_id = <school>`, `is_core = false`. Added via `finance.gl.manage_coa`, and only within **reserved code ranges** validated against `gl_coa_extension_ranges` per `account_type`. May not reuse a core code.
- **Deactivation overlay** — a school cannot edit a shared core row, so per-school suppression of an unused core account is recorded in `gl_coa_school_overrides`. Effective activity = core `is_active` AND (no override OR override `is_active`).
- **Postability** — summary/parent accounts are `is_postable = false`; only leaf accounts receive lines.

**Why locked-core matters:** Financial Intelligence, dashboards, consolidation, forecasting, benchmarking, and AI all depend on a consistent core chart. Because the core codes are identical everywhere, cross-school reporting can group on shared codes with no mapping layer. The extension model provides local flexibility without sacrificing comparability.

---

## 6. UCOA decisions

**Decision:** seed the **NACUBO / non-profit Unified Chart of Accounts** as the core template now.

- **Account types:** `asset`, `liability`, `net_asset`, `revenue`, `expense`.
- **Non-profit first-class concepts:** net-asset classes (`unrestricted`, `temporarily_restricted`, `permanently_restricted`) and functional-expense categories (`program`, `administration`, `fundraising`) — required for non-profit statements and net-asset release (grants/restricted funds in Phase 5).
- **Control accounts:** AR, AP, cash, deferred tuition revenue, scholarship liability, payroll clearing — the reconciliation points between sub-ledgers and the GL.
- **Analytic granularity via dimensions, not account explosion:** program, campus, fund, and funding source are carried on journal **lines**, mapping directly onto the existing `fi_allocation_rules`, `payroll_cost_allocations`, `funding_sources`, and `executive_grants`.
- **Seeding:** core template seeded as `is_core = true`, `school_id = null` (mirroring the `fi_allocation_rules` network-default pattern). Schools inherit directly; they do not clone it.

Implementation-detail inputs still needed at build time: the exact NACUBO edition/version, and the reserved extension code ranges per account type.

---

## 7. State reporting strategy

**Decision:** defer state-specific reporting codes to **Phase 4**; keep Phase 0 on the clean UCOA core.

- **Context:** the network operates Florida and Georgia programs (`academy_fl_*`, `academy_ga_*`). State DOE / charter financial reporting typically requires object / function / program code dimensions.
- **Phase 0:** carry only the general dimensions (program, campus, fund, funding source) on journal lines. Do **not** model FL/GA object/function codes yet — this keeps Phase 0 lean and avoids premature modeling.
- **Phase 4:** add `state_object_code` / `state_function_code` as additional journal-line dimensions, plus a **state-report mapping layer** that crosswalks UCOA accounts + dimensions to each state's required chart. State financial reports are generated at the reporting layer, not by restructuring the GL.
- **Why UCOA as the base (not the state chart):** UCOA gives clean GAAP non-profit statements and network-wide comparability; state charts become mapped outputs. This preserves one authoritative internal chart while satisfying multi-state compliance as an additive reporting concern.

---

## 8. Executive Intelligence integration

The GL becomes the **authoritative feed** for the existing executive/BI layer, replacing heuristic multipliers with actuals. No new intelligence engine is built — Financial Intelligence registers definitions into the existing engines.

- **KPI Engine** (`executive_kpi_definitions`/`_snapshots`, `executive/kpi-center.ts`): `collection_rate`, `operating_margin`, `grant_utilization` recomputed from GL; new GL-native KPIs (days-cash-on-hand, net-asset ratios).
- **Profitability engine** (`fi_profitability_snapshots`, `rpt_fi_*`): class/teacher/program/student/school/campus margins become GL-actual-based (Phase 2).
- **Forecasting** (`budget_forecast_snapshots`, `executive_forecast_scenarios`, `fi_scenarios`, `projectCashBurn`): baselines shift from operational heuristics to GL actuals.
- **Decision Engine (B-05):** FI decisions (budget-variance priority, collection risk, grant-compliance risk) score on GL data and raise **Mission Control** items via the Automation Engine — reusing the path `financial-intelligence/automation.ts` already uses.
- **Board / executive reporting** (`/api/finance/board-export`, `/api/executive/board-export`, `executive_report_templates`): board packs sourced from GL-derived statements (Phase 4).
- **Intelligence Graph (B-07):** GL reference edges (`journal_entry.affects.account`, `journal_entry.sourced_from.invoice`) via the existing `"persisted"` provider — no new provider key.

---

## 9. Stakeholder Intelligence integration

Financial Intelligence surfaces the right financial truth to each stakeholder, governed by permissions and RLS. Every surface reads from the GL (or GL-derived views) once posting is live, so all audiences see numbers reconciled to one ledger.

| Stakeholder | Existing surface (reused) | What GL adds | Access control |
|---|---|---|---|
| **Parents / guardians** | `FamilyFinancialCenter` (`/portal/finance`, `/apply/portal/finance`), `ParentDashboard` outstanding-balance tile | Billing balances remain sub-ledger (AR); GL reconciles AR control behind the scenes — parents see a single trustworthy balance | `is_guardian_of_family` RLS; **no direct GL access** |
| **School leaders** | Finance & Intelligence dashboards (`/dashboard/finance/*`) | School-scoped GL trial balance, statements, budget-vs-actual | `finance.gl.view`, `can_access_school` |
| **Executives / CFO** | Executive command center, FI executive overview, forecasting | Authoritative statements, margins, cash position, scenario baselines on GL actuals | `finance.gl.view` + executive keys |
| **Board / funders** | Board reporting studio, `executive_grants`, board-export APIs | GL-derived board packs; grant draw-downs and restricted-fund balances (Phase 5) | `executive.board_reports`, `finance.gl.view` |
| **Network finance admin** | — (new) | Core COA governance, cross-school consolidation, benchmarking | `finance.gl.manage_network_coa` |

**Principles for stakeholder surfaces:**

- **One number, many lenses.** Parents, leaders, executives, and the board all trace to the same posted ledger; differences are scope/aggregation, not divergent computations.
- **Permission-scoped disclosure.** GL detail is staff-only (`finance.gl.*`); stakeholders see appropriately aggregated or sub-ledger views. Guardians never touch `gl_*` tables.
- **Reuse, don't rebuild.** Stakeholder financial views extend existing components (`FamilyFinancialCenter`, `StatCard`, `BarChart`/`DonutChart`, board-export) rather than introducing new surfaces.
- **Intelligence, not just reporting.** Stakeholder-relevant signals (a family's collection risk, a program's margin, a grant's compliance deadline) flow through the Decision + Automation engines into Mission Control and portal notifications.

*(Note: "Stakeholder Intelligence" here describes the finance-facing integration pattern across existing stakeholder surfaces; any dedicated Stakeholder Intelligence module remains a forward-looking concern and is called out in the roadmap rather than assumed to exist today.)*

---

## 10. Future implementation roadmap

| Phase | Delivers | Capability targets |
|---|---|---|
| **P0 — GL Foundation (this architecture)** | Locked-core UCOA, July–June fiscal calendar, balanced double-entry journal + posting RPC, posting-rule model (declared), mirror reconciliation, trial balance, permissions/RLS, engine registrations. `gl_mode='mirror'` — nothing in the live path changes. | Chart of Accounts, General Ledger, Journal Entries (foundation), Audit trail hardening |
| **P1 — Journal & close UX** | Manual/recurring/adjusting entry UI, approval queue, trial-balance screen, period-close workflow. | Journal Entries, Trial Balance |
| **P2 — Sub-ledger → GL** | AR/payroll/scholarship/state-funding events + poster; control-account reconciliation; profitability on GL actuals; historical backfill. | GL made real; payroll allocation, cost allocation GL-backed |
| **P3 — Cash cycle + cutover** | Accounts Payable (vendors/bills/payments), Bank Reconciliation, **Square** payment capture; **flip `gl_mode='authoritative'`** once reconciliation is clean. | Accounts Payable, Bank Reconciliation, Square Integration |
| **P4 — Statements, budgeting, consolidation** | P&L / Balance Sheet / Cash Flow from GL; budget module + budget-vs-actual; multi-campus consolidation; FL/GA state codes + mapping layer; chart upgrades. | Financial Statements, Budgeting, Cash Flow, Multi-campus reporting, State reporting |
| **P5 — Fund/grant accounting + intelligence** | Restricted net assets, grant budgets/draw-downs + compliance (Universal Deadline Engine); executive/AI enrichment and GL-actual forecasting; deepened stakeholder intelligence. | Grant Accounting, Restricted Funds, KPI/Forecasting/Executive intelligence |

**Cross-cutting each phase:** `recordActivity()` + `writePlatformAudit()` on every mutation; the registry convention with a build-gate validator; paired `_foundation`/`_rls` migrations scoped by `school_id`; reuse of existing UI primitives and Platform Engines — never a parallel path.

**Non-blocking implementation-detail inputs (needed before/at build, not for design):**
1. Manual-JE approval **threshold amount** (and whether it varies by school/campus).
2. Specific **NACUBO UCOA edition/version** to seed as the core template.
3. Exact **reserved extension code ranges** per account type for `gl_coa_extension_ranges`.

---

*Architecture finalized 2026-07-09. Design only — no code or migrations. See `FINANCIAL_INTELLIGENCE_PHASE0_GL_SPEC.md` for the full table/DDL/API/UI specification. Next step on explicit go-ahead: author the `156`/`157` migration pair + `gl/` service scaffold + registry behind the build gate, with `gl_mode='mirror'`.*
