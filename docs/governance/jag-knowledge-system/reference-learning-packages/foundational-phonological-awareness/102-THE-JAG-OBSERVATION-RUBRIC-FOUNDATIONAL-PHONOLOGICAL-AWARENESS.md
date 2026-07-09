# DOCUMENT 102 — The JAG™ Observation Rubric™

**Foundational Phonological Awareness**  
**Rubric Key:** `rubric.sl.pa.observation.v1.0.0`  
**Competency Library:** Document 98  
**Teacher Guide Cross-Ref:** Document 99  
**Version:** 1.0.0  
**Status:** Reference Implementation — Gold Standard  
**Audience:** Teachers (self), Instructional Coaches, School Leaders

---

## 1. Charter

This rubric provides **calibrated observation tools** for phonological awareness instruction fidelity, learner evidence quality, and session design — aligned to Document 98 competencies and Document 99 teacher practices.

**Uses:**

- Self-reflection after PA sessions  
- Instructional coach observation cycles  
- Leader walkthroughs and network fidelity audits  
- PD Module capstone (Document 101)  
- Certification practical demonstration (Document 103)

**Not for:** Grading teachers · punitive evaluation without coaching support

---

## 2. Rubric Architecture

```
ObservationRubric
    ├── teacher_self_assessment
    ├── coach_observation
    ├── leader_walkthrough
    ├── shared_domains[]          (4 domains — all instruments)
    ├── scoring_scale             (1–5)
    └── evidence_capture_checklist
```

### Scoring Scale

| Score | Label | Definition |
|-------|-------|------------|
| **5** | Exemplary | Exceeds criteria; model for others |
| **4** | Proficient | Meets all criteria consistently |
| **3** | Developing | Meets most criteria; minor gaps |
| **2** | Emerging | Significant gaps; coaching needed |
| **1** | Not observed / Not met | Missing or contrary to practice |

**Proficiency threshold:** ≥ 3.5 average on Domains 1–4 · no domain below 3 for coach sign-off.

---

## 3. Shared Observation Domains

### Domain 1 — Instructional Design & Fidelity

| Criterion | 5 Exemplary | 3 Developing | 1 Not Met |
|-----------|-------------|--------------|-----------|
| **1.1 Competency alignment** | Session targets correct Doc 98 competency; visible to learner | Target identified but not shared | No clear competency target |
| **1.2 Explicit instruction** | I Do / We Do / You Do clear; one task type per block | Modeling present but rushed | Implicit or discovery-only |
| **1.3 Sequence fidelity** | Prerequisites honored; no skip | Minor sequence deviation with justification | Skipped prerequisites |
| **1.4 Session length** | 10–15 min PA focus | 16–20 min | > 20 min or < 5 min |
| **1.5 Cumulative review** | 30% review of prior competencies | Some review | No review |
| **1.6 Print boundary** | Oral only — no letter requirement | Brief letter mention — not assessed | Letter drills during PA |
| **1.7 OG alignment** | Sequential, cumulative, diagnostic, direct evident | Partial OG principles | Contrary to explicit sequential |

### Domain 2 — Assessment & Evidence

| Criterion | 5 Exemplary | 3 Developing | 1 Not Met |
|-----------|-------------|--------------|-----------|
| **2.1 Success criteria** | Stated; aligned to Doc 98 | Implied | Absent or vague |
| **2.2 Formative check** | End-of-session probe/check | Occasional check | No check |
| **2.3 Probe threshold** | 4/5 criterion understood and applied | Inconsistent threshold | No threshold |
| **2.4 Evidence logging** | KEE entry same session | Delayed logging | No logging |
| **2.5 Evidence types** | ≥ 2 types planned for L3 path | 1 type | No plan |
| **2.6 Nonsense word use** | Used appropriately on blend/segment | Rare | Inappropriate or absent |
| **2.7 Advancement decision** | Evidence-based; educator gate | Premature advance | Age-based advance |

### Domain 3 — Differentiation & Access

