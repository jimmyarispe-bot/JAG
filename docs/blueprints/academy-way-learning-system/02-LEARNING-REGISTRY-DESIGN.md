# DOCUMENT 2 — Complete Learning Registry Design

**Project:** The Academy Way Learning System™  
**Status:** Implementation Blueprint — Registry Architecture Only  
**Registry Host:** Platform Registry Framework (Part II) · Learning Science Universal Skill Registry (Part VI-B)

---

## 1. Registry Charter

The **Academy Way Learning Registry** is the single canonical source of truth for all learning domains, strands, competencies, atomic skills, mastery definitions, evidence requirements, and cross-domain relationships.

**Registry key:** `academy_way_learning_registry`

**Anti-duplication:** One skill ID globally unique. Wilson skills map to registry via crosswalk — not duplicate taxonomy.

---

## 2. Universal Registry Schema

### 2.1 Domain Record

| Field | Type | Description |
|-------|------|-------------|
| `domain_key` | string | e.g. `domain.structured_literacy` |
| `display_name` | string | |
| `track` | enum | `academy_virtual`, `academy_hs` |
| `description` | string | |
| `delivery_modes[]` | enum | virtual, hybrid, in_person |
| `min_group_size` | int | Scheduling constraint |
| `max_group_size` | int | |
| `learning_cycles_per_year` | int | Default rhythm |
| `status` | enum | draft, published, archived |
| `version` | semver | |

### 2.2 Strand Record

| Field | Type | Description |
|-------|------|-------------|
| `strand_key` | string | `{domain_key}.strand.{name}` |
| `domain_key` | ref | |
| `display_name` | string | |
| `sort_order` | int | |
| `description` | string | |

### 2.3 Competency Record

| Field | Type | Description |
|-------|------|-------------|
| `competency_key` | string | |
| `strand_key` | ref | |
| `display_name` | string | |
| `success_criteria` | text | Observable outcomes |
| `mastery_levels` | object | Level descriptors 0–4 |
| `progress_metrics[]` | ref | Metric keys |
| `assessment_types[]` | ref | |
| `intervention_links[]` | ref | MTSS / registry interventions |
| `requires_educator_confirmation` | bool | Default true for capstones |
| `prerequisites[]` | competency_key[] | |

### 2.4 Atomic Skill Record

| Field | Type | Description |
|-------|------|-------------|
| `skill_id` | string | **Globally unique** e.g. `AW-SL-001-042` |
| `competency_key` | ref | |
| `display_name` | string | |
| `description` | string | |
| `success_criteria` | text | |
| `mastery_levels` | object | Skill-level rubric |
| `evidence_types[]` | enum | Required types for L3 |
| `minimum_evidence_count` | int | |
| `assessment_types[]` | ref | |
| `parent_activities[]` | object | `{ activityKey, description, frequency }` |
| `ai_recommendation_rules[]` | ref | Decision registry keys |
| `intervention_links[]` | ref | |
| `related_skills[]` | skill_id[] | Graph edges |
| `prerequisites[]` | skill_id[] | |
| `wilson_crosswalk` | object | Optional `{ step, substep, skillCategory }` — framework only |
| `sort_order` | int | |

### 2.5 Supporting Registry Objects

| Object | Purpose |
|--------|---------|
| `evidence_type_catalog` | Domain evidence type definitions |
| `assessment_type_catalog` | Placement, probe, benchmark, portfolio, capstone |
| `progress_metric_catalog` | Computed metrics per competency |
| `intervention_link_catalog` | Links to VI-B Intervention Registry |
| `parent_activity_catalog` | Reusable home activities |

---

## 3. Skill ID Convention

```
AW-{DOMAIN_CODE}-{STRAND_NUM}-{SKILL_NUM}

Domain codes:
  SL  = Structured Literacy (Wilson)
  RM  = Real-Life Math
  LL  = LitLab
  EO  = Earthology
  LF  = Life Lab
  AV  = AI Venture Lab

Example: AW-SL-03-017
```

---

## 4. Domain Specifications

---

### 4.1 Structured Literacy (Wilson) — `domain.structured_literacy`

**Track:** Academy Virtual  
**Constitutional alignment:** Part VI-F Wilson Framework  
**Scheduling:** min group 2, virtual hour/:50  

#### Strands

