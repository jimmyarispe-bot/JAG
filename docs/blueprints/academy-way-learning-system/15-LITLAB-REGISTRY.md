# DOCUMENT 15 — LitLab™ Registry

**Project:** The Academy Way Learning System™ — Phase 3  
**Domain Key:** `domain.litlab`  
**Status:** Registry Architecture Only — Competency Architecture, No Skill Enumeration

---

## 1. Charter

LitLab™ is the **integrated language arts competency domain** — reading, writing, communication, and critical thinking beyond Wilson Structured Literacy (which remains separate for decoding/encoding).

**Boundary with Structured Literacy:**
- **Wilson (Doc 13):** Decoding, encoding, WRS progression — exclusive curriculum
- **LitLab:** Comprehension depth, composition, rhetoric, research, digital/media literacy — complementary, not duplicate

Cross-links between domains use `cross_domain_links` — never duplicate Wilson skill definitions in LitLab.

---

## 2. Registry Position in ULR

```
domain.litlab
    └── [14 Strands — §3]
            └── [Sub-Strands — §4]
                    └── [Competencies — §5]
                            └── [Atomic Skills — Phase 4]
```

**Domain code:** `LL`  
**Skill ID prefix:** `AW-LL-{strand_code}-{skill}`

---

## 3. Strand Architecture

| Strand Key | Name | Scope |
|------------|------|-------|
| `domain.litlab.strand.reading` | Reading | Literary and informational reading |
| `domain.litlab.strand.writing` | Writing | Composition across genres |
| `domain.litlab.strand.vocabulary` | Vocabulary | Academic and domain vocabulary |
| `domain.litlab.strand.grammar` | Grammar | Conventions and syntax |
| `domain.litlab.strand.speaking` | Speaking | Oral expression |
| `domain.litlab.strand.listening` | Listening | Active listening, comprehension |
| `domain.litlab.strand.research` | Research | Inquiry, sources, synthesis |
| `domain.litlab.strand.digital_literacy` | Digital Literacy | Online tools, digital citizenship |
| `domain.litlab.strand.media_literacy` | Media Literacy | Analysis of media messages |
| `domain.litlab.strand.academic_communication` | Academic Communication | School discourse norms |
| `domain.litlab.strand.professional_communication` | Professional Communication | Workplace communication |
| `domain.litlab.strand.presentation_skills` | Presentation Skills | Public speaking, visual aids |
| `domain.litlab.strand.critical_thinking` | Critical Thinking | Analysis, evaluation, argument |
| `domain.litlab.strand.creative_thinking` | Creative Thinking | Original expression, ideation |

---

## 4. Sub-Strand Architecture (Per Strand)

Each strand uses **genre/mode-based sub-strands**:

| Strand | Sub-Strand Pattern |
|--------|-------------------|
| **Reading** | literary, informational, poetry, drama, primary_sources |
| **Writing** | narrative, expository, argumentative, poetry, technical |
| **Vocabulary** | context_clues, word_families, academic_tier, domain_specific |
| **Grammar** | sentence_structure, punctuation, usage, style |
| **Speaking** | discussion, debate, storytelling, interview |
| **Listening** | lecture, discussion, media, multi_speaker |
| **Research** | question_formulation, source_evaluation, synthesis, citation |
| **Digital Literacy** | navigation, creation, collaboration, safety |
| **Media Literacy** | advertising, news, social_media, bias_detection |
| **Academic Communication** | classroom_discourse, email_to_teacher, peer_feedback |
| **Professional Communication** | email, memo, meeting, networking |
| **Presentation Skills** | structure, delivery, visuals, Q&A |
| **Critical Thinking** | claim_evidence, logical_fallacies, perspective_taking |
| **Creative Thinking** | brainstorming, revision, genre_blending |

---

## 5. Competency Architecture

### 5.1 Competency Naming Pattern

`{strand}.{sub_strand}.{outcome_tier}`

**Outcome tiers (universal across LitLab):**

| Tier | Name | Description |
|------|------|-------------|
| **T1** | Engage | Participate with support |
| **T2** | Analyze | Break down and interpret |
| **T3** | Create | Produce original work |
| **T4** | Refine | Revise and publish to audience |

### 5.2 LitLab-Specific Competency Fields

| Field | Description |
|-------|-------------|
| `genre_or_mode` | Sub-strand genre |
| `text_complexity_band` | Qualitative complexity — not grade level gate |
| `wilson_prerequisite_note` | If decoding demand high — link to SL skills |
| `portfolio_artifact_type` | essay, recording, presentation, etc. |
| `audience_type` | peer, teacher, community, public |

