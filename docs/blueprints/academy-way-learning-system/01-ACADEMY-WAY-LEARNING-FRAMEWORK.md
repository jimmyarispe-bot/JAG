# DOCUMENT 1 — The Academy Way Learning Framework™

**Project:** The Academy Way Learning System™  
**Status:** Implementation Blueprint — Instructional Architecture Only  
**Supersedes:** Grade-based instructional models as primary progress mechanism

---

## 1. Charter

The **Academy Way Learning Framework™** replaces traditional grade-based instructional models with **evidence-based Personal Academic Journeys™ (PAJ)**.

Progress is measured by **mastery and evidence**, not seat time, grade level, or age. Each student progresses independently across **Learning Domains** at rates determined by demonstrated competency.

AcademyOS implements this framework through Learning Intelligence™, the Learning Registry, Knowledge & Evidence Engine™, and Scheduling Intelligence™ — not through a separate gradebook paradigm.

---

## 2. Constitutional Principles

| # | Principle |
|---|-----------|
| **TAW-1** | Time does not determine mastery — evidence determines mastery |
| **TAW-2** | Diagnoses are evidence, never journey identity |
| **TAW-3** | Every student has one PAJ composed of domain-specific pathways |
| **TAW-4** | Placement is evidence-based and reversible |
| **TAW-5** | AI recommends; educators and families decide |
| **TAW-6** | All learning evidence flows to KEE |
| **TAW-7** | Wilson Reading System remains exclusive structured literacy curriculum (Part VI-F) |

---

## 3. Personal Academic Journeys™ (PAJ)

### 3.1 Definition

A **Personal Academic Journey™** is the canonical record of a student's learning progress across all enrolled **Learning Domains** — independent of grade band for mastery purposes.

### 3.2 PAJ Components

| Component | Description |
|-----------|-------------|
| **Journey ID** | Stable identifier linked to student |
| **Enrollment context** | Program, campus, virtual/HS track |
| **Domain enrollments[]** | Active domains with placement and pathway |
| **Cross-domain profile** | Whole-child supports (SSIS), not identity |
| **Journey status** | `active`, `paused`, `completed`, `transitioning` |
| **Created / updated** | Audit timestamps |

### 3.3 PAJ vs Grade Level

| Traditional Model | Academy Way Model |
|-------------------|-------------------|
| Grade determines curriculum | **Placement + pathway** determine curriculum |
| Same pace for all | **Independent rates per domain** |
| Report card grades | **Mastery levels + evidence portfolio** |
| Promotion by age/year | **Advancement by competency** |

Grade level may remain as **organizational metadata** (cohort, reporting) but **never** as the primary mastery gate.

---

## 4. Learning Journey Placement™

### 4.1 Purpose

**Learning Journey Placement™** assigns each student to the correct starting point within each domain pathway using evidence — not age, grade, or label.

### 4.2 Placement Workflow

```
Universal screening (where applicable)
  → Domain-specific placement assessment
  → Baseline evidence collection
  → Recommended placement (pathway + strand + competency band)
  → Human review (teacher / specialist)
  → Journey Creation
  → Scheduling assignment
```

### 4.3 Placement Record

| Field | Description |
|-------|-------------|
| `placement_id` | UUID |
| `student_id` | Student |
| `domain_key` | Learning domain |
| `pathway_key` | Selected pathway |
| `recommended_level` | Registry mastery band |
| `placed_level` | Human-confirmed level |
| `placement_evidence_refs[]` | KEE evidence IDs |
| `placed_by` | Reviewer |
| `review_date` | Date |
| `reassessment_due` | Optional |

### 4.4 Wilson / Structured Literacy Placement

Aligns with **Part VI-F.13** Wilson Screening & Placement Framework — Step/Substep maps to registry competency bands without storing proprietary Wilson content.

---

## 5. Learning Pathways

### 5.1 Definition

A **Learning Pathway** is a sequenced progression through strands and competencies within a domain — not a fixed calendar course.

### 5.2 Pathway Types

| Type | Description |
|------|-------------|
| **Foundations** | Entry pathway for new or remedial placement |
| **Core** | Standard domain progression |
| **Accelerated** | Advanced placement with prerequisites met |
| **Intervention** | Targeted pathway linked to MTSS tier |
| **Transition** | HS/college/career bridge (Life Lab, Venture Lab) |

### 5.3 Pathway Rules

- Students may be on **different pathways per domain** simultaneously  
- Pathway changes require evidence + human approval  
- Prerequisites enforced via Learning Registry graph  

---

## 6. Learning Domains

### 6.1 Domain Catalog

