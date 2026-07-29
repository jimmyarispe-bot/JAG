# 05 — Constitutional Violations

**Phase Ω-0** · **DOCUMENT ONLY — DO NOT FIX**  
**Authority:** [JAG_CONSTITUTION.md](../../../JAG_CONSTITUTION.md)

Every item below is a known divergence. Remediation is scheduled in [06_PHASE_OMEGA_ROADMAP.md](./06_PHASE_OMEGA_ROADMAP.md), not here.

Severity: **P0** blocks constitutional product claims · **P1** ownership debt · **P2** naming / packaging debt

---

## V-01 — Portals and role workspaces treated as products (Law 1, 2, 10)

| Field | Detail |
|-------|--------|
| Severity | **P0** |
| Evidence | `/portal/**`, `/portal/student/**`, `/dashboard/teacher|school-leader|executive|admissions|finance|hr/**`, Wave 1.x experience packs, consolidation portal maps |
| Why it violates | Frames multiple products/portals instead of one OS with contexts |
| Duplicate? | N/A — structural productization |
| Recommended future | Reclassify as Legacy Surfaces → absorb into Experience Orchestrator contexts |

---

## V-02 — Education logic mis-homed in JAG Core trees (Law 4, 8.5)

| Field | Detail |
|-------|--------|
| Severity | **P0** |
| Evidence | `src/lib/platform/paj`, `ulr`, `jag-profile`, `parent-communication`, `shared` SchoolContext, `services` AcademyOS naming; platform forecasting modules with admissions/enrollment/capacity/staffing education semantics; marketplace education packs inside Core catalogs |
| Why it violates | Education-specific capability in Core |
| Outside education? | NO |
| Recommended future | Relocate ownership to Education Intelligence package (docs first, then moves in later phase) |

---

## V-03 — Parallel Finance stacks (Law 7 duplicate capability)

| Field | Detail |
|-------|--------|
| Severity | **P0** |
| Evidence | `packages/platform/finance` + `cfo` vs `src/lib/platform/finance` + `accounting` vs `src/lib/finance*` + `finance-platform` + `financial-intelligence` vs `packages/academyos/finance` |
| Why it violates | Multiple owners for ledger/billing/FI reasoning |
| Duplicate? | **YES** |
| Recommended future | Canonical: `packages/platform/finance` + `cfo`; Education = adapters only |

---

## V-04 — Parallel Knowledge / Graph stacks

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `packages/platform/knowledge` vs `packages/studio/knowledge|graph` vs `src/lib/platform/{graph,knowledge-graph,intelligence-graph,executive-graph}` vs `@/jag/graph` |
| Why it violates | Ambiguous Knowledge/Graph ownership |
| Duplicate? | **YES** |
| Recommended future | KnowledgeEngine canonical; Studio KG for repo-Studio; retire product KG duplicates |

---

## V-05 — Parallel Communications / Notifications

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `@/jag/communications` vs `src/lib/communications` vs `src/lib/platform/notifications` vs `packages/academyos/communications` vs admissions `communications/engine` |
| Why it violates | Multiple messaging engines / stores |
| Duplicate? | **YES** |
| Recommended future | Core Notification/Communications engine; Education owns templates only |

---

## V-06 — Parallel Digital Twin surfaces

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `src/lib/platform/digital-twin` vs `src/lib/digital-twin` vs `packages/platform/organization/twin` vs `packages/academyos/twin` |
| Why it violates | Fragmented Twin ownership |
| Duplicate? | **YES** |
| Recommended future | One Twin runtime; domain projection adapters only |

---

## V-07 — Parallel Organization model homes

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `packages/platform/organization` vs `src/lib/platform/{organizations,organization-platform,jag-organization,hierarchy}` |
| Why it violates | Law 9 — UOM must be single architecture |
| Duplicate? | **YES** |
| Recommended future | `@organization` / UOM canonical |

---