| Criterion | 5 Exemplary | 3 Developing | 1 Not Met |
|-----------|-------------|--------------|-----------|
| **3.1 Differentiation bands** | Approaching/on/extension evident | One band addressed | One-size-fits-all |
| **3.2 Profile responsive** | EF, attention, multilingual considered | Partial | Ignored |
| **3.3 Accommodations** | Valid accommodations; criteria maintained | Accommodations ad hoc | Criteria lowered |
| **3.4 Grouping** | Appropriate pair/small group/1:1 | Whole group only — inappropriate | Chaotic grouping |
| **3.5 EF supports** | Breaks, preview, chunking as needed | Some supports | Overload evident |
| **3.6 Engagement** | Learners active 10+ min | Mixed | Shutdown < 5 min unaddressed |

### Domain 4 — Communication & Integration

| Criterion | 5 Exemplary | 3 Developing | 1 Not Met |
|-----------|-------------|--------------|-----------|
| **4.1 Plain language** | Learner understands goal | Partially clear | Jargon-heavy |
| **4.2 Family connection** | Extension assigned when L2+ | Mentioned | No connection |
| **4.3 AI Coach use** | Recommendations within human gates | Occasional over-reliance | Auto-mastery attempted |
| **4.4 Error response** | Error patterns addressed per Doc 98 | Generic correction | Errors ignored |
| **4.5 Multilingual strength** | Home language valued | Neutral | Deficit framing |

---

## 4. Teacher Self-Assessment Instrument

**Instrument key:** `rubric.sl.pa.self.v1.0.0`  
**When:** After each PA session block or weekly reflection  
**Duration:** 5 minutes

### Self-Assessment Form

| Field | Entry |
|-------|-------|
| Date | |
| Competency key(s) | |
| Domain 1 score (1–5) | |
| Domain 2 score (1–5) | |
| Domain 3 score (1–5) | |
| Domain 4 score (1–5) | |
| One strength | |
| One growth area | |
| Next session adjustment | |

### Reflection Prompts

1. Did I honor the 10–15 minute PA burst?  
2. Did I include cumulative review?  
3. Did I log evidence to KEE?  
4. Did I keep instruction oral without letter conflation?  
5. What error pattern did I see — and what will I do next session?

---

## 5. Instructional Coach Observation Instrument

**Instrument key:** `rubric.sl.pa.coach.v1.0.0`  
**When:** Full cycle — pre-conference, observation, debrief (30–45 min observation)  
**Minimum frequency:** 2× per teacher per PA instructional period

### Coach Observation Protocol

**Pre-conference (10 min):**

- Target competency and success criteria  
- Learner profile considerations  
- Teacher self-assessment from prior session  

**Observation (30–45 min):**

- Score Domains 1–4 using shared criteria  
- Narrative evidence notes — timestamped  
- Learner sample behaviors (anonymized in network reports)  
- Complete **Evidence Capture Checklist** (§8)

**Debrief (20 min):**

- Strength → growth → action plan  
- Schedule follow-up observation  
- Link to PD Module or microcredential if gap persists  

### Coach-Specific Additions

| Criterion | Focus |
|-----------|-------|
| **C.1 Calibration** | Coach probe spot-check matches teacher judgment |
| **C.2 Coaching stance** | Non-evaluative; growth-oriented |
| **C.3 Resource connection** | Doc 99, 100, 101 referenced in action plan |
| **C.4 Tier awareness** | Flat probe protocol followed |

### Coach Sign-Off Criteria

| Requirement | Threshold |
|-------------|-----------|
| Domain average | ≥ 3.5 |
| No domain | Below 3 |
| Evidence checklist | ≥ 80% items observed |
| Action plan | Documented with date |

---

## 6. School Leader Walkthrough Instrument

**Instrument key:** `rubric.sl.pa.leader.v1.0.0`  
**When:** Brief walkthrough (10–15 min) or program review  
**Purpose:** Organizational fidelity — not individual teacher ranking

### Leader Walkthrough Form