| Track | Domain Key | Display Name |
|-------|------------|--------------|
| **Academy Virtual** | `domain.structured_literacy` | Structured Literacy (Wilson) |
| **Academy Virtual** | `domain.real_life_math` | Real-Life Math |
| **Academy Virtual** | `domain.litlab` | LitLab |
| **Academy Virtual** | `domain.earthology` | Earthology |
| **Academy High School** | `domain.life_lab` | Life Lab™ |
| **Academy High School** | `domain.ai_venture_lab` | AI Venture Lab™ |

### 6.2 Domain Structure (Universal)

Every domain implements:

```
Domain → Strands → Competencies → Atomic Skills
```

See **Document 2** for full registry design per domain.

---

## 7. Learning Cycles

### 7.1 Definition

**Learning Cycles** replace traditional quarters/semesters as the **instructional rhythm** — not the mastery gate.

| Attribute | Description |
|-----------|-------------|
| **Duration** | Configurable (e.g., 6–10 weeks) |
| **Purpose** | Pacing, scheduling, reflection, portfolio review |
| **Mastery** | Independent of cycle boundaries |

### 7.2 Cycle Activities

- Instruction blocks scheduled per cycle  
- Evidence collection continuous (not cycle-bound)  
- Cycle-end: portfolio review, AI summary, parent conference optional  
- Cycle boundary does **not** force advancement or retention  

### 7.3 Cycle vs Calendar

| Element | Role |
|---------|------|
| **School calendar** | Operations, attendance, funding |
| **Learning Cycle** | Instructional organization and reflection |
| **Mastery** | Evidence-driven; may span multiple cycles |

---

## 8. Mastery Model

See **Document 6** for full philosophy. Summary:

| Level | Name | Criteria |
|-------|------|----------|
| 0 | **Not Started** | No evidence |
| 1 | **Emerging** | Initial evidence; inconsistent |
| 2 | **Developing** | Multiple evidence points; partial criteria |
| 3 | **Proficient** | Success criteria met |
| 4 | **Advanced** | Exceeds criteria; transfer demonstrated |

**Advancement rule:** Proficient (Level 3) on all required atomic skills for a competency → competency mastered → pathway progression unlocked.

---

## 9. Competency Framework

### 9.1 Hierarchy

```
Learning Domain
  └── Strand ( thematic group )
        └── Competency ( measurable outcome )
              └── Atomic Skill ( smallest assessable unit )
```

### 9.2 Competency Record (per student)

| Field | Description |
|-------|-------------|
| `competency_key` | Registry key |
| `current_mastery_level` | 0–4 |
| `evidence_count` | Supporting evidence items |
| `last_evidence_at` | Most recent |
| `mastered_at` | When Level 3 achieved |
| `ai_recommendation_id` | Optional next step |

### 9.3 Cross-Domain Competencies

Life Lab and Venture Lab include **cross-cutting competencies** (Executive Function, Communication) that link to related skills in other domains via registry `related_skills` edges.

---

## 10. Evidence Collection

### 10.1 Evidence Types (Domain-Agnostic)

| Type | Examples |
|------|----------|
| `observation.instructional` | Teacher observation |
| `measurement.assessment` | Placement, probe, benchmark |
| `artifact.product` | Project, portfolio piece |
| `measurement.progress` | CBM, mastery check |
| `interaction.self_reflection` | Student reflection |
| `interaction.parent` | Home activity log |

### 10.2 Evidence Flow

```
Instruction / Assessment / Home Activity
  → Evidence Capture (instructor, system, parent)
  → Canonical Evidence Record (KEE Part VIII)
  → Competency / Skill linkage (skill_keys[])
  → Mastery recalculation
  → KEE + Intelligence Graph update
```

### 10.3 Evidence Requirements for Mastery

Each atomic skill defines `success_criteria` and minimum `evidence_types[]` — configurable per domain in registry.

---

## 11. AI Recommendation Model

### 11.1 Purpose

AI assists placement, pacing, intervention, and next-skill recommendations — **never** auto-advances mastery without human approval.

### 11.2 Recommendation Types

| Type | Trigger | Consumer |
|------|---------|----------|
| **Next skill** | Competency near mastery | Teacher |
| **Intervention** | Stagnation or regression | MTSS team |
| **Pathway adjustment** | Evidence pattern | Administrator |
| **Home activity** | Parent portal | Family |
| **Schedule adjustment** | Readiness + SIE | Scheduler |

### 11.3 AI Architecture (Blueprint)

```
Evidence (KEE) + Learning Registry + Learning Profile (VI-A)
  → Platform Decision Engine
  → Recommendation record (explainability required)
  → Human review → accept / modify / reject
  → Activity + Event + KEE lineage
```

**Roadmap gate:** Production AI recommendations require Wave 1 (KEE) + Wave 6 (validated research optional boost).

### 11.4 Explainability Requirements

Every recommendation includes: why, evidence refs, expected benefit, trade-offs, confidence, alternatives (Part VII-E §10, Part VIII §10).

---

