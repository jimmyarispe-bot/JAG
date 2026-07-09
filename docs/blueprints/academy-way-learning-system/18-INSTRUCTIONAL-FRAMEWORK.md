# DOCUMENT 18 — The Academy Way Instructional Framework™

**Project:** The Academy Way Learning System™ — Phase 3.5  
**Status:** Implementation Blueprint — Instructional Science Only  
**Authority:** Governs Documents 19–24 and all ULR instructional metadata (Doc 12)  
**Prerequisite for:** Phase 4 Atomic Skill Libraries

---

## 1. Charter

The **Academy Way Instructional Framework™** defines the **instructional science and pedagogical philosophy** that governs how learning occurs in AcademyOS.

It is **not** curriculum. It is **not** lesson content. It is the **canonical reference** for:
- Which instructional models apply to which registry skills
- How lessons are designed (Document 22)
- How interventions are structured (Document 20)
- How assessments align with instruction (Document 21)
- How analytics measure effectiveness (Document 23)

**Evidence determines mastery (Document 6). Instruction determines how evidence is produced.**

---

## 2. Foundational Philosophy

| Principle | Statement |
|-----------|-----------|
| **Explicit before implicit** | New skills receive clear, direct instruction before discovery |
| **Evidence over assumption** | Instructional choices validated by learner evidence |
| **Mastery before advance** | No progression without Proficient (L3) unless acceleration protocol applies |
| **Whole child** | Instruction adapts to profile — not label (Document 19) |
| **Agency within structure** | Student choice within evidence-defined pathways |
| **Science-informed, human-led** | AI assists; educators decide |

---

## 3. Instructional Model Catalog

Each model below includes: **Purpose**, **Best Use Cases**, **Limitations**, **Evidence Base**, **AcademyOS Integration**.

Models are registered in the **Instructional Strategy Registry** (VI-B) and referenced by ULR atomic skills via `instructional_strategies[]`.

---

### 3.1 Direct Instruction

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Deliver clear, sequenced explanation of new content with high teacher control |
| **Best use cases** | Novice learners; foundational concepts; Wilson WRS sessions; safety-critical Life Lab skills |
| **Limitations** | Passive if overused; insufficient for transfer without practice; less effective for open-ended inquiry alone |
| **Evidence base** | Strong for basic skills acquisition (Hattie d≈0.59); meta-analyses support structured explicit teaching |
| **AcademyOS integration** | Default for `difficulty: foundational`; linked in Instructional Playbook (Doc 22) `teacher_modeling`; SIE allocates teacher-led blocks; fidelity tracked for Wilson |

---

### 3.2 Explicit Instruction

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Make learning intentions, success criteria, and steps visible and unambiguous |
| **Best use cases** | All domains at skill introduction; neurodiverse learners; multi-step procedures (RLM, Venture Lab) |
| **Limitations** | Requires teacher preparation; can feel rigid if not paired with agency |
| **Evidence base** | Rosenshine Principles; high effect sizes for explicit teaching of procedural and declarative knowledge |
| **AcademyOS integration** | Required fields in Playbook: objective, success criteria, vocabulary; ULR `mastery_criteria` must align; AI recommends explicit mode when `common_error_patterns` elevated |

---

### 3.3 Gradual Release (I Do → We Do → You Do)

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Transfer responsibility from teacher to student through staged practice |
| **Best use cases** | Skill acquisition across all domains; writing instruction; math procedures; decoding progression |
| **Limitations** | Skipping stages causes gaps; "We Do" often under-planned |
| **Evidence base** | Pearson & Gallagher model; widely validated in literacy and math intervention research |
| **AcademyOS integration** | Playbook sections map 1:1: modeling → guided → independent; evidence types differ by stage; analytics track time-in-stage (Doc 23) |

---

### 3.4 Mastery Learning

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Ensure proficiency before advancement; remediate until criteria met |
| **Best use cases** | Core competency chains; Wilson Step progression; prerequisite-heavy domains |
| **Limitations** | Requires flexible pacing; social comparison risk if poorly communicated |
| **Evidence base** | Bloom; Kulik & Kulik meta-analyses; positive effects with corrective feedback |
| **AcademyOS integration** | Document 6 mastery levels; PAJ blocks next skill until L3; Intervention Framework (Doc 20) triggers on non-mastery |

