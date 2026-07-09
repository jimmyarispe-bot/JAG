# DOCUMENT 14 — Real-Life Math™ Registry

**Project:** The Academy Way Learning System™ — Phase 3  
**Domain Key:** `domain.real_life_math`  
**Status:** Registry Architecture Only — No Skill Enumeration

---

## 1. Charter

Real-Life Math™ is the **applied mathematics competency domain** — every skill must connect to authentic adult and adolescent life contexts. This document defines strand architecture, competency patterns, evidence models, and integration contracts.

**Not:** abstract drill libraries disconnected from application.  
**Is:** measurable real-world financial, civic, and practical math competence.

---

## 2. Registry Position in ULR

```
domain.real_life_math
    └── [22 Strands — §3]
            └── [Sub-Strands — §4]
                    └── [Competencies — §5]
                            └── [Atomic Skills — Phase 4]
```

**Domain code:** `RLM`  
**Skill ID prefix:** `AW-RLM-{strand_code}-{skill}`

---

## 3. Strand Architecture

| Strand Key | Name | Real-World Anchor |
|------------|------|-------------------|
| `domain.real_life_math.strand.money` | Money | Cash, coins, making change |
| `domain.real_life_math.strand.banking` | Banking | Accounts, deposits, statements |
| `domain.real_life_math.strand.budgeting` | Budgeting | Income, expenses, savings goals |
| `domain.real_life_math.strand.employment` | Employment | Pay, hours, deductions |
| `domain.real_life_math.strand.taxes` | Taxes | Filing concepts, withholdings |
| `domain.real_life_math.strand.insurance` | Insurance | Premiums, coverage, claims |
| `domain.real_life_math.strand.credit` | Credit | Scores, cards, responsible use |
| `domain.real_life_math.strand.loans` | Loans | Interest, amortization, terms |
| `domain.real_life_math.strand.housing` | Housing | Rent, mortgage, utilities |
| `domain.real_life_math.strand.transportation` | Transportation | Fuel, fares, vehicle costs |
| `domain.real_life_math.strand.consumer_skills` | Consumer Skills | Unit price, comparison shopping |
| `domain.real_life_math.strand.shopping` | Shopping | Sales tax, discounts, receipts |
| `domain.real_life_math.strand.measurement` | Measurement | Units, conversions, precision |
| `domain.real_life_math.strand.cooking` | Cooking | Recipes, scaling, nutrition labels |
| `domain.real_life_math.strand.health_math` | Health Math | Dosages, BMI context, insurance copays |
| `domain.real_life_math.strand.travel` | Travel | Currency, time zones, itineraries |
| `domain.real_life_math.strand.technology` | Technology | Subscriptions, data plans, ROI |
| `domain.real_life_math.strand.business_math` | Business Math | Margins, markup, break-even |
| `domain.real_life_math.strand.entrepreneurship_math` | Entrepreneurship Math | Startup costs, pricing, projections |
| `domain.real_life_math.strand.data` | Data | Charts, averages, interpretation |
| `domain.real_life_math.strand.probability` | Probability | Risk, odds, informed decisions |
| `domain.real_life_math.strand.problem_solving` | Problem Solving | Multi-step applied reasoning |
| `domain.real_life_math.strand.decision_making` | Decision Making | Cost-benefit, trade-offs |

---

## 4. Sub-Strand Pattern

Each strand uses **3–6 sub-strands** by cognitive demand and context complexity:

| Sub-Strand Tier | Name Pattern | Description |
|-----------------|--------------|-------------|
| **Foundational** | `{strand}.foundational` | Concrete, guided, single-step |
| **Applied** | `{strand}.applied` | Multi-step, semi-authentic scenarios |
| **Independent** | `{strand}.independent` | Student-initiated real contexts |
| **Advanced** | `{strand}.advanced` | Complex trade-offs, optimization |

**Example (Budgeting — structure only):**

```
domain.real_life_math.strand.budgeting
    ├── sub_strand.budgeting.foundational     (income vs expense identification)
    ├── sub_strand.budgeting.applied          (monthly budget creation)
    ├── sub_strand.budgeting.independent      (personal budget maintenance)
    └── sub_strand.budgeting.advanced         (long-term financial planning)
```

---

## 5. Competency Structure

Each competency represents a **real-world outcome cluster** — e.g., "Create and maintain a monthly budget."

### 5.1 Standard ULR Fields

All competencies inherit Document 12 schema.

### 5.2 RLM-Specific Extensions

| Field | Description |
|-------|-------------|
| `real_world_context` | Scenario category (home, work, community, venture) |
| `authenticity_level` | `simulated`, `semi_authentic`, `authentic` |
| `required_tools[]` | Calculator, spreadsheet, app, physical materials |
| `cross_strand_links[]` | e.g., budgeting ↔ employment ↔ taxes |
| `life_lab_overlap[]` | Skills shared with Life Lab domain (Doc 17) |
| `venture_lab_overlap[]` | Skills shared with Venture Lab (Doc 17) |

### 5.3 Competency Template (Per Sub-Strand)

Each sub-strand defines **2–4 competency templates** — not enumerated skills:

| Template | Purpose |
|----------|---------|
| **Understand** | Conceptual grasp with real examples |
| **Apply** | Perform in structured scenario |
| **Demonstrate** | Independent performance with evidence |
| **Teach/Explain** | Optional advanced — explain to peer or family |

---

## 6. Atomic Skill Representation (Phase 4 Pattern)

Atomic skills in RLM **must** include:

| Required RLM Field | Example Pattern |
|--------------------|-----------------|
| `performance_task_ref` | Link to real-world performance task definition |
| `context_scenario` | Authentic situation description |
| `materials_needed[]` | Physical or digital resources |
| `error_cost` | `low`, `moderate`, `high` — real-world consequence framing |

**Skill count estimate (Phase 4):** ~350–500 across 22 strands — not listed in Phase 3.

---

## 7. Evidence Architecture

| Evidence Type | RLM Use |
|---------------|---------|
| `artifact.budget` | Budget worksheets, app exports |
| `artifact.receipt` | Shopping, tax documentation |
| `artifact.calculation` | Work shown |
| `artifact.presentation` | Explain decision to family/class |
| `observation.performance` | Teacher observes live task |
| `measurement.assessment` | Scenario-based assessment |
| `reflection.metacognitive` | Decision rationale |

**KEE linkage:** Evidence tagged `domain.real_life_math` + `skill_keys[]` + optional `scenario_id`

**Portfolio:** `portfolio_eligible` default true for Demonstrate-tier competencies

**Transcript:** Financial literacy strands (money through loans) default `transcript_eligible`

---

## 8. Assessment Architecture

### 8.1 Assessment Method Categories

| Method Key | Description |
|------------|-------------|
| `assess.rlm.scenario` | Written or digital scenario response |
| `assess.rlm.performance` | Live performance task |
| `assess.rlm.project` | Multi-day applied project |
| `assess.rlm.oral_defense` | Explain reasoning and decisions |
| `assess.rlm.simulation` | Simulated environment (bank, store) |

### 8.2 Real-World Performance Tasks

Performance tasks are **registry-linked artifacts** — not lessons:

```
performance_task
    ├── task_id
    ├── title
    ├── linked_competency_keys[]
    ├── linked_skill_keys[] (Phase 4)
    ├── scenario_description
    ├── rubric_ref
    ├── evidence_types_required[]
    └── scheduling_duration_minutes
```

Tasks live in **Performance Task Catalog** — referenced by competencies and skills.

---

## 9. Mastery Determination

| Rule | RLM-Specific |
|------|--------------|
| **L3 Proficient** | Successful performance task OR equivalent evidence bundle |
| **Authenticity gate** | Independent/Advanced tiers require `authenticity_level >= semi_authentic` for L3 |
| **Cross-strand** | Competency may require skills from prerequisite strands (e.g., credit requires budgeting L3) |
| **Regression** | Failed real-world retry or new error pattern → level review |

---

## 10. AI Recommendation Framework

| Rule Key | Trigger | Output |
|----------|---------|--------|
| `ai.rlm.prerequisite_gap` | Blocked competency | Prerequisite strand skills |
| `ai.rlm.context_match` | Student interest profile | Strand prioritization |
| `ai.rlm.performance_task` | Ready for Demonstrate tier | Next performance task |
| `ai.rlm.cross_domain` | Venture Lab venture needs math | Linked RLM skills |
| `ai.rlm.family_activity` | Family Journey pathway | Parent activity on skill |

---

## 11. Scheduling Intelligence References

| Element | RLM Consideration |
|---------|-------------------|
| **Performance blocks** | Extended sessions for live tasks |
| **Community outings** | Shopping, banking field contexts |
| **Group size** | Performance tasks may be individual |
| **Virtual vs in-person** | Authentic tasks often in-person |
| **Cycle alignment** | RLM Learning Cycles per Document 1 |

---

## 12. Personal Academic Journey Integration

| PAJ Element | RLM Use |
|-------------|---------|
| **Placement** | Strand-level diagnostic → sub-strand entry |
| **Pathway** | Student selects emphasis strands (not skipping foundations) |
| **Mastery map** | 22-strand progress visualization |
| **Next skill** | Within strand + cross-strand prerequisites |

---

## 13. Graduation Readiness Link

Document 7 readiness domains map RLM competencies:

| Readiness Domain | Primary RLM Strands |
|------------------|---------------------|
| Financial literacy | money → loans |
| Practical life | measurement, cooking, consumer |
| Civic / quantitative | data, probability, decision_making |

---

## 14. Expansion Protocol

| Addition | Process |
|----------|---------|
| New strand (e.g., cryptocurrency) | Add strand key; sub-strand pattern; no ID collision |
| New performance task | Catalog entry; link to existing skills |
| Regulatory change (tax forms) | Version competency; deprecate outdated skills |

---

## 15. Phase 4 Boundary

Phase 4 populates atomic skills and performance task library within this architecture. Phase 3 defines **22 strands, sub-strand tiers, competency templates, evidence/assessment contracts**.

---

*End of Document 14 — Real-Life Math™ Registry*
