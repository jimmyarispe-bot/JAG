# DOCUMENT 26 — Assessment Item Standard™

**Project:** The Academy Way Learning System™ — Phase 4  
**Status:** Implementation Blueprint — Assessment Authoring Standard Only  
**Integrates:** Document 21 Assessment Framework · Document 25 Canonical Competency Specification · Document 27 Evidence Standard

---

## 1. Charter

The **Assessment Item Standard™ (AIS)** defines how **every assessment item** is authored, scored, validated, and linked to competencies and evidence in AcademyOS.

Assessment items are **registry objects** — not ad-hoc quiz questions in product modules.

**No assessment items are populated in this phase.** This document establishes authoring standards only.

---

## 2. Assessment Item Architecture

```
AssessmentMethod (Doc 21)
    └── AssessmentInstrument
            └── AssessmentItem[]
                    ├── Scoring Rubric / Key
                    ├── Evidence Mapping
                    └── Quality Metadata
```

| Level | Description |
|-------|-------------|
| **Method** | Type category — e.g., `assess.rlm.performance` |
| **Instrument** | Named assessment — e.g., "Budget Creation Performance Task v1" |
| **Item** | Single scorable unit within instrument |

---

## 3. Supported Assessment Modalities

Every modality **shall** define the universal item schema (§5).

| Modality Key | Description | Primary Evidence |
|--------------|-------------|----------------|
| `observation` | Educator observes performance in context | `observation.instructional` |
| `checklist` | Binary or scale checklist of behaviors | `observation.checklist` |
| `rubric` | Multi-dimensional criteria judgment | `measurement.rubric` |
| `performance_task` | Extended authentic demonstration | `artifact.performance` |
| `running_record` | Reading behavior capture during oral reading | `measurement.running_record` |
| `teacher_conference` | Structured conversation with scoring guide | `observation.conference` |
| `student_conference` | Self-assessment conference protocol | `self.reflection` |
| `parent_observation` | Structured home observation | `observation.parent` |
| `artifact_review` | Review of student product against criteria | `artifact.product` |
| `ai_assisted_review` | AI draft analysis + human validation | `measurement.ai_draft` |

---

## 4. Universal Assessment Item Schema

Every assessment item **shall** contain:

### 4.1 Identity

| Field | Required | Description |
|-------|----------|-------------|
| `item_key` | Yes | Immutable — `ASSESS-{DOMAIN}-{INSTRUMENT}-{ITEM}` |
| `instrument_key` | Yes | Parent instrument |
| `version` | Yes | semver |
| `status` | Yes | draft → published lifecycle |
| `modality` | Yes | From §3 |
| `title` | Yes | |
| `prompt` | Yes | Stimulus, task direction, or observation protocol |

### 4.2 Purpose

| Field | Required | Description |
|-------|----------|-------------|
| `purpose` | Yes | What this item measures and why |
| `target_competency_keys[]` | Yes | CCS competencies (Doc 25) |
| `target_skill_keys[]` | Optional | Atomic skills if skill-level |
| `mastery_level_target` | Yes | Typically L3; may specify L2 formative |

### 4.3 Reliability

| Field | Required | Description |
|-------|----------|-------------|
| `reliability_estimate` | Yes | 0–1 published estimate |
| `reliability_method` | Yes | How estimated — pilot, literature, expert |
| `inter_rater_protocol` | Conditional | Required for observation, rubric, conference |
| `anchor_samples_refs[]` | Conditional | Required for rubric modalities |
| `minimum_administrations_for_norm` | Optional | Sample size from pilot |

| Band | Use for L3 |
|------|------------|
| ≥ 0.85 | Primary evidence |
| 0.70–0.84 | Combine with other evidence |
| < 0.70 | Formative only |

### 4.4 Confidence

| Field | Required | Description |
|-------|----------|-------------|
| `base_confidence_weight` | Yes | 0–1 weight in mastery validation |
| `confidence_modifiers[]` | Yes | Factors that reduce instance confidence |
| Modifiers | | AI unvalidated, single rater, accommodated validity note |

Instance confidence computed per Doc 21 / Doc 23 — item defines **base weight**.

### 4.5 Scoring

| Field | Required | Description |
|-------|----------|-------------|
| `scoring_type` | Yes | `binary`, `scale`, `rubric_dimension`, `holistic`, `narrative` |
| `score_range` | Yes | e.g., 0–4, 0–100%, met/not met |
| `mastery_threshold` | Yes | Score at or above = contributes to L3 |
| `rubric_dimensions[]` | Conditional | `{ dimension, weight, descriptors[] }` |
| `scoring_guide` | Yes | Educator-facing instructions |

### 4.6 Evidence Mapping

| Field | Required | Description |
|-------|----------|-------------|
| `evidence_type_key` | Yes | Doc 27 taxonomy |
| `evidence_fields_captured[]` | Yes | What KEE record contains |
| `skill_evidence_weight` | Yes | Contribution to skill mastery calculation |
| `competency_evidence_weight` | Yes | Contribution to competency mastery |
| `bundle_rule_ref` | Optional | When item is one of required bundle |