| Domain | Look-For | Y / N / N-A | Notes |
|--------|----------|-------------|-------|
| **Environment** | Quiet auditory space for PA | | |
| **Environment** | Visual schedule visible where EF supports used | | |
| **Instruction** | Oral PA activity in progress | | |
| **Instruction** | No letter flashcards during pure PA segment | | |
| **Assessment** | Probe or checklist in use | | |
| **Data** | PAJ/competency visible on teacher screen | | |
| **Dosage** | PA scheduled 4–5× weekly for active PA learners | | |
| **Family** | Parent extension visible when applicable | | |
| **AI** | Teacher confirms AI suggestions — no auto-actions | | |

### Leader Aggregate Review Questions

1. What percentage of PA-active learners have weekly probes logged?  
2. How many learners are on Tier 2 PA plans?  
3. Is PA dosage meeting Document 98 shared parameters?  
4. Are coaches completing 2× observation cycles?  
5. What PD completion rate for `pl.module.sl.pa.foundation`?

### Leader Reporting

| Metric | Source |
|--------|--------|
| Walkthrough fidelity score | This rubric aggregate |
| Program health | Document 104 executive metrics |

---

## 7. Learner Evidence Observation Checklist

**Checklist key:** `checklist.sl.pa.observation.v1.0.0`  
**Use:** Mastery validation support — links to KEE `observation.checklist`

### Session Checklist

| Item | Competency Ref | Met? |
|------|----------------|------|
| Learner segments 5-word sentence correctly | PA-001 | ☐ |
| Learner counts words without clapping | PA-002 | ☐ |
| Learner blends 2 syllables ≤ 3 sec | PA-003 | ☐ |
| Learner segments 2-syllable word | PA-007 | ☐ |
| Learner identifies rhyme pair | PA-011 | ☐ |
| Learner produces rhyme | PA-012 | ☐ |
| Learner blends onset-rime CVC | PA-014 | ☐ |
| Learner segments onset-rime CVC | PA-016 | ☐ |
| Learner isolates initial phoneme (sound) | PA-019 | ☐ |
| Learner maintains engagement 10 min | All | ☐ |
| Accommodation documented | All | ☐ |
| No letter-name substitution for phoneme | PA-019 | ☐ |

**Critical items for capstone (PA-024):** All applicable items for learner's stage + retention note.

---

## 8. Evidence Capture Checklist (Observer)

| # | Item | Observed |
|---|------|----------|
| 1 | competency_key stated or visible | ☐ |
| 2 | Success criteria communicated | ☐ |
| 3 | Teacher model performed | ☐ |
| 4 | Guided practice with ≥ 2 learners | ☐ |
| 5 | Formative probe administered | ☐ |
| 6 | Scores recorded | ☐ |
| 7 | Review of prior competency | ☐ |
| 8 | Session within time parameter | ☐ |
| 9 | Differentiation evident | ☐ |
| 10 | EF support if profile indicates | ☐ |

---

## 9. Scoring & Calibration

### Calibration Protocol

| Step | Action |
|------|--------|
| 1 | Network releases anchor video exemplars (L3 fidelity — future production) |
| 2 | Coaches score independently — discuss variance > 1 point |
| 3 | Quarterly calibration session — min 3 coaches |
| 4 | Anchor scripts updated on Document 98 MINOR version |

### Inter-Rater Target

| Context | Agreement Target |
|---------|------------------|
| Coach vs. coach | ≥ 0.80 on domain scores |
| Coach vs. teacher self | Within 1 point average — discuss gaps |

---

## 10. Governance

| Source | Role |
|--------|------|
| Document 98 | Competency behaviors |
| Document 99 | Instructional standards |
| Document 101 | PD capstone |
| Document 103 | Certification practical |
| Document 48 | QA alignment |

**Asset keys:**

- `jag.rubric.sl.pa.self.v1.0.0`  
- `jag.rubric.sl.pa.coach.v1.0.0`  
- `jag.rubric.sl.pa.leader.v1.0.0`  
- `jag.checklist.sl.pa.observation.v1.0.0`

---

*End of Document 102 — The JAG™ Observation Rubric™: Foundational Phonological Awareness*

*The JAG™ — All Rights Reserved*
