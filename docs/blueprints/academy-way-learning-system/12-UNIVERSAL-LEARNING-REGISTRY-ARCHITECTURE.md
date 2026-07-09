# DOCUMENT 12 — Universal Learning Registry™ Architecture

**Project:** The Academy Way Learning System™ — Phase 3  
**Status:** Implementation Blueprint — Registry Architecture Only  
**Supersedes:** Document 2 registry overview (extends to canonical master registry)  
**Phase 4 explicitly excluded:** Atomic Skill libraries are NOT created in this phase

---

## 1. Charter

The **Universal Learning Registry™ (ULR)** is the **single canonical instructional registry** for every measurable competency in AcademyOS.

It is **not** curriculum. It is **not** lesson planning. It is the **master reference** that every lesson, assessment, AI recommendation, report, dashboard, scheduling decision, evidence record, portfolio artifact, and Personal Academic Journey™ consumes.

**One registry. One skill ID namespace. One mastery model.**

---

## 2. Constitutional Position

| Attribute | Value |
|-----------|--------|
| **Registry host** | Platform Registry Framework (Part II) |
| **Learning Science link** | Maps to VI-B Universal Skill Registry — ULR is Academy Way operational superset |
| **Anti-duplication** | No per-module skill tables; no duplicate competency definitions |
| **Wilson boundary** | Category and Step mapping only — no proprietary Wilson content (Part VI-F) |

---

## 3. Registry Hierarchy

```
Learning Domain
    └── Strand
            └── Sub-Strand
                    └── Competency
                            └── Atomic Skill
                                    └── Evidence (instances → KEE, not stored in registry)
                                            └── Mastery (computed state → PAJ)
                                                    └── Next Skill (graph edge → Intelligence Graph)
```

### 3.1 Level Definitions

| Level | Purpose | Mutability |
|-------|---------|------------|
| **Learning Domain** | Top-level program area (6 Academy Way domains) | Rarely changes; versioned |
| **Strand** | Major thematic group within domain | Versioned |
| **Sub-Strand** | Finer grouping for navigation and reporting | Versioned |
| **Competency** | Measurable outcome cluster | Versioned |
| **Atomic Skill** | Smallest assessable unit | Immutable ID once published |
| **Evidence** | Runtime records in KEE — not registry rows | N/A |
| **Mastery** | Runtime student state on PAJ | N/A |
| **Next Skill** | Graph relationship + AI recommendation target | Derived |

---

## 4. Universal Atomic Skill Schema

Every Atomic Skill in ULR **shall** include the following fields (architecture — values populated in Phase 4):

### 4.1 Identity & Taxonomy

| Field | Type | Description |
|-------|------|-------------|
| `skill_id` | string | **Unique Academy Way Skill ID** — immutable |
| `title` | string | Display title |
| `description` | string | Plain-language description |
| `learning_domain_key` | ref | Domain |
| `strand_key` | ref | Strand |
| `sub_strand_key` | ref | Sub-Strand |
| `competency_key` | ref | Parent competency |

**ID convention:** `AW-{DOMAIN_CODE}-{SUBSTRAND_NUM}-{SKILL_NUM}`  
Example pattern: `AW-SL-03-017` (not enumerated in Phase 3)

### 4.2 Relationships

| Field | Type | Description |
|-------|------|-------------|
| `prerequisites[]` | skill_id[] | Must be Proficient (L3) before unlock |
| `related_skills[]` | skill_id[] | Soft relationships for AI and intervention |
| `next_skills[]` | skill_id[] | Typical sequence (overridable by PAJ) |
| `cross_domain_links[]` | object | `{ skillId, linkType, rationale }` |

**Graph integration:** Prerequisites and related skills → Intelligence Graph edges.

### 4.3 Instructional Metadata

