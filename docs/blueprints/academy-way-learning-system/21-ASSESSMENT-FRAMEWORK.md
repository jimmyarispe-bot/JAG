# DOCUMENT 21 — Assessment Framework™

**Project:** The Academy Way Learning System™ — Phase 3.5  
**Status:** Implementation Blueprint — Assessment Architecture Only  
**Integrates:** Documents 6, 12, 18, 19, 20, 22, 23

---

## 1. Charter

The **Assessment Framework™** defines **every assessment type** in AcademyOS — how evidence is elicited, validated, scheduled, and linked to ULR mastery.

**Assessment produces evidence.** It does not replace mastery philosophy (Document 6).

No single assessment type alone declares L3 Proficient unless registry explicitly allows.

---

## 2. Assessment Philosophy

| Principle | Statement |
|-----------|-----------|
| **Evidence-first** | Assessments are structured evidence capture events |
| **Formative dominant** | Most assessments guide instruction — not sort students |
| **Mastery validation** | Summative/performance tasks confirm L3 when criteria met |
| **Accommodation default** | Profile accommodations apply unless measurement invalidates |
| **Confidence transparency** | Every score carries reliability and confidence metadata |
| **Human validation** | AI-assisted assessment requires educator confirmation for L3 |

---

## 3. Assessment Type Catalog

Each type includes: purpose, use cases, ULR linkage, evidence output, scheduling notes.

---

### 3.1 Diagnostic

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Identify knowledge/skill gaps across domain for placement |
| **Use cases** | Enrollment; domain entry; post-long absence return |
| **ULR linkage** | Maps results to competency/sub-strand bands — not single skills only |
| **Evidence output** | `measurement.diagnostic` → KEE with band assignment |
| **Scheduling** | Admission window; dedicated block; not repeated frequently |
| **Reliability** | High for broad placement; moderate for fine-grained skill |

---

### 3.2 Placement

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Assign PAJ starting position in domain pathway |
| **Use cases** | New student; transfer; Wilson WRS initial; RLM strand entry |
| **ULR linkage** | Sets `domain_placement[]` on profile (Doc 19) |
| **Evidence output** | `measurement.placement` |
| **Scheduling** | Before domain instruction begins |
| **Wilson** | `assess.wilson.placement` (Doc 13) — certified administrator |

---

### 3.3 Screening

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Quick universal check for risk — triggers follow-up |
| **Use cases** | Beginning of cycle; literacy/math screen; wellbeing pulse |
| **ULR linkage** | Flags competencies for monitoring — not mastery |
| **Evidence output** | `measurement.screening` with risk flag |
| **Scheduling** | Cycle start; ≤20 min per screen |
| **Rule** | Screen positive → diagnostic or Tier 2 review — not label |

---

### 3.4 Benchmark

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Periodic standardized progress comparison against expectations |
| **Use cases** | MAP Growth; interim literacy/math benchmarks; intervention monitoring |
| **ULR linkage** | Crosswalk to domain competencies via Configuration Studio |
| **Evidence output** | `measurement.benchmark` with percentile/growth if applicable |
| **Scheduling** | 2–3× per year + intervention weekly probes |
| **MAP** | See §14 MAP outcome research link (Doc 24) |

---

### 3.5 Formative

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Inform immediate instructional adjustments |
| **Use cases** | Checks for understanding; exit tickets; Wilson error checks |
| **ULR linkage** | May update skill toward L2 — rarely L3 alone |
| **Evidence output** | `measurement.formative` |
| **Scheduling** | Embedded in every lesson (Playbook Doc 22) |
| **Frequency** | Multiple per session |

---

### 3.6 Summative

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Evaluate learning at end of unit/cycle/competency |
| **Use cases** | Cycle completion; competency capstone |
| **ULR linkage** | Competency-level evidence bundle |
| **Evidence output** | `measurement.summative` |
| **Scheduling** | End of Learning Cycle |
| **Rule** | Must align with `mastery_criteria` — not surprise content |

---

### 3.7 Performance Task

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Authentic demonstration in real or simulated context |
| **Use cases** | RLM scenarios; Earthology exhibition; Venture pitch; Life Lab demo |
| **ULR linkage** | `performance_task_ref` on skills (Doc 14) |
| **Evidence output** | `artifact.performance` + rubric scores |
| **Scheduling** | Extended blocks; SIE performance scheduling |
| **Mastery** | Primary path to L3 for applied competencies |

---

### 3.8 Portfolio

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Curated body of work demonstrating growth and mastery |
| **Use cases** | LitLab writing; project collections; graduation defense (Doc 10) |
| **ULR linkage** | `portfolio_eligible` skills |
| **Evidence output** | `artifact.portfolio` — aggregation of KEE records |
| **Scheduling** | Ongoing curation; review at cycle end |
| **Assessment** | Portfolio review method + defense |

---

### 3.9 Observation

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Educator documents performance in naturalistic setting |
| **Use cases** | Wilson fidelity; discussion; behavior regulation; field tasks |
| **ULR linkage** | `observation_indicators` on skills |
| **Evidence output** | `observation.instructional` or domain-specific |
| **Scheduling** | Continuous; structured observation protocols |
| **Rule** | Observation rubric required — not anecdote alone |

---

### 3.10 Running Record

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Capture reading behaviors during oral reading |
| **Use cases** | LitLab reading; fluency beyond Wilson ORF |
| **ULR linkage** | Reading strand competencies |
| **Evidence output** | `measurement.running_record` |
| **Scheduling** | Per guided reading cycle |
| **Wilson boundary** | Wilson ORF separate — Doc 13 |

---

