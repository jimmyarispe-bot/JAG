# DOCUMENT 28 — Instructional Resource Standard™

**Project:** The Academy Way Learning System™ — Phase 4  
**Status:** Implementation Blueprint — Resource Authoring Standard Only  
**Integrates:** Document 18 Instructional Framework · Document 22 Playbook · Document 25 Competency Spec · Document 13 Wilson boundary

---

## 1. Charter

The **Instructional Resource Standard™ (IRS)** defines how **instructional resources** connect to competencies — lessons, practice, projects, media, AI tools, and experiences.

Resources are **linked objects** in the registry — not embedded curriculum silos in product modules.

**No resources are populated in this phase.** Authoring standards only.

---

## 2. Resource Architecture

```
InstructionalResourceCatalog
    └── InstructionalResource
            ├── target_competency_keys[]
            ├── target_skill_keys[]
            ├── resource_type
            └── metadata (§4)
```

Resources **reference** competencies (Doc 25) — competencies **reference** resources via `instructional_resource_refs[]`.

---

## 3. Supported Resource Types

Every resource type **shall** satisfy the universal schema (§4).

| Type Key | Description | Playbook Section Link |
|----------|-------------|----------------------|
| `lesson` | Full session plan | Doc 22 full schema |
| `mini_lesson` | Focused 10–20 min segment | Modeling + guided |
| `practice` | Deliberate practice set | Independent practice |
| `game` | Gamified practice | Independent / engagement |
| `project` | Multi-session PBL unit | Extended block |
| `book` | Text reference | Materials / prior knowledge |
| `video` | Instructional video | Modeling |
| `manipulative` | Physical/digital manipulative | Materials |
| `technology` | Software, app, platform | Materials |
| `ai_tool` | AI-assisted tool | AI recommendations |
| `community_experience` | Community-based learning | Field / experiential |
| `field_experience` | Field trip, outing | Experiential |
| `family_activity` | Home family extension | Family extension |
| `homework` | Independent home practice | Independent practice |
| `extension` | Enrichment beyond criteria | Differentiation extension |
| `intervention` | Tier 2–3 supplemental | Doc 20 |
| `acceleration` | Advanced pathway resource | Doc 20 acceleration |

---

## 4. Universal Resource Schema

Every instructional resource **shall** define:

### 4.1 Identity

| Field | Required | Description |
|-------|----------|-------------|
| `resource_key` | Yes | Immutable — `RES-{DOMAIN}-{TYPE}-{SEQ}` |
| `resource_type` | Yes | From §3 |
| `version` | Yes | semver |
| `status` | Yes | draft, in_review, published, deprecated |
| `title` | Yes | |
| `description` | Yes | |

### 4.2 Target Competencies

| Field | Required | Description |
|-------|----------|-------------|
| `target_competency_keys[]` | Yes | Min 1 |
| `target_skill_keys[]` | Conditional | Required for practice, mini_lesson |
| `coverage_type` | Yes | `primary`, `supplemental`, `remediation`, `enrichment` |
| `mastery_level_addressed` | Yes | Typically L1–L3 path |

### 4.3 Difficulty

| Field | Required | Description |
|-------|----------|-------------|
| `difficulty` | Yes | `foundational`, `developing`, `proficient`, `advanced` |
| `scaffold_level` | Yes | `full`, `partial`, `minimal`, `none` |
| `differentiation_band` | Yes | `approaching`, `on_level`, `extension` |

### 4.4 Estimated Time

| Field | Required | Description |
|-------|----------|-------------|
| `estimated_minutes` | Yes | Student-facing time |
| `prep_minutes_educator` | Yes | Preparation |
| `session_count` | Conditional | Projects — min 1 |

### 4.5 Materials

| Field | Required | Description |
|-------|----------|-------------|
| `materials_required[]` | Yes | May be empty array with note |
| `materials_optional[]` | Optional | |
| `technology_requirements[]` | Yes | Device, bandwidth, accounts |
| `cost_estimate` | Optional | For family transparency |

### 4.6 Accessibility

| Field | Required | Description |
|-------|----------|-------------|
| `accessibility_features[]` | Yes | Captions, alt text, TTS, etc. |
| `accessibility_review_status` | Yes | Doc 30 workflow |
| `udl_alignment[]` | Yes | Engagement, representation, action/expression |
| `ef_supports_included[]` | Yes | Checklists, chunking, etc. |

### 4.7 Localization

