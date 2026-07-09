# DOCUMENT 56 — Concept Library Quality Standard™

**Project:** The Academy Way Learning System™ — Phase 4.2A  
**Status:** Concept Library Enhancement Standard — Publication Gate for All Concept Libraries  
**Integrates:** Documents 52–55 · Document 51 (enhanced) · Docs 48, 49, 50

---

## 1. Charter

The **Concept Library Quality Standard™ (CLQS)** defines the **standardized review checklist** every Concept Library must satisfy before `published_blueprint` status — ensuring libraries are educationally accurate, neuroscience-informed, cognitive science-informed, EF-aware, AI-ready, scheduling-aware, family-supportive, and research-ready.

**Gate:** No concept library published without CLQS pass. Document 51 (revised) is first candidate.

---

## 2. Quality Dimensions

| Dimension | Standard Doc | Review Type |
|-----------|--------------|-------------|
| **Educational accuracy** | Core CL content | Educational review |
| **Neuroscience** | Doc 53 BDP | Neuroscience review |
| **Cognitive science** | Doc 52 CSP | Cognitive science review |
| **Accessibility** | CSP + plain language | Accessibility review |
| **International** | Doc A/D | International review |
| **Parent usability** | Doc 42 pattern | Parent usability review |
| **Teacher usability** | Doc 54 IDM | Teacher usability review |
| **AI explainability** | Doc 55 AIRP | AI explainability review |

---

## 3. Mandatory Concept Library Structure

Every Concept Library **shall** contain:

| Section | Source |
|---------|--------|
| Definition, purpose, importance | Core |
| Developmental progression | Core |
| Connections (SL, cross-domain, profiles) | Core — Doc 51 pattern |
| Misconceptions, errors, behaviors | Core |
| Assessment, evidence, observations | Core — Doc 40 pattern |
| Scheduling, intervention, accommodations | Core |
| Research summary | Core |
| Future derivation groups | Core |
| **Cognitive Science Profile** | **Doc 52 — mandatory** |
| **Brain Development Profile** | **Doc 53 — mandatory** |
| **Instructional Decision Model** | **Doc 54 — mandatory** |
| **AI Reasoning Profile** | **Doc 55 — mandatory** |
| Concept library metadata | Core |
| CLQS review record | Doc 56 |

---

## 4. Master Review Checklist

### 4.1 Educational Review

| # | Check | Pass |
|---|-------|------|
| E-1 | Definition academically accurate and plain-language clear | ☐ |
| E-2 | Purpose addresses all stakeholders | ☐ |
| E-3 | Developmental progression is guidance — not age gates | ☐ |
| E-4 | Misconceptions include corrections + reteach | ☐ |
| E-5 | Error patterns linked to intervention direction | ☐ |
| E-6 | Observable behaviors falsifiable | ☐ |
| E-7 | Assessment approaches align Doc 40/26 — no copyrighted instruments | ☐ |
| E-8 | Research summary cites public sources (min 2) | ☐ |
| E-9 | Future competency groups logical — not populated | ☐ |
| E-10 | OG/structured literacy alignment without Wilson proprietary content | ☐ |

**Reviewer:** Domain expert + curriculum director  
**Output:** `educational_review_status`

---

### 4.2 Neuroscience Review

| # | Check | Pass |
|---|-------|------|
| N-1 | Brain Development Profile complete (Doc 53) | ☐ |
| N-2 | High-level — no individual brain claims | ☐ |
| N-3 | No diagnostic neurology language | ☐ |
| N-4 | Neuroplasticity implications instructional — not medical | ☐ |
| N-5 | Developmental variability framed without pathology default | ☐ |
| N-6 | Min 2 research citations in BDP | ☐ |

**Reviewer:** Literacy/neuroscience advisor (consultant)  
**Output:** `neuroscience_review_status`

---

### 4.3 Cognitive Science Review

| # | Check | Pass |
|---|-------|------|
| C-1 | Cognitive Science Profile complete — all 12 fields (Doc 52) | ☐ |
| C-2 | Primary/secondary processes distinct and justified | ☐ |
| C-3 | WM/attention/EF levels consistent with concept demands | ☐ |
| C-4 | Instructional implications array present (3–8 items) | ☐ |
| C-5 | Demand levels use low/moderate/high enum | ☐ |
| C-6 | No IQ or fixed ability implications | ☐ |

**Reviewer:** Learning science lead  
**Output:** `cognitive_science_review_status`

---

### 4.4 Accessibility Review

