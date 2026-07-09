# DOCUMENT 25 — Canonical Competency Specification™

**Project:** The Academy Way Learning System™ — Phase 4  
**Status:** Implementation Blueprint — Authoring Standard Only  
**Authority:** Governs all competency library population (Phase 4.1+)  
**Prerequisite:** Documents 12–24 · Constitutional Global Education Framework (Docs A–D)

---

## 1. Charter

The **Canonical Competency Specification™ (CCS)** defines the **required structure for every competency** in the Universal Learning Registry™.

Before thousands of Atomic Skills are authored, this document establishes the **mandatory fields, quality bar, and relationships** that every competency record must satisfy.

**This phase does not populate competencies.** It defines the specification only.

**Gold standard library (first population):** Structured Literacy (Wilson / Orton-Gillingham aligned) — Doc 13 — authored to this spec first; all other domains follow its exemplar.

---

## 2. Scope & Hierarchy

```
Learning Domain
    └── Strand
            └── Sub-Strand
                    └── Competency          ← THIS SPECIFICATION
                            └── Atomic Skill  ← Inherits + extends competency context
```

| Level | This Spec Applies |
|-------|-------------------|
| **Competency** | Full CCS schema (§4) |
| **Atomic Skill** | Doc 12 schema + competency inheritance rules (§5) |

---

## 3. Competency ID Convention

| Component | Pattern |
|-----------|---------|
| **Competency ID** | `AW-{DOMAIN}-{SUBSTRAND}-{COMP}-v{semver}` |
| **Example pattern** | `AW-SL-03-PA-001-v1.0.0` |
| **Immutable key** | `competency_key` — never reused after publish |
| **Display name** | Localizable via overlay (Doc A) |

**Domain codes:** `SL`, `RLM`, `LL`, `EO`, `LLB`, `AVL` (Docs 13–17)

---

## 4. Required Competency Schema

Every competency **shall** contain all fields below. Empty arrays are permitted only where marked optional; required text fields minimum 1 sentence.

---

### 4.1 Identity & Taxonomy

#### Competency ID
| Field | Type | Required |
|-------|------|----------|
| `competency_key` | string | Yes — immutable |
| `version` | semver | Yes |
| `status` | enum | `draft`, `in_review`, `published`, `deprecated`, `archived` |

#### Domain
| Field | Type | Required |
|-------|------|----------|
| `learning_domain_key` | ref | Yes — e.g., `domain.structured_literacy` |

#### Strand
| Field | Type | Required |
|-------|------|----------|
| `strand_key` | ref | Yes |

#### Sub-Strand
| Field | Type | Required |
|-------|------|----------|
| `sub_strand_key` | ref | Yes |

#### Competency Name
| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes — student-facing plain language |
| `title_educator` | string | Optional — technical label |

#### Description
| Field | Type | Required |
|-------|------|----------|
| `description` | text | Yes — 2–4 sentences; what the competency is |

#### Purpose
| Field | Type | Required |
|-------|------|----------|
| `purpose` | text | Yes — instructional intent; why this competency exists in the pathway |

#### Why It Matters
| Field | Type | Required |
|-------|------|----------|
| `why_it_matters` | text | Yes — real-world relevance; student/family facing summary |
| `why_it_matters_educator` | text | Optional — discipline-specific rationale |

#### Developmental Notes
| Field | Type | Required |
|-------|------|----------|
| `developmental_notes` | text | Yes — typical progression; **guidance only — not age gates** |
| `suggested_developmental_range` | object | `{ ageMin, ageMax, gradeBandOptional }` — optional metadata |

---

### 4.2 Relationships & Progression

#### Prerequisites
| Field | Type | Required |
|-------|------|----------|
| `prerequisite_competency_keys[]` | ref[] | Yes — may be empty with justification |
| `prerequisite_skill_keys[]` | ref[] | Optional — skill-level gates |
| `prerequisite_rationale` | text | Required if any prerequisites |

#### Cross-Domain Connections
| Field | Type | Required |
|-------|------|----------|
| `cross_domain_connections[]` | object[] | Yes — may be empty array |
| Object shape | | `{ competencyKey, linkType, rationale }` |
| `linkType` enum | | `supports`, `requires`, `enriches`, `applies`, `parallel` |