| Field | Required | Description |
|-------|----------|-------------|
| `source_locale` | Yes | Authoring language |
| `locale_overlay_keys[]` | Yes | Doc A — may be empty for global-neutral |
| `localization_required` | Yes | bool — RLM/Life Lab typically true |
| `cultural_neutrality_review` | Yes | passed / notes |
| `translated_versions[]` | Optional | locale + resource_key refs |

**Wilson resources:** WRS lesson content **not** stored — links to authorized Wilson materials outside registry; fidelity metadata only.

### 4.8 AI Usage

| Field | Required | Description |
|-------|----------|-------------|
| `ai_usage` | Yes | `none`, `optional_assist`, `required`, `prohibited` |
| `ai_tool_keys[]` | Conditional | If optional or required |
| `ai_age_policy_ref` | Conditional | Org + jurisdiction |
| `ai_disclosure_text` | Conditional | Student/family facing |
| `human_review_required` | Yes | For AI-generated content in resource |

---

## 5. Type-Specific Requirements

### 5.1 Lesson

| Required | Detail |
|----------|--------|
| `playbook_sections_complete` | All Doc 22 sections mapped |
| `instructional_model_keys[]` | Doc 18 |
| `evidence_plan_ref` | Doc 27 types |
| `cfu_items[]` | Doc 26 refs |

### 5.2 Mini Lesson

| Required | Detail |
|----------|--------|
| `focus_skill_keys[]` | Max 2 skills |
| `sections_subset[]` | Which Playbook sections |

### 5.3 Practice

| Required | Detail |
|----------|--------|
| `retrieval_type` | Optional — spaced, interleaved |
| `item_count` | |
| `answer_key_ref` | Secure — educator only |

### 5.4 Game

| Required | Detail |
|----------|--------|
| `learning_objective_alignment` | Not entertainment-only |
| `data_capture` | Evidence export to KEE |

### 5.5 Project

| Required | Detail |
|----------|--------|
| `milestone_schedule[]` | |
| `rubric_ref` | Doc 26 |
| `collaboration_rules` | Global teams — Doc D |

### 5.6 Book / Video

| Required | Detail |
|----------|--------|
| `isbn_or_url` | Citation |
| `competency_alignment_rationale` | |
| `lexile_or_complexity_band` | If literacy |

### 5.7 AI Tool

| Required | Detail |
|----------|--------|
| `ethics_checklist_ref` | Doc 17, Doc D |
| `data_privacy_note` | |
| `prohibited_uses[]` | |

### 5.8 Community / Field Experience

| Required | Detail |
|----------|--------|
| `safeguarding_checklist` | |
| `consent_requirements[]` | |
| `evidence_capture_protocol` | |

### 5.9 Family Activity

| Required | Detail |
|----------|--------|
| `parent_coaching_card` | Plain language |
| `time_minutes` | ≤ 30 default |
| `home_practice_capacity` | low / medium |

### 5.10 Intervention / Acceleration

| Required | Detail |
|----------|--------|
| `tier_level` | Doc 20 |
| `entry_criteria` | |
| `exit_criteria_link` | |

---

## 6. Resource–Competency Linking Rules

| Rule | Requirement |
|------|-------------|
| **Primary coverage** | Max 3 competencies per lesson |
| **Skill alignment** | Every practice item links ≥ 1 skill |
| **No orphan resources** | Published resources must link competencies |
| **Deprecate cascade** | Deprecating competency flags resources |
| **Wilson** | Resources cite external authorized materials — not reproduce |

---

## 7. Integration Matrix

| System | Role |
|--------|------|
| **Doc 25** | Competency `instructional_resource_refs[]` |
| **Doc 22** | Lesson structure |
| **Doc 18** | Instructional models |
| **Doc 20** | Intervention/acceleration types |
| **Doc 26–27** | Assessment and evidence in lessons |
| **Doc 29** | AI resource recommendations |
| **Doc 30** | Publish workflow |
| **Family Journey** | `family_activity` type |

---

## 8. Governance Rules

| Rule | Requirement |
|------|-------------|
| **IRS-1** | No published resource without target competencies |
| **IRS-2** | AI tools require ethics + age policy |
| **IRS-3** | Field experiences require safeguarding review |
| **IRS-4** | Wilson fidelity resources — expert review only |
| **IRS-5** | Localization review for RLM, Life Lab, Earthology |
| **IRS-6** | Deprecation retains link for historical evidence |

---

*End of Document 28 — Instructional Resource Standard™*