| Field | Type | Description |
|-------|------|-------------|
| `difficulty` | enum | `foundational`, `developing`, `proficient`, `advanced` |
| `suggested_developmental_range` | object | `{ ageMin, ageMax, gradeBandOptional }` — guidance only, not gate |
| `estimated_instructional_minutes` | number | Typical time to Proficient |
| `mastery_criteria` | text | Observable success criteria (Document 6) |
| `common_error_patterns[]` | string | For teacher observation and AI |

### 4.4 Evidence & Assessment

| Field | Type | Description |
|-------|------|-------------|
| `evidence_types[]` | ref[] | Required KEE evidence types for L3 |
| `minimum_evidence_count` | int | |
| `assessment_methods[]` | ref[] | From assessment method catalog |
| `observation_indicators[]` | object | `{ indicator, lookFor, notYet }` |

### 4.5 Instructional Support

| Field | Type | Description |
|-------|------|-------------|
| `instructional_strategies[]` | ref[] | VI-B Instructional Strategy Registry keys |
| `intervention_strategies[]` | ref[] | VI-B Intervention Registry keys |
| `accommodation_considerations[]` | text | Support hints — not diagnostic labels |
| `executive_function_demands` | enum | `low`, `moderate`, `high` + EF skill refs |

### 4.6 Family & Portfolio

| Field | Type | Description |
|-------|------|-------------|
| `parent_activities[]` | ref[] | Family Journey pathway activities |
| `portfolio_eligible` | bool | May appear on Digital Portfolio |
| `transcript_eligible` | bool | May appear on Mastery Transcript |

### 4.7 Intelligence & Operations

| Field | Type | Description |
|-------|------|-------------|
| `ai_recommendation_rules[]` | ref[] | Decision Engine rule keys |
| `scheduling_considerations` | object | Group size, duration, modality hints |
| `kee_link_template` | object | Default evidence classification for capture |
| `decision_engine_references[]` | ref[] | Related decision definitions |

### 4.8 Lifecycle

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `draft`, `published`, `deprecated`, `archived` |
| `version` | semver | |
| `published_at` | timestamp | |
| `superseded_by` | skill_id | Replacement skill if deprecated |

---

## 5. Supporting Catalogs (Registry-Scoped)

| Catalog Key | Purpose |
|-------------|---------|
| `ulr_domain_catalog` | Six learning domains |
| `ulr_strand_catalog` | Strands per domain |
| `ulr_sub_strand_catalog` | Sub-strands per strand |
| `ulr_competency_catalog` | Competencies |
| `ulr_atomic_skill_catalog` | Atomic skills (Phase 4 population) |
| `ulr_evidence_type_catalog` | Evidence type definitions |
| `ulr_assessment_method_catalog` | Assessment methods |
| `ulr_mastery_level_catalog` | Universal 0–4 scale (Doc 6) |
| `ulr_ai_rule_catalog` | AI recommendation rule refs |

---

## 6. Mastery Determination (Registry Rules)

Mastery is **not stored in the registry** — it is computed on PAJ using registry rules:

```
FOR each atomic_skill:
  IF evidence linked >= minimum_evidence_count
  AND each required evidence_type present
  AND mastery_criteria satisfied (human or rubric)
  THEN mastery_level >= L3 (Proficient)
```

| Rule | Source |
|------|--------|
| Level definitions | Document 6 |
| Competency mastery | All required skills in competency at L3 |
| Regression | New evidence below criteria → level decrease with workflow |
| Educator confirmation | `requires_educator_confirmation` on competency |

---

## 7. Next Skill Resolution

```
next_skill_candidates =
  skill.next_skills[]
  ∪ skills where skill.prerequisites satisfied AND status not_started
  − skills blocked by scheduling or whole-child constraints

AI ranks candidates → Decision Engine recommendation → human approval
```

**Intelligence Graph edge types:** `prerequisite`, `next_in_sequence`, `related`, `cross_domain_support`

---

## 8. Consumer Integration Matrix