---

### 3.5 Cognitive Science (General Principles)

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Apply memory, attention, and processing research to instructional design |
| **Best use cases** | All instruction design; profile-informed pacing (Doc 19) |
| **Limitations** | Lab findings require classroom translation; individual variation |
| **Evidence base** | Cognitive Load Theory (Sweller); limited working memory; schema formation |
| **AcademyOS integration** | EF demands on ULR skills; chunking in Playbook; Learning Profile working memory field informs session length |

---

### 3.6 Retrieval Practice

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Strengthen memory through active recall rather than re-reading |
| **Best use cases** | Vocabulary; math facts; Wilson review; content consolidation |
| **Limitations** | Can increase frustration if too difficult; requires prior encoding |
| **Evidence base** | Roediger & Butler; testing effect; d≈0.50–0.70 in meta-analyses |
| **AcademyOS integration** | Assessment methods include low-stakes retrieval; spacing scheduler (SIE); `practice_effectiveness` metric (Doc 23) |

---

### 3.7 Spaced Practice

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Distribute practice over time to improve long-term retention |
| **Best use cases** | Wilson cumulative review; skill maintenance; post-mastery retention |
| **Limitations** | Requires scheduling infrastructure; delayed gratification |
| **Evidence base** | Ebbinghaus forgetting curve; Cepeda et al. spacing meta-analyses |
| **AcademyOS integration** | Scheduling Intelligence schedules review sessions; `spacing_effectiveness` metric; intervention review cycles |

---

### 3.8 Interleaving

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Mix practice of related but distinct skills to improve discrimination and transfer |
| **Best use cases** | Math problem types; decoding patterns; grammar vs. vocabulary |
| **Limitations** | Feels harder initially; less appropriate during initial acquisition |
| **Evidence base** | Rohrer & Taylor; improved transfer in math and motor skills |
| **AcademyOS integration** | AI recommendation when related skills at L3; session plans mix `related_skills[]` from ULR |

---

### 3.9 Dual Coding

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Combine verbal and visual representations to reduce cognitive load |
| **Best use cases** | Earthology diagrams; RLM scenarios; Wilson multisensory; Venture Lab pitches |
| **Limitations** | Redundant visuals add load; must align channels |
| **Evidence base** | Paivio Dual Coding Theory; Mayer multimedia principles |
| **AcademyOS integration** | Playbook materials field; portfolio multimodal artifacts; UDL representation principle |

---

### 3.10 Worked Examples

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Show complete solved examples before independent problem-solving |
| **Best use cases** | Novice learners; complex procedures; RLM budgeting; writing models |
| **Limitations** | Expertise reversal effect — fade as competence grows |
| **Evidence base** | Sweller; strong for novice, reduce as expertise increases |
| **AcademyOS integration** | Playbook modeling section; fade prompts when skill at L2+; AI adjusts example density by mastery level |

---

### 3.11 Feedback

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Provide specific, timely information to close gap between performance and criteria |
| **Best use cases** | All practice; writing conferences; Wilson error correction; venture pitch revision |
| **Limitations** | Delayed or vague feedback reduces effect; ego-threat if poorly delivered |
| **Evidence base** | Hattie & Timperley; d≈0.70; formative assessment research |
| **AcademyOS integration** | KEE evidence includes feedback records; rubric dimensions; AI draft feedback requires educator review |

---

### 3.12 Metacognition

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Develop awareness and regulation of one's own learning processes |
| **Best use cases** | Reflection sections; self-assessment; goal-setting; PAJ pathway choices |
| **Limitations** | Requires explicit teaching; younger learners need scaffolding |
| **Evidence base** | Dunlosky et al.; self-regulated learning research |
| **AcademyOS integration** | Playbook reflection; portfolio metacognitive artifacts; Student Voice in profile (Doc 19) |

---