| # | Check | Pass |
|---|-------|------|
| A-1 | Parent look-fors plain language | ☐ |
| A-2 | Student-facing text readable | ☐ |
| A-3 | Accommodations section meaningful | ☐ |
| A-4 | No disability-as-barrier framing (VI-D) | ☐ |
| A-5 | Multimodal evidence options where motor demands allow | ☐ |
| A-6 | WCAG-aware for any described digital artifacts | ☐ |

**Reviewer:** Accessibility specialist  
**Output:** `accessibility_review_status`

---

### 4.5 International Review

| # | Check | Pass |
|---|-------|------|
| I-1 | No US-only assumptions in examples | ☐ |
| I-2 | Multilingual learners addressed as strength | ☐ |
| I-3 | Global Doc A alignment noted where relevant | ☐ |
| I-4 | Cultural neutrality in scenarios | ☐ |

**Reviewer:** International education lead  
**Output:** `international_review_status`

---

### 4.6 Parent Usability Review

| # | Check | Pass |
|---|-------|------|
| P-1 | Parent observations actionable at home | ☐ |
| P-2 | Home practice capacity-aware | ☐ |
| P-3 | Does not instruct proprietary Wilson delivery | ☐ |
| P-4 | Celebrations and motivation strengths-first | ☐ |
| P-5 | Plain language — max grade 8 readability target | ☐ |

**Reviewer:** Family advisory panel (min 3)  
**Output:** `parent_usability_review_status`

---

### 4.7 Teacher Usability Review

| # | Check | Pass |
|---|-------|------|
| T-1 | Instructional Decision Model complete (Doc 54) | ☐ |
| T-2 | When to teach / when NOT actionable | ☐ |
| T-3 | Pacing ranges realistic | ☐ |
| T-4 | Grouping recommendations clear | ☐ |
| T-5 | Teacher look-fors usable in session | ☐ |
| T-6 | Usability score ≥ 4.0/5 (panel avg) | ☐ |

**Reviewer:** Educator panel (min 5)  
**Output:** `teacher_usability_review_status`

---

### 4.8 AI Explainability Review

| # | Check | Pass |
|---|-------|------|
| AI-1 | AI Reasoning Profile complete (Doc 55) | ☐ |
| AI-2 | Min 4 mastery + 4 struggle indicators | ☐ |
| AI-3 | Min 5 rule keys with human_review flags | ☐ |
| AI-4 | auto_mastery prohibited — documented | ☐ |
| AI-5 | Confidence factors include decrease conditions | ☐ |
| AI-6 | Explainability templates per rule | ☐ |

**Reviewer:** AI ethics + instructional designer  
**Output:** `ai_explainability_review_status`

---

## 5. Publication Gate

| Gate | Requirement |
|------|-------------|
| **All 8 reviews** | Status = `passed` |
| **Enhancement sections** | Docs 52–55 present |
| **Version** | semver assigned |
| **Wilson check** | SL libraries — no proprietary content |
| **Curator sign-off** | Library curator |

**Status transition:** `draft` → `published_blueprint` (Concept Library lifecycle — parallel to Doc 49).

---

## 6. Review Record Schema

```
CLQSReviewRecord
    ├── concept_library_key
    ├── document_ref
    ├── version
    ├── review_date
    ├── educational_review_status
    ├── neuroscience_review_status
    ├── cognitive_science_review_status
    ├── accessibility_review_status
    ├── international_review_status
    ├── parent_usability_review_status
    ├── teacher_usability_review_status
    ├── ai_explainability_review_status
    ├── overall_status              (passed / failed)
    ├── reviewer_ids[]
    └── revision_notes[]
```

---

## 7. Enhanced Template Reference

| Document | Role |
|----------|------|
| **51 (revised)** | First enhanced exemplar |
| **50** | Domain replication after SL complete |
| **57+** | Remaining SL concept libraries use enhanced template |

---

## 8. Relationship to Competency QA

| Stage | QA Standard |
|-------|-------------|
| **Concept Library** | Doc 56 CLQS |
| **Competency** | Doc 48 QAF |
| **Order** | CLQS pass → then competency derivation → QAF |

**Rule:** Competencies shall not publish until source concept library `published_blueprint`.

---

## 9. Governance

| Rule | Requirement |
|------|-------------|
| **CLQS-1** | No concept library without Docs 52–55 sections |
| **CLQS-2** | Eight reviews mandatory — no waivers on AI or educational |
| **CLQS-3** | Doc 51 must pass CLQS before PA competencies authored |
| **CLQS-4** | Checklist versioned — changes bump CLQS semver |
| **CLQS-5** | Failed review returns with revision codes (Doc 48 pattern) |

---

*End of Document 56 — Concept Library Quality Standard™*