## 12. Student Success Profile Integration

### 12.1 Profile Section: `learning_journey`

New Student Profile section (Part VI):

| Sub-section | Content |
|-------------|---------|
| **PAJ Overview** | Active domains, overall journey status |
| **Domain Progress** | Mastery summary per domain |
| **Recent Evidence** | Timeline from KEE |
| **Placements** | Current placement per domain |
| **Supports** | MTSS, IEP, 504 — operational links |
| **AI Recommendations** | Pending educator review |

### 12.2 Success Score Integration

Student Success Score (Part VI) may include **Learning Journey Progress** as configurable weight — org-defined, evidence-based.

---

## 13. Knowledge & Evidence Engine Integration

| KEE Capability | Academy Way Use |
|----------------|-----------------|
| Evidence Capture | All instructional evidence |
| Canonical Records | Skill-linked evidence |
| Synthesis | Competency progress narratives |
| Discovery | Domain effectiveness research (ARI Wave 6.5) |
| Lineage | AI recommendation audit |

**Registry key:** `evidence.source.learning_journey.*` per domain.

---

## 14. Scheduling Intelligence Integration

| Integration Point | Description |
|-------------------|-------------|
| **Domain scheduling** | Virtual subjects map to domains (extends `academy-way.ts`) |
| **Dosage** | Wilson sessions/week per VI-F.15 |
| **Readiness** | Learning Readiness Intelligence (VII-E §16.3) |
| **Group placement** | WRS group size, math cohort rules |
| **Whole-child** | WCSS includes domain service needs |

Scheduling assigns **time**; PAJ assigns **content progression**. SIE optimizes schedule; PAJ defines what is taught when mastery allows advancement.

---

## 15. Parent Portal Experience

### 15.1 Surfaces

| Surface | Content |
|---------|---------|
| **Journey Overview** | Plain-language domain progress |
| **Mastery visualization** | Skill-based, not grades |
| **Home activities** | Registry `parent_activities[]` |
| **Evidence highlights** | Recent artifacts and growth |
| **Teacher messages** | Domain-specific |
| **Wilson home practice** | VI-F.16 integration |

### 15.2 Design Principles

- Plain language — no diagnostic labels as headlines  
- Celebrate growth and effort  
- Home activities optional but encouraged  
- AI suggestions labeled as suggestions  

---

## 16. Teacher Experience

### 16.1 Surfaces

| Surface | Content |
|---------|---------|
| **Teacher Workspace → Student Journey** | PAJ for assigned students |
| **Domain dashboard** | Class/cohort mastery heatmap |
| **Evidence capture** | Quick observation, artifact upload |
| **Mastery review** | Approve/advance/reteach |
| **AI recommendations panel** | Accept/reject with reason |
| **Wilson session** | Fidelity + skill evidence (VI-F) |

### 16.2 Workflows

- Record evidence → linked to atomic skills  
- Review AI next-skill recommendation  
- Request placement reassessment  
- Flag intervention need → MTSS workflow  

---

## 17. Administrator Experience

### 17.1 Surfaces

| Surface | Content |
|---------|---------|
| **Domain registry admin** | Configuration Studio (strands, thresholds) |
| **Cohort analytics** | Domain mastery distributions |
| **Placement audit** | Placement decisions + evidence |
| **Intervention pipeline** | MTSS + domain stagnation alerts |
| **Executive summary** | MOS/SQS + learning outcome trends |

### 17.2 Governance

- Registry changes versioned  
- Mastery threshold changes require approval  
- Cross-domain prerequisite changes impact analysis  

---

## 18. Platform Service Map

| Service | Role |
|---------|------|
| **Profile Registry** | PAJ section on Student Profile |
| **Registry Framework** | Learning Registry host |
| **Event Engine** | Journey events |
| **Activity Engine** | Evidence actions audit |
| **Workflow Engine** | Placement, intervention, mastery approval |
| **Decision Engine** | AI recommendations |
| **Automation Engine** | Reassessment reminders, stagnation alerts |
| **Intelligence Graph** | Skill prerequisites, related skills |
| **KEE** | All evidence |
| **Scheduling Intelligence** | Time optimization |

---

## 19. Event Catalog (Blueprint)

| Event | Trigger |
|-------|---------|
| `learning.journey.created` | PAJ initialized |
| `learning.placement.completed` | Domain placement confirmed |
| `learning.evidence.recorded` | Evidence linked to skill |
| `learning.mastery.updated` | Mastery level change |
| `learning.competency.mastered` | Level 3 achieved |
| `learning.pathway.advanced` | Pathway progression |
| `learning.recommendation.created` | AI recommendation |
| `learning.recommendation.decided` | Human action |
| `learning.cycle.started` / `ended` | Cycle boundaries |

---

*End of Document 1 — The Academy Way Learning Framework™*