| Strand Key | Name |
|------------|------|
| `domain.structured_literacy.strand.decoding` | Decoding & Word Recognition |
| `domain.structured_literacy.strand.encoding` | Encoding & Spelling |
| `domain.structured_literacy.strand.fluency` | Reading Fluency |
| `domain.structured_literacy.strand.vocabulary` | Vocabulary & Morphology |
| `domain.structured_literacy.strand.comprehension` | Comprehension |
| `domain.structured_literacy.strand.wrs_progression` | WRS Step Progression (framework bands) |

#### Competency Examples (WRS Progression Strand)

| Competency Key | Description | Wilson Crosswalk |
|----------------|-------------|------------------|
| `...wrs_progression.step_1_band` | Step 1 skills mastered | Step 1 |
| `...wrs_progression.step_2_band` | Step 2 skills mastered | Step 2 |
| *… through Step 12* | | |

#### Evidence Types

`observation.instructional`, `measurement.progress`, `measurement.assessment`, `artifact.product`

#### Assessment Types

`wilson_placement`, `retention_probe`, `orf_probe`, `spelling_probe`, `step_mastery_check`

#### Progress Metrics

`wilson.dosage.completion`, `wilson.growth.velocity`, `wilson.fidelity.session_score`

#### Parent Activities

Home practice plans (VI-F.16), reading minutes, sound drill logs

#### AI Recommendations

Next Step readiness, dosage recovery, grouping suggestion (human approved)

---

### 4.2 Real-Life Math — `domain.real_life_math`

**Track:** Academy Virtual  
**Scheduling:** min group 4  

#### Strands

| Strand Key | Name |
|------------|------|
| `domain.real_life_math.strand.number_sense` | Number Sense & Operations |
| `domain.real_life_math.strand.measurement` | Measurement & Data |
| `domain.real_life_math.strand.geometry` | Geometry & Spatial Reasoning |
| `domain.real_life_math.strand.financial_math` | Financial & Consumer Math |
| `domain.real_life_math.strand.problem_solving` | Real-World Problem Solving |

#### Competency Examples

| Competency | Sample Atomic Skills |
|------------|-------------------|
| Number Sense | `AW-RM-01-001` Place value to 1,000; `AW-RM-01-002` Multi-digit addition |
| Financial Math | `AW-RM-04-001` Budget creation; `AW-RM-04-002` Percent discount calculation |

#### Evidence Types

`artifact.product`, `measurement.assessment`, `observation.instructional`, `interaction.real_world_application`

#### Assessment Types

`placement_math`, `cbm_probe`, `performance_task`, `project_rubric`

#### Progress Metrics

`math.growth.velocity`, `math.application.transfer_rate`

#### Parent Activities

Grocery math, cooking measurements, budget planning with family

---

### 4.3 LitLab — `domain.litlab`

**Track:** Academy Virtual  
**Focus:** Reading engagement, literature analysis, writing craft  

#### Strands

| Strand Key | Name |
|------------|------|
| `domain.litlab.strand.reading_engagement` | Reading Engagement & Stamina |
| `domain.litlab.strand.literary_analysis` | Literary Analysis |
| `domain.litlab.strand.writing_craft` | Writing Craft |
| `domain.litlab.strand.discussion` | Discussion & Collaboration |
| `domain.litlab.strand.media_literacy` | Media & Information Literacy |

#### Evidence Types

`artifact.writing`, `artifact.reading_log`, `observation.discussion`, `measurement.rubric`

#### Assessment Types

`reading_conference`, `writing_portfolio`, `discussion_rubric`, `project_assessment`

#### Parent Activities

Shared reading, reading aloud, library visits, discussion prompts

---

### 4.4 Earthology — `domain.earthology`

**Track:** Academy Virtual  
**Focus:** Earth science, ecology, environmental stewardship  

#### Strands

| Strand Key | Name |
|------------|------|
| `domain.earthology.strand.earth_systems` | Earth Systems |
| `domain.earthology.strand.life_sciences` | Life & Ecosystems |
| `domain.earthology.strand.human_impact` | Human Impact & Stewardship |
| `domain.earthology.strand.inquiry` | Scientific Inquiry |
| `domain.earthology.strand.data_literacy` | Data & Environmental Literacy |

#### Evidence Types

`artifact.lab_report`, `artifact.project`, `measurement.assessment`, `observation.inquiry`

#### Assessment Types

`inquiry_project`, `lab_rubric`, `field_study`, `presentation`

#### Parent Activities

Nature observation logs, conservation projects at home, weather tracking

---

### 4.5 Life Lab™ — `domain.life_lab`

**Track:** Academy High School  
**Full framework:** Document 5  

#### Strands (Summary)