### 3.13 Motivation

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Sustain engagement through autonomy, competence, and relatedness |
| **Best use cases** | Interest-aligned pathways; venture projects; family activities |
| **Limitations** | Extrinsic rewards can undermine intrinsic motivation if misapplied |
| **Evidence base** | Self-Determination Theory (Deci & Ryan); expectancy-value frameworks |
| **AcademyOS integration** | Profile interests/goals; Opportunity Engine matches; engagement metric (Doc 23); avoid grade-as-reward |

---

### 3.14 Student Agency

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Enable learner choice within structured evidence pathways |
| **Best use cases** | PAJ pathway emphasis; project selection; LitLab genre choice; venture idea |
| **Limitations** | Requires clear boundaries; overwhelming choice without scaffolding |
| **Evidence base** | Learner agency correlates with persistence and ownership in competency-based systems |
| **AcademyOS integration** | PAJ pathway UI; Student Voice; AI presents options not mandates; graduation readiness co-design |

---

### 3.15 Universal Design for Learning (UDL)

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Proactively design multiple means of engagement, representation, and action/expression |
| **Best use cases** | All lesson design; neurodiverse profiles; accessibility baseline |
| **Limitations** | Not substitute for individualized accommodations when needed |
| **Evidence base** | CAST UDL Framework; reduces barriers at design time |
| **AcademyOS integration** | Playbook differentiation/accommodations; ULR `accommodation_considerations`; profile technology supports |

---

### 3.16 Differentiation

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Adjust content, process, or product based on learner readiness and profile |
| **Best use cases** | Mixed-mastery groups; LitLab complexity bands; RLM tier progression |
| **Limitations** | Teacher load; risk of lowered expectations |
| **Evidence base** | Tomlinson; effective when tied to evidence not assumptions |
| **AcademyOS integration** | Profile-driven Playbook variants; group placement by SIE; mastery level not grade level |

---

### 3.17 Scaffolding

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Provide temporary supports that fade as competence increases |
| **Best use cases** | New skills; EF-heavy tasks; writing frames; venture templates |
| **Limitations** | Permanent scaffolding prevents independence; fade timing critical |
| **Evidence base** | Vygotsky ZPD; Wood, Bruner & Ross |
| **AcademyOS integration** | Life Lab Y1–Y4 bands; Playbook EF supports; AI scaffold recommendations with fade rules |

---

### 3.18 Errorless Learning

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Minimize errors during initial acquisition through prompting and task shaping |
| **Best use cases** | Wilson initial encoding; high-anxiety learners; motor/language fragile acquisition |
| **Limitations** | Over-prompting delays independence; not for all learners |
| **Evidence base** | Applied behavior analysis; Wilson error correction protocols |
| **AcademyOS integration** | Wilson fidelity strand; `common_error_patterns` inform prevention; intervention micro-steps |

---

### 3.19 Small Group Instruction

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Target instruction to learners sharing skill band or need |
| **Best use cases** | Wilson groups (min 2); guided practice; intervention tiers |
| **Limitations** | Grouping errors; off-task behavior; pacing mismatch |
| **Evidence base** | Effective for literacy intervention; depends on homogeneity of need |
| **AcademyOS integration** | SIE group composition by skill band; Academy Way min class size rules; Wilson dosage |

---

### 3.20 1:1 Tutoring

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Individualized instruction at learner's edge of competence |
| **Best use cases** | Intensive intervention; Wilson 1:1 when required; writing conference |
| **Limitations** | Resource intensive; scalability |
| **Evidence base** | Bloom 2 Sigma; highest effect sizes in meta-analyses when quality high |
| **AcademyOS integration** | Tier 3 intervention; SIE tutor block scheduling; evidence capture per session |

---

### 3.21 Independent Practice

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Learner applies skill without immediate support to build fluency and autonomy |
| **Best use cases** | Post-guided practice; homework; portfolio work; venture build time |
| **Limitations** | Errors uncorrected become habit; requires prior successful guided practice |
| **Evidence base** | Part of gradual release; deliberate practice literature |
| **AcademyOS integration** | Playbook independent section; home practice (Doc 20); evidence self-submission where appropriate |

---