## V-08 — Parallel Workflow / Decision engines

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `lib/platform/workflow` vs `workflows/framework` vs Studio workflows; `decision` vs `decisions` vs `@/jag/decisions`; admissions `automation/engine` |
| Why it violates | Multiple executable pipeline owners |
| Duplicate? | **YES** |
| Recommended future | One Workflow Framework + Decision runtime; domain automation = configuration |

---

## V-09 — Triple Education packaging

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `packages/academyos` + `src/packages/academy` + `src/applications/academyos` |
| Why it violates | Ambiguous domain package ownership (not three products, but three homes) |
| Duplicate? | **YES** (packaging) |
| Recommended future | Single Education Intelligence package layout |

---

## V-10 — Learning Intelligence / mastery ambiguity

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `packages/academyos/learning` SoR vs `packages/platform/learning-intelligence` facade vs PAJ/ULR/jag-profile |
| Why it violates | Risk of second mastery model; LI package location implies Core SoR |
| Duplicate? | **Partial** |
| Recommended future | SoR stays Education; facade clearly documented as non-SoR; move PAJ/ULR to domain |

---

## V-11 — Innovation dual homes

| Field | Detail |
|-------|--------|
| Severity | **P2** |
| Evidence | `packages/platform/innovation` vs `src/lib/platform/innovation` |
| Why it violates | Dual ownership |
| Duplicate? | **YES** |
| Recommended future | Package canonical |

---

## V-12 — Studio naming collision

| Field | Detail |
|-------|--------|
| Severity | **P2** |
| Evidence | `packages/studio` (product/repo Studio) ≠ `src/jag/studio` (Organization Studio) |
| Why it violates | Cognitive fork risk — not a second OS, but constitutional clarity debt |
| Recommended future | Rename docs/labels: “Organization Studio” vs “Engineering Studio” |

---

## V-13 — Speculative / ungoverned AI product surfaces (Law 7)

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | Role “AI OS” framing (teacher assistant, student coach, founder intel, ECC) without universal evidence-gating contract |
| Why it violates | Recommendations must trace evidence or say “I don’t know” |
| Recommended future | Orchestrator + Coach share evidence policy; no invented diagnoses |

---

## V-14 — Consolidation docs still say “portal product” in places

| Field | Detail |
|-------|--------|
| Severity | **P2** |
| Evidence | `docs/platform/consolidation/05_PORTAL_MAP.md`, Wave experience docs, some role maps |
| Why it violates | Language conflicts with Law 2 (docs as SoT for product intent) |
| Recommended future | Doc amendments: Portal → Context (after Ω review) |

---

## V-15 — Platform Constitution “Application #1 = AcademyOS” product language

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `docs/architecture/PLATFORM_CONSTITUTION.md` § Vision |
| Why it violates | Law 1 — AcademyOS is domain package, not peer product brand |
| Recommended future | Amend engineering constitution vocabulary to “domain intelligence package” while keeping tenancy/permission rules |

---

## V-16 — Per-role Experience Orchestrators without universal Orchestrator (Law 5, 6)

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | Six `*/experience` orchestrators; no JAG Experience Orchestrator implementation |
| Why it violates | Experiences built independently per role rather than composed by OS relevance |
| Recommended future | Phase Ω-1 Orchestrator absorbs role factories |

---

## V-17 — Executive / Founder / ECC as parallel “command products”

| Field | Detail |
|-------|--------|
| Severity | **P1** |
| Evidence | `/dashboard/executive`, `/exec`, `/dashboard/founder`, executive-command-center, founder-intelligence |
| Why it violates | Multiple executive products vs Executive / Steward Contexts |
| Recommended future | One OS entry; context profiles for steward vs campus executive |

---

## Summary counts

| Severity | Count |
|----------|-------|
| P0 | 3 (V-01, V-02, V-03) |
| P1 | 11 |
| P2 | 3 |

**Ω-0 action:** None (document only).
