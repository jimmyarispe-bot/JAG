# DOCUMENT 44 — Atomic Skill Authoring Guide™

**Project:** The Academy Way Learning System™ — Phase 4.1A  
**Status:** Implementation Blueprint — Skill Authoring Standard Only  
**Parent:** Document 43 · Document 25 · Document 12

---

## 1. Charter

The **Atomic Skill Authoring Guide™ (ASAG)** standardizes how **every Atomic Skill** is written — naming, behaviors, mastery criteria, metadata — ensuring ULR consistency across all domains.

**No atomic skills populated in this phase.**

---

## 2. Skill Authoring Principles

| Principle | Statement |
|-----------|-----------|
| **Smallest assessable unit** | One skill = one observable capability |
| **Competency-aligned** | Skill criteria ⊆ competency success criteria |
| **Immutable ID** | Published `skill_id` never changes |
| **Observable** | Mastery criteria describe performance — not internal states |
| **Metadata-complete** | AI, scheduling, evidence blocks required at publish |

---

## 3. Naming Standard

### 3.1 Skill ID

| Component | Pattern |
|-----------|---------|
| **Format** | `AW-{DOMAIN}-{SUBSTRAND}-{SEQ}` |
| **Example pattern** | `AW-SL-PA-001` |
| **SEQ** | Zero-padded 3 digits within sub-strand |
| **Immutable** | Yes — upon publish |

### 3.2 Display Title

| Rule | Requirement |
|------|-------------|
| **Length** | 3–12 words |
| **Verb-first** | Starts with observable verb — "Blend," "Segment," "Calculate," "Draft" |
| **Student-facing** | Plain language — no opaque codes |
| **Educator title** | Optional technical suffix in `title_educator` |
| **Localization** | Display title overridable via locale overlay — ID invariant |

### 3.3 Naming Anti-Patterns (Prohibited)

- "Understand X" without observable behavior  
- Grade level in title — "5th grade fractions"  
- Proprietary Wilson lesson numbers  
- Duplicate verbs across adjacent skills without distinction  

---

## 4. Descriptions

| Field | Standard |
|-------|----------|
| `description` | 1–3 sentences; what learner does when proficient |
| `description_student` | Optional shorter version for PAJ |
| `description_educator` | Optional precision for training |

**Template:** "The learner [verb] [object] [context/condition]."

---

## 5. Observable Behaviors

Each skill **shall** include `observable_behaviors[]` — min 2:

```
{
  behavior: string,           // What you see/hear
  context: string,            // Setting or materials
  frequency: string,          // e.g., "4 of 5 trials"
  proficient_signal: string,  // Clear success indicator
  not_yet_signal: string      // Clear gap indicator
}
```

**Alignment:** Must map to parent competency observable behaviors (Doc 25).

---

## 6. Mastery Criteria

| Field | Standard |
|-------|----------|
| `mastery_criteria` | Single primary statement — L3 threshold |
| `mastery_criteria_rubric_ref` | Optional link to Doc 26 instrument |
| `requires_educator_confirmation` | Default true for SL, Life Lab performance, venture pitch |
| `minimum_evidence_count` | Default 2 — override with justification |
| `evidence_type_keys[]` | Min 2 types — Doc 27 |
| `mastery_level_descriptors` | L1–L4 skill-specific — inherit scale Doc 6 |

**Quality rule:** Criteria must be **falsifiable** — observer can agree pass/fail.

---

## 7. Developmental Guidance

| Field | Purpose |
|-------|---------|
| `suggested_developmental_range` | Guidance only — `{ ageMin, ageMax }` |
| `developmental_notes` | Typical progression within skill |
| `scaffold_progression[]` | Full → partial → none scaffold stages |
| `common_timing_notes` | "Often 2–4 weeks at 3×/week" — estimate not gate |

**Rule:** Developmental guidance **never** blocks enrollment or placement.

---

## 8. Cross-Domain References

| Field | Standard |
|-------|----------|
| `prerequisites[]` | skill_id[] — hard L3 gates |
| `related_skills[]` | Soft links — interleaving, AI |
| `next_skills[]` | Typical sequence |
| `cross_domain_links[]` | Doc 46 schema |
| `concept_keys[]` | Domain knowledge map — min 1 |

Every cross-domain link includes `rationale` text.

---

## 9. AI Metadata

Per-skill block (extends Doc 47):

| Field | Required |
|-------|----------|
| `ai_coaching_rule_keys[]` | Yes — may be empty only if competency carries all rules |
| `ai_recommendation_notes` | Constraints for this skill |
| `ai_confidence_floor` | Min confidence to surface recommendation |
| `ai_human_review_required` | bool |
| `ai_prohibited_actions[]` | e.g., "auto_advance", "give_decode_answer" |

---

## 10. Scheduling Metadata

| Field | Required | Description |
|-------|----------|-------------|
| `estimated_instructional_minutes` | Yes | Typical to L3 |
| `session_type_preference` | Yes | whole_group, small_group, 1_1, independent |
| `min_group_size` | Conditional | SL: 2 |
| `max_group_size` | Optional | |
| `scheduling_considerations` | Yes | Object — duration, modality, frequency |
| `dosage_minutes_week` | Conditional | SL Wilson VI-F |
| `virtual_session_eligible` | Yes | bool |
| `field_experience_required` | Conditional | RLM, Life Lab |

---

## 11. Evidence Metadata

| Field | Required |
|-------|----------|
| `evidence_types[]` | Yes — Doc 27 keys |
| `primary_evidence_type` | Yes |
| `assessment_method_keys[]` | Yes — Doc 26 |
| `observation_indicators[]` | Yes for observed skills |
| `common_error_patterns[]` | Yes where applicable |
| `portfolio_eligible` | Yes |
| `transcript_eligible` | Yes |
| `kee_link_template` | Recommended — default capture schema |

---

## 12. Inheritance from Competency

| Competency Field | Skill Rule |
|------------------|------------|
| Domain/strand/sub-strand | Must match parent |
| EF demand | Skill ≤ competency unless flagged increase |
| Accommodations | Inherit + skill-specific additions |
| Graduation connections | Inherit — skill may refine |
| Instructional strategies | Skill declares primary subset |

---

## 13. Authoring Checklist

| # | Check |
|---|-------|
| 1 | skill_id follows namespace |
| 2 | Title verb-first, observable |
| 3 | Mastery criteria falsifiable |
| 4 | Min 2 observable behaviors |
| 5 | Min 2 evidence types |
| 6 | concept_keys[] assigned |
| 7 | AI metadata complete |
| 8 | Scheduling metadata complete |
| 9 | Prerequisites acyclic |
| 10 | Parent competency in `published` or same batch |

---

## 14. Governance

| Rule | Requirement |
|------|-------------|
| **ASAG-1** | Published skill_id immutable |
| **ASAG-2** | No skill without parent competency |
| **ASAG-3** | Mastery criteria changes = MAJOR version |
| **ASAG-4** | Cross-domain links follow Doc 46 |
| **ASAG-5** | SL skills require Wilson review on batch |

---

*End of Document 44 — Atomic Skill Authoring Guide™*