---

### 4.3 Mastery Definition

#### Success Criteria
| Field | Type | Required |
|-------|------|----------|
| `success_criteria` | text[] | Yes — observable, measurable statements |
| `minimum_atomic_skills_l3` | int | Yes — count of skills at L3 for competency mastery |
| `requires_all_skills_l3` | bool | Default true unless documented exception |

#### Observable Behaviors
| Field | Type | Required |
|-------|------|----------|
| `observable_behaviors[]` | object[] | Yes — min 2 |
| Object shape | | `{ behavior, context, frequency }` |

#### Mastery Levels
| Field | Type | Required |
|-------|------|----------|
| `mastery_level_definitions` | object | Yes — maps to universal 0–4 scale (Doc 6) |
| Per level | | `{ level, key, competency_specific_descriptor }` |

| Level | Key | Competency Descriptor Pattern |
|-------|-----|------------------------------|
| 0 | `not_started` | No evidence toward competency |
| 1 | `emerging` | Inconsistent behaviors; partial skills |
| 2 | `developing` | Progress visible; criteria not met |
| 3 | `proficient` | **All required success criteria met** |
| 4 | `advanced` | Transfer or teach-back demonstrated |

---

### 4.4 Diagnostics & Observation

#### Common Misconceptions
| Field | Type | Required |
|-------|------|----------|
| `common_misconceptions[]` | object[] | Yes — min 1 where applicable |
| Object shape | | `{ misconception, correction, reteach_strategy_ref }` |

#### Common Error Patterns
| Field | Type | Required |
|-------|------|----------|
| `common_error_patterns[]` | object[] | Yes — min 1 where applicable |
| Object shape | | `{ pattern, lookFor, intervention_strategy_ref }` |

#### Teacher Look-Fors
| Field | Type | Required |
|-------|------|----------|
| `teacher_look_fors[]` | object[] | Yes — min 3 |
| Object shape | | `{ indicator, proficient_signal, not_yet_signal }` |

#### Student Look-Fors
| Field | Type | Required |
|-------|------|----------|
| `student_look_fors[]` | text[] | Yes — self-assessment prompts; min 2 |

#### Parent Look-Fors
| Field | Type | Required |
|-------|------|----------|
| `parent_look_fors[]` | text[] | Yes — home observation; min 1 |
| `parent_activity_refs[]` | ref[] | Link to Family Journey / resource catalog |

---

### 4.5 Support & Differentiation

#### Executive Function Demands
| Field | Type | Required |
|-------|------|----------|
| `executive_function_demand` | enum | `low`, `moderate`, `high` |
| `ef_skills_engaged[]` | ref[] | planning, working memory, attention, etc. |
| `ef_support_hints[]` | text[] | Playbook EF section inputs |

#### Accommodations
| Field | Type | Required |
|-------|------|----------|
| `accommodation_considerations[]` | text[] | Yes — support hints; not diagnostic labels |
| `accommodation_refs[]` | ref[] | Optional — standard accommodation catalog keys |

#### Differentiation
| Field | Type | Required |
|-------|------|----------|
| `differentiation` | object | Yes |
| Fields | | `approaching[]`, `on_level[]`, `extension[]` — strategies per band |

---

### 4.6 Intelligence & Assessment

#### AI Coaching Rules
| Field | Type | Required |
|-------|------|----------|
| `ai_coaching_rule_keys[]` | ref[] | Yes — Decision Engine rule refs (Doc 29) |
| `ai_coaching_notes` | text | Constraints; what AI must not do |

#### Assessment Options
| Field | Type | Required |
|-------|------|----------|
| `assessment_method_keys[]` | ref[] | Yes — min 1; Doc 21 / Doc 26 |
| `primary_assessment_method_key` | ref | Recommended path to L3 |

#### Evidence Types
| Field | Type | Required |
|-------|------|----------|
| `evidence_type_keys[]` | ref[] | Yes — min 2 types for L3 (Doc 27) |
| `minimum_evidence_count` | int | Yes — default ≥ 2 |
| `evidence_bundle_rules` | text | How evidence combines for validation |