### 3.11 Rubric

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Multi-dimensional criteria judgment |
| **Use cases** | Writing, presentations, projects, performance tasks |
| **ULR linkage** | Rubric dimensions map to skill_ids |
| **Evidence output** | Scores per dimension → KEE |
| **Registry** | Rubric catalog — references competencies |
| **Rule** | Anchor papers/examples required for inter-rater reliability |

---

### 3.12 Self Assessment

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Learner evaluates own work against criteria |
| **Use cases** | Reflection; metacognition; peer prep |
| **ULR linkage** | Supports L2–L3 — **not sole L3** unless registry allows |
| **Evidence output** | `self.reflection` |
| **Scheduling** | End of lesson; portfolio curation |

---

### 3.13 Peer Assessment

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Structured peer feedback against criteria |
| **Use cases** | Writing workshop; venture pitch practice |
| **ULR linkage** | Collaborative learning evidence supplement |
| **Evidence output** | `peer.review` |
| **Scheduling** | Structured protocol — trained peers |
| **Rule** | Educator validates for mastery decisions |

---

### 3.14 AI-Assisted Assessment

| Attribute | Definition |
|-----------|------------|
| **Purpose** | AI drafts scoring, feedback, or pattern detection |
| **Use cases** | Writing feedback draft; error pattern detection; practice scoring |
| **ULR linkage** | Same as underlying assessment type |
| **Evidence output** | AI draft + **educator confirmed** final |
| **Scheduling** | Async between sessions |
| **Rule** | `assessment_confidence` reduced until human validation (Doc 23) |

---

### 3.15 Mastery Validation

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Formal confirmation that L3 criteria met |
| **Use cases** | Skill promotion; competency completion; transcript eligibility |
| **ULR linkage** | `minimum_evidence_count` + types satisfied |
| **Evidence output** | `mastery.validation` event → PAJ update |
| **Scheduling** | When evidence bundle complete |
| **Human gate** | Educator confirmation if `requires_educator_confirmation` |

---

## 4. Assessment Method Registry

All assessment types register as **method keys** referenced by ULR:

```
assess.{domain}.{method}
```

Examples: `assess.wilson.step_check`, `assess.rlm.performance`, `assess.litlab.rubric`, `assess.map.benchmark`

---

## 5. Assessment Reliability

| Dimension | Definition | How Addressed |
|-----------|------------|---------------|
| **Internal consistency** | Items measure same construct | Method design; pilot data (Doc 24) |
| **Inter-rater reliability** | Observers agree | Rubric calibration; anchor samples |
| **Test-retest stability** | Scores stable when skill stable | Spacing between repeats |
| **Validity** | Measures intended skill | ULR skill linkage; expert review |

**Reliability score (0–1):** Assigned per method version — published in assessment catalog.

| Band | Meaning |
|------|---------|
| ≥ 0.85 | High — may contribute strongly to L3 |
| 0.70–0.84 | Moderate — combine with other evidence |
| < 0.70 | Low — formative only unless supplemented |

---

## 6. Assessment Confidence

Per **assessment instance** (not just method):

| Factor | Effect on Confidence |
|--------|---------------------|
| Reliability of method | Base weight |
| Accommodations applied | Noted — validity argument documented |
| AI unvalidated | Confidence capped |
| Single rater vs. calibrated | Adjust |
| Time since instruction | Decay for retention assessments |
| Profile completeness | Low profile → wider confidence interval |

**Output:** `assessment_confidence` (0–1) stored with evidence in KEE.

**Mastery rule:** L3 validation requires aggregate confidence ≥ org threshold (default 0.75).

---

## 7. Assessment Scheduling

| Assessment Type | Scheduling Owner | Pattern |
|-----------------|------------------|---------|
| Diagnostic / Placement | Admissions + SIE | One-time blocks |
| Screening | SIE cycle template | Cycle week 1 |
| Benchmark / MAP | SIE + org calendar | Fixed windows 2–3×/year |
| Formative | Teacher / Playbook | Every session |
| Summative | SIE cycle template | Cycle weeks 9–10 |
| Performance | SIE extended block | Per competency schedule |
| Portfolio review | Cycle + exhibition | End of cycle |
| Intervention probe | Intervention plan | Weekly Tier 2–3 |
| Mastery validation | Triggered | On evidence bundle complete |

**Whole-child constraint:** Assessment density limits per week — SIE balances with WCSS (VII-E).

---

## 8. Accommodation Integration

| Profile Field | Assessment Response |
|---------------|---------------------|
| `time_extension_eligible` | Extended time — validity note |
| `assistive_technology[]` | Permitted unless measures construct undermined |
| `sensory_modifications[]` | Environment adjustment |
| `communication_mode[]` | Alternative response mode |

Accommodations logged on evidence record — transparency for transcript reader.

---

## 9. Integration Matrix

| System | Role |
|--------|------|
| **ULR** | Skills, criteria, evidence types, methods |
| **KEE** | All assessment evidence storage |
| **PAJ** | Mastery state updates |
| **Learning Profile** | Accommodations |
| **Intervention** | Probe scheduling |
| **Playbook** | Formative checks embedded |
| **Analytics** | Confidence, growth, reliability trends |
| **Transcript** | Validated mastery only |
| **Research** | Method comparison (Doc 24) |

---

## 10. Governance

| Rule | Requirement |
|------|-------------|
| **ASF-1** | No high-stakes single score for L3 |
| **ASF-2** | All methods registered with reliability metadata |
| **ASF-3** | AI assessment requires human validation for mastery |
| **ASF-4** | MAP/benchmark crosswalk maintained in Configuration Studio |
| **ASF-5** | Assessment schedule published — predictable for families |
| **ASF-6** | Screening never stored as permanent label on profile |

---

*End of Document 21 — Assessment Framework™*