### 3.22 Collaborative Learning

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Learners construct understanding through structured peer interaction |
| **Best use cases** | LitLab seminars; Earthology inquiry; venture teams; peer feedback |
| **Limitations** | Free-for-all discussion ineffective; requires structures and roles |
| **Evidence base** | Johnson & Johnson; moderate effects when structured |
| **AcademyOS integration** | Playbook discussion; peer assessment methods (Doc 21); group evidence attribution |

---

### 3.23 Project-Based Learning (PBL)

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Extended inquiry producing authentic product addressing real question |
| **Best use cases** | Earthology apply lens; Venture Lab cycles; LitLab capstone; portfolio exhibitions |
| **Limitations** | Coverage risk; assessment complexity; uneven team contribution |
| **Evidence base** | Krajcik & Blumenfeld; positive for engagement and deeper learning when scaffolded |
| **AcademyOS integration** | ULR project competencies; performance tasks; multi-week SIE blocks; exhibition scheduling |

---

### 3.24 Inquiry

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Learner-driven questioning, investigation, and explanation |
| **Best use cases** | Earthology investigate lens; research strand; scientific method |
| **Limitations** | Ineffective without prior knowledge base; requires teacher facilitation |
| **Evidence base** | Inquiry-based science education; Hattie moderate effect with proper scaffolding |
| **AcademyOS integration** | Earthology lens architecture (Doc 16); Playbook prior knowledge checks; KEE inquiry evidence chain |

---

### 3.25 Experiential Learning

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Learn through direct experience and structured reflection |
| **Best use cases** | Life Lab simulations; RLM field tasks; job shadow; market days |
| **Limitations** | Logistics; safety; uneven reflection without protocol |
| **Evidence base** | Kolb cycle; Dewey; strong for transfer in applied domains |
| **AcademyOS integration** | RLM performance tasks; Life Lab evidence types; SIE field block scheduling |

---

### 3.26 AI-Assisted Learning

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Use AI to personalize practice, feedback drafts, and recommendations under human oversight |
| **Best use cases** | Spaced review generation; writing feedback drafts; venture market research; prompt engineering practice |
| **Limitations** | Hallucination; over-reliance; privacy; age-appropriate use; not mastery without evidence |
| **Evidence base** | Emerging; requires institutional validation via Research Framework (Doc 24) |
| **AcademyOS integration** | Decision Engine recommendations; AI literacy strand (Doc 17); ethics gate; human review required; profile AI preferences |

---

## 4. Instructional Model Selection Matrix

| Context | Primary Models | Secondary Models |
|---------|----------------|------------------|
| Wilson new skill | Explicit, Direct, Errorless, Gradual Release | Spaced, Retrieval |
| Wilson review | Retrieval, Spaced, Interleaving | Small Group |
| RLM new procedure | Worked Examples, Gradual Release, Explicit | Experiential |
| RLM mastery | Performance Task, Experiential | Interleaving |
| LitLab writing | Gradual Release, Feedback, Metacognition | Collaborative |
| Earthology inquiry | Inquiry, PBL, Collaborative | Dual Coding |
| Life Lab skill | Experiential, Scaffolding, Explicit | 1:1 if Tier 3 |
| Venture Lab | PBL, Agency, AI-Assisted | Collaborative, Feedback |

---

## 5. ULR Integration

| ULR Field | Instructional Framework Link |
|-----------|------------------------------|
| `instructional_strategies[]` | Model keys from §3 catalog |
| `intervention_strategies[]` | Document 20 — may reuse models at higher intensity |
| `executive_function_demands` | Informs scaffolding, session length, UDL |
| `estimated_instructional_minutes` | Derived from model mix + profile |
| `ai_recommendation_rules[]` | Model selection logic |

**Phase 4 rule:** Every atomic skill declares at least one primary instructional strategy.

---

## 6. Governance

| Rule | Requirement |
|------|-------------|
| **IFW-1** | No skill library without instructional strategy assignment |
| **IFW-2** | Wilson sessions use VI-F fidelity models — not generic discovery |
| **IFW-3** | AI-assisted learning never sole path to L3 mastery |
| **IFW-4** | Instructional model changes require registry version note |
| **IFW-5** | Research Framework validates model effectiveness over time |

---

*End of Document 18 — The Academy Way Instructional Framework™*