---

### 4.7 Outcomes & Eligibility

#### Portfolio Eligibility
| Field | Type | Required |
|-------|------|----------|
| `portfolio_eligible` | bool | Yes |
| `portfolio_artifact_types[]` | ref[] | If eligible |

#### Graduation Connections
| Field | Type | Required |
|-------|------|----------|
| `graduation_readiness_domain_keys[]` | ref[] | Yes — Doc 7 mapping; may be empty with note |
| `graduation_weight` | number | Optional — 0–1 within domain |

#### Career Connections
| Field | Type | Required |
|-------|------|----------|
| `career_connections[]` | object[] | Yes — may be empty for early foundational |
| Object shape | | `{ career_cluster, relevance, age_band }` |

#### Entrepreneurship Connections
| Field | Type | Required |
|-------|------|----------|
| `entrepreneurship_connections[]` | object[] | Yes — may be empty |
| Object shape | | `{ venture_lab_strand, application }` |

---

### 4.8 Instructional Linkage

| Field | Type | Required |
|-------|------|----------|
| `instructional_strategy_keys[]` | ref[] | Yes — Doc 18 |
| `intervention_strategy_keys[]` | ref[] | Yes — Doc 20 |
| `instructional_resource_refs[]` | ref[] | Optional until resources authored — Doc 28 |
| `playbook_template_version` | ref | Yes — Doc 22 version |
| `estimated_instructional_hours` | number | Yes — typical to competency L3 |
| `locale_overlay_keys[]` | ref[] | Optional — Doc A/D |

---

## 5. Atomic Skill Inheritance Rules

Atomic Skills (Doc 12) **inherit** competency context and **must not contradict** competency success criteria.

| Competency Field | Skill Inheritance |
|------------------|-----------------|
| Domain / Strand / Sub-Strand | Copied — must match parent |
| Success criteria | Skill `mastery_criteria` is subset |
| Evidence types | Skill uses subset or equal |
| EF demands | Skill ≤ competency level or flagged |
| Cross-domain | Skill may add links; not remove competency links |
| AI rules | Skill may add specific rules |

**Publish rule:** Competency must be `published` before child skills publish.

---

## 6. Authoring Quality Checklist

Before `in_review` status:

| # | Check |
|---|-------|
| 1 | All §4 required fields populated |
| 2 | Success criteria observable — no vague "understands" |
| 3 | Prerequisites acyclic at competency graph |
| 4 | Min 2 evidence types with Doc 27 mapping |
| 5 | Min 1 assessment method with Doc 26 item spec |
| 6 | Teacher look-fors align with success criteria |
| 7 | No copyrighted Wilson content in SL competencies |
| 8 | Cross-domain links bidirectionally documented |
| 9 | Graduation mapping verified against Doc 7 |
| 10 | Accessibility review flag set (Doc 30) |

---

## 7. Wilson / SL Exemplar Requirements

First populated library (Structured Literacy) **must** additionally satisfy:

| Requirement | Source |
|-------------|--------|
| Wilson Step crosswalk | Doc 13 — category only |
| OG fidelity indicators | Doc 13, VI-F |
| Certified teacher note | Session delivery constraint |
| Dosage metadata | VI-F.15 reference |
| No proprietary lesson text | Constitutional boundary |

All other domain libraries **benchmark against** SL library quality scores (Doc 30).

---

## 8. Governance Cross-Reference

| Process | Document |
|---------|----------|
| Versioning & approval | Doc 30 |
| Assessment items | Doc 26 |
| Evidence taxonomy | Doc 27 |
| Instructional resources | Doc 28 |
| AI coaching | Doc 29 |

---

## 9. Rules

| Rule | Requirement |
|------|-------------|
| **CCS-1** | No competency published without full §4 schema |
| **CCS-2** | Competency keys immutable after publish |
| **CCS-3** | SL library is authoring gold standard |
| **CCS-4** | Developmental notes never used as enrollment gates |
| **CCS-5** | Parent look-fors required for every competency |
| **CCS-6** | AI coaching rules required — default deny if absent |

---

*End of Document 25 — Canonical Competency Specification™*