| Strand Key | Name |
|------------|------|
| `domain.life_lab.strand.financial_literacy` | Financial Literacy |
| `domain.life_lab.strand.employment` | Employment |
| `domain.life_lab.strand.independent_living` | Independent Living |
| `domain.life_lab.strand.communication` | Communication |
| `domain.life_lab.strand.executive_function` | Executive Function |
| `domain.life_lab.strand.leadership` | Leadership |
| `domain.life_lab.strand.relationships` | Relationships |
| `domain.life_lab.strand.health` | Health |
| `domain.life_lab.strand.community` | Community |
| `domain.life_lab.strand.career_readiness` | Career Readiness |
| `domain.life_lab.strand.decision_making` | Decision Making |
| `domain.life_lab.strand.self_advocacy` | Self-Advocacy |
| `domain.life_lab.strand.time_management` | Time Management |
| `domain.life_lab.strand.organization` | Organization |

Each strand: 4–8 competencies, 5–15 atomic skills per competency (full detail Document 5).

---

### 4.6 AI Venture Lab™ — `domain.ai_venture_lab`

**Track:** Academy High School  
**Full framework:** Document 4  

#### Strands (Summary)

| Strand Key | Name |
|------------|------|
| `domain.ai_venture_lab.strand.ai_literacy` | AI Literacy & Ethics |
| `domain.ai_venture_lab.strand.entrepreneurship` | Entrepreneurship |
| `domain.ai_venture_lab.strand.product_development` | Product Development |
| `domain.ai_venture_lab.strand.data_decision` | Data & Decision Making |
| `domain.ai_venture_lab.strand.marketing_growth` | Marketing & Growth |
| `domain.ai_venture_lab.strand.finance_venture` | Venture Finance |
| `domain.ai_venture_lab.strand.leadership_teams` | Team Leadership |
| `domain.ai_venture_lab.strand.capstone` | Capstone & Portfolio |

---

## 5. Cross-Domain Relationships

### 5.1 Intelligence Graph Edges

| Edge Type | Example |
|-----------|---------|
| `prerequisite` | AW-SL-02-005 → AW-SL-03-001 |
| `related` | AW-LF-05-003 (EF) ↔ AW-AV-04-002 (team leadership) |
| `cross_domain_support` | AW-SL-04-010 (fluency) → AW-LL-01-003 (reading stamina) |

### 5.2 Intervention Links

Each competency may link to VI-B Intervention Registry keys — e.g. `intervention.structured_literacy.intensive`, `intervention.math.concrete_representational`.

---

## 6. Progress Metrics (Universal Catalog)

| Metric Key | Applies To | Formula Concept |
|------------|------------|-----------------|
| `learning.mastery.velocity` | All | Skills reaching L3 per time window |
| `learning.stagnation.days` | All | Days since last level change |
| `learning.evidence.density` | All | Evidence items per active skill |
| `learning.pathway.completion_pct` | All | Mastered competencies / total |
| Domain-specific | Per domain | See domain sections |

---

## 7. AI Recommendation Rules (Registry References)

| Rule Key | Domain | Trigger |
|----------|--------|---------|
| `ai.learning.next_skill` | All | Prerequisite met + developing pattern |
| `ai.learning.intervention` | All | Stagnation > threshold |
| `ai.learning.reassessment` | All | Recency window expired |
| `ai.wilson.step_advancement` | SL | Step band skills L3 + fidelity met |
| `ai.life_lab.capstone_readiness` | LF | Strand completion pattern |
| `ai.venture.capstone_readiness` | AV | Portfolio criteria met |

All rules execute through **Platform Decision Engine** — not module-local AI.

---

## 8. Registry Governance

| Rule | Requirement |
|------|-------------|
| **LR-1** | Published registry changes versioned — never overwrite |
| **LR-2** | Skill ID immutable once published |
| **LR-3** | Wilson crosswalk category-coded only — no proprietary content |
| **LR-4** | Prerequisites acyclic — validated at publish |
| **LR-5** | Configuration Studio admin for org overrides (thresholds, not skill deletion) |

---

## 9. Implementation Sequence (Reference — Roadmap Wave 3+)

1. Registry schema + validation (Wave 3)  
2. Structured Literacy domain seed (Wave 3 — Wilson alignment)  
3. Real-Life Math + LitLab + Earthology seeds (Wave 3)  
4. Life Lab + Venture Lab seeds (Wave 3 scaffold → Wave 6 depth)  
5. Crosswalk to VI-B Universal Skill Registry (Wave 6)  
6. ARI research validation of mastery thresholds (Wave 6.5)  

---

*End of Document 2 — Complete Learning Registry Design*