| Consumer | Registry Use |
|----------|--------------|
| **Personal Academic Journey™** | Placement, pathway, mastery state per skill |
| **Lessons / instruction** | Target `skill_id[]` on session — not curriculum storage |
| **Assessments** | Map results to skills via `assessment_methods` |
| **AI recommendations** | `ai_recommendation_rules`, next skill graph |
| **Reports / dashboards** | Aggregate by domain → strand → competency |
| **Scheduling Intelligence** | `scheduling_considerations`, group composition by skill band |
| **KEE** | Evidence records carry `skill_keys[]` matching ULR IDs |
| **Digital Portfolio** | `portfolio_eligible` skills → artifact linkage |
| **Mastery Transcript** | `transcript_eligible` competencies |
| **Graduation Readiness** | Readiness domains map to competency sets |
| **Family Journey** | `parent_activities` on skills |
| **Opportunity Engine** | `skill_tags` match opportunities |
| **Decision Engine** | `decision_engine_references` |

---

## 9. Knowledge & Evidence Engine Links

| Link Type | Mechanism |
|-----------|-----------|
| **Evidence capture** | Every evidence record includes `skill_keys[]` — validated against ULR |
| **Lineage** | Transcript/portfolio → evidence → skill → competency → domain |
| **Discovery** | ARI research aggregates by registry keys — anonymized |
| **Synthesis** | KEE knowledge records reference competency_keys |

**Validation:** Unknown skill_id on evidence → Diagnostics alert + enrichment queue.

---

## 10. Scheduling Intelligence References

| Scheduling Element | Registry Field |
|--------------------|----------------|
| Group placement by skill band | Students sharing placement on prerequisite chain |
| Session duration | `estimated_instructional_minutes` |
| Wilson group size | Domain `scheduling_considerations` + Academy Way rules |
| Whole-child WCSS | EF demands + accommodation considerations |
| Dosage frequency | Domain-level defaults + VI-F Wilson rules |

SIE does **not** duplicate registry — reads ULR via API.

---

## 11. Expansion Without Redesign

| Change Type | Process |
|-------------|---------|
| **New skill in existing competency** | Publish new skill_id; version competency; no hierarchy change |
| **New competency** | Add to sub-strand; version sub-strand |
| **New sub-strand / strand** | Additive publish; existing IDs unchanged |
| **New domain** | Major registry version bump; Configuration Studio import |
| **Deprecate skill** | `superseded_by` + migration map; old evidence retained |
| **Threshold change** | Org override in Configuration Studio — not registry edit |

**Phase 4 rule:** Skill libraries added incrementally by domain — never bulk replace hierarchy.

---

## 12. Registry Governance

| Rule | Requirement |
|------|-------------|
| **ULR-1** | Published skill_id immutable |
| **ULR-2** | Prerequisite graph acyclic — validated at publish |
| **ULR-3** | Wilson content category-coded only |
| **ULR-4** | All consumers use ULR API — no local skill copies |
| **ULR-5** | Registry changes require version bump + changelog |
| **ULR-6** | Phase 4 skill population per domain — not ad-hoc in product modules |

---

## 13. Domain Registry Documents (Phase 3)

| Document | Domain |
|----------|--------|
| **13** | Structured Literacy (Wilson) |
| **14** | Real-Life Math™ |
| **15** | LitLab™ |
| **16** | Earthology™ |
| **17** | Life Lab™ & AI Venture Lab™ |

Each document defines **domain-specific strand architecture** — not skill enumeration.

---

## 14. Roadmap Placement

| Component | Wave |
|-----------|------|
| ULR architecture + catalogs | Wave 3 (with Learning Registry) |
| Domain registry structures (Docs 13–17) | Wave 3 design → Wave 6 seed planning |
| Atomic skill libraries | **Phase 4 / Wave 6** — explicitly deferred |
| VI-B crosswalk | Wave 6 |

---

*End of Document 12 — Universal Learning Registry™ Architecture*