### 4.7 Bias Review

| Field | Required | Description |
|-------|----------|-------------|
| `bias_review_status` | Yes | pending, passed, flagged, waived_with_note |
| `bias_review_notes` | Conditional | Required if flagged or waived |
| `bias_dimensions_checked[]` | Yes | cultural, linguistic, socioeconomic, gender, disability, geographic |
| `mitigations_applied[]` | Yes | Changes made post-review |

**Rule:** No publish without `passed` or documented waiver with compensating evidence requirement.

### 4.8 Accessibility Review

| Field | Required | Description |
|-------|----------|-------------|
| `accessibility_review_status` | Yes | pending, passed, flagged |
| `wcag_content_notes` | Yes | Perceivable, operable for modality |
| `alternative_formats[]` | Yes | Large print, screen reader, oral administration |
| `extended_time_eligible` | Yes | bool + validity note |

### 4.9 Localization Requirements

| Field | Required | Description |
|-------|----------|-------------|
| `source_locale` | Yes | BCP 47 authoring language |
| `translatable_fields[]` | Yes | prompt, rubric descriptors, etc. |
| `localization_notes` | Yes | Cultural neutrality; currency/units for RLM |
| `supported_locales[]` | Yes | Published translations |
| `locale_validity[]` | Optional | Per-locale psychometric note if available |

**Rule:** Performance tasks require locale overlay for scenarios (Doc A/D) — not translation of scenario alone.

---

## 5. Modality-Specific Requirements

### 5.1 Observation

| Required | Detail |
|----------|--------|
| Observation protocol | Step-by-step |
| Duration minimum | Minutes |
| Setting constraints | 1:1, small group, classroom |
| Fidelity checklist | Wilson sessions — VI-F |

### 5.2 Checklist

| Required | Detail |
|----------|--------|
| Items | Min 3 behaviors |
| Scale | yes/no or 3-point |
| Decision rule | X of Y for mastery contribution |

### 5.3 Rubric

| Required | Detail |
|----------|--------|
| Dimensions | Min 2 |
| Level descriptors | Min 3 levels per dimension |
| Anchor samples | Min 1 per level per dimension |
| Calibration guide | Inter-rater training |

### 5.4 Performance Task

| Required | Detail |
|----------|--------|
| Scenario | Authentic context |
| Materials list | |
| Time allocation | |
| Safety notes | Life Lab, field |
| Rubric ref | Holistic or analytic |

### 5.5 Running Record

| Required | Detail |
|----------|--------|
| Text level band | Qualitative |
| Coding system | Errors, self-corrections, miscues |
| Duration | Minutes of oral reading |

### 5.6 Teacher / Student Conference

| Required | Detail |
|----------|--------|
| Protocol questions | Ordered |
| Recording optional | Consent rules |
| Scoring guide | Per response cluster |

### 5.7 Parent Observation

| Required | Detail |
|----------|--------|
| Plain language | Family Journey reading level |
| Coaching card format | |
| Weight | Lower than educator — Doc 27 |

### 5.8 Artifact Review

| Required | Detail |
|----------|--------|
| Accepted artifact types | |
| Quality criteria | |
| Anti-plagiarism note | |

### 5.9 AI-Assisted Evidence Review

| Required | Detail |
|----------|--------|
| AI model class | Disclosed |
| Human validation required | Always for L3 |
| Confidence cap | Max 0.7 until human validates |
| Prohibited uses | High-stakes without review |

---

## 6. Instrument-Level Requirements

An **AssessmentInstrument** groups items:

| Field | Required |
|-------|----------|
| `instrument_key` | Yes |
| `method_key` | Doc 21 ref |
| `administration_time_minutes` | Yes |
| `administrator_qualifications[]` | Yes — e.g., Wilson certified |
| `items[]` | Min 1 |
| `composite_scoring_rule` | If multi-item |
| `pilot_data_ref` | Before publish |

---

## 7. Integration Matrix

| System | Role |
|--------|------|
| **Doc 25 Competency** | `assessment_method_keys[]` link here |
| **Doc 27 Evidence** | `evidence_type_key` mapping |
| **Doc 21 Framework** | Method taxonomy |
| **Doc 22 Playbook** | Checks for understanding embed items |
| **Doc 29 AI Coach** | Assessment timing recommendations |
| **KEE** | Instance storage |
| **Doc 30 Governance** | Review and publish workflow |

---

## 8. Authoring Workflow Summary

```
Draft item → Bias review → Accessibility review → Localization → Pilot (optional) → Expert review → Publish
```

Detail: Document 30.

---

## 9. Governance Rules

| Rule | Requirement |
|------|-------------|
| **AIS-1** | No item published without evidence mapping |
| **AIS-2** | Rubrics require anchor samples |
| **AIS-3** | AI-assisted items cap confidence until human validation |
| **AIS-4** | Parent observation never sole L3 evidence |
| **AIS-5** | SL items require Wilson expert review |
| **AIS-6** | Bias review mandatory for all modalities |

---

*End of Document 26 — Assessment Item Standard™*