### 5.3 Example Competency Structure (Writing — template only)

```
domain.litlab.strand.writing
    └── sub_strand.writing.argumentative
            ├── competency.argumentative.engage      (identify claim in model text)
            ├── competency.argumentative.analyze     (evaluate evidence in argument)
            ├── competency.argumentative.create      (draft argumentative essay)
            └── competency.argumentative.refine      (revise for publication)
```

*Atomic skills populate under each competency in Phase 4.*

---

## 6. Atomic Skill Representation (Phase 4 Pattern)

| Required LitLab Field | Purpose |
|-----------------------|---------|
| `text_type` | Genre/mode |
| `product_format` | Written, oral, multimodal |
| `rubric_dimension` | Which rubric axis skill measures |
| `sl_dependency[]` | Optional Wilson skill prerequisites for text access |

---

## 7. Evidence Architecture

| Evidence Type | LitLab Use |
|---------------|------------|
| `artifact.writing` | Drafts, final compositions |
| `artifact.reading_log` | Reading responses |
| `artifact.presentation` | Slides, recordings |
| `artifact.research` | Bibliography, notes |
| `observation.discussion` | Socratic seminar, debate |
| `peer.review` | Structured peer feedback |
| `self.reflection` | Metacognitive writing |

**Portfolio:** Primary domain for Digital Portfolio (Document 10) — high `portfolio_eligible` rate

**Transcript:** T3/T4 competencies default `transcript_eligible`

---

## 8. Assessment Architecture

| Method Key | Use |
|------------|-----|
| `assess.litlab.rubric` | Genre-specific rubric |
| `assess.litlab.portfolio_review` | Collection assessment |
| `assess.litlab.oral_presentation` | Speaking/presentation |
| `assess.litlab.research_defense` | Research strand |
| `assess.litlab.conference` | Writing conference |

**Rubric registry:** LitLab rubrics reference ULR competency keys — not standalone rubric silos.

---

## 9. Wilson Integration (Cross-Domain)

| LitLab Demand | SL Prerequisite Pattern |
|---------------|-------------------------|
| Independent novel reading | Fluency + comprehension SL competencies |
| Spelling in writing | Encoding SL skills — not re-taught in LitLab |
| Vocabulary in context | Vocabulary strand links to SL vocabulary sub-strand |

**Rule:** LitLab competencies may declare `prerequisites[]` pointing to `AW-SL-*` skills — never duplicate decoding instruction.

---

## 10. AI Recommendation Framework

| Rule Key | Trigger | Output |
|----------|---------|--------|
| `ai.litlab.genre_path` | Student interest + mastery | Next genre sub-strand |
| `ai.litlab.writing_cycle` | Draft evidence submitted | Revision skill sequence |
| `ai.litlab.reading_level` | Comprehension evidence | Text complexity band |
| `ai.litlab.sl_bridge` | Reading struggle pattern | SL skill recommendation (cross-domain) |
| `ai.litlab.portfolio_gap` | Portfolio review | Missing artifact types |

---

## 11. Scheduling Intelligence References

| Element | LitLab Consideration |
|---------|---------------------|
| **Writing blocks** | Extended time for composition |
| **Seminar format** | Discussion strands — small group |
| **Presentation slots** | Presentation skills — audience scheduling |
| **Conference time** | Teacher writing conferences |
| **Cycle integration** | LitLab Learning Cycles per Document 1 |

---

## 12. PAJ & Graduation Readiness

| Integration | Mapping |
|-------------|---------|
| **PAJ pathway** | Student emphasis: writer, researcher, communicator tracks |
| **Graduation readiness** | Communication, critical thinking domains (Doc 7) |
| **Earthology cross-link** | Research strand supports social studies inquiry |
| **Venture Lab cross-link** | Professional communication, presentation |

---

## 13. Expansion Protocol

| Change | Process |
|--------|---------|
| New genre sub-strand | Add under strand; competency tier template |
| New media form (e.g., podcast) | Extend presentation or digital sub-strand |
| AI writing tools policy | Version digital_literacy competencies — not new domain |

---

## 14. Phase 4 Boundary

Phase 4 estimates **300–450 atomic skills** across 14 strands. Phase 3 delivers strand/sub-strand/competency tier architecture and integration contracts.

---

*End of Document 15 — LitLab™ Registry*
