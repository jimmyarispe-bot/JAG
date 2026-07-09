# DOCUMENT 47 — AI Metadata Standard™

**Project:** The Academy Way Learning System™ — Phase 4.1A  
**Status:** Implementation Blueprint — AI Metadata Authoring Standard Only  
**Integrates:** Document 29 · Document 41 · Document 43 · Decision Engine

---

## 1. Charter

The **AI Metadata Standard™ (AIMS)** defines **required AI metadata on every competency and atomic skill** — recommendation rules, confidence thresholds, explainability, human review triggers, and operational preferences.

**AI metadata is authored with the competency — not generated post-hoc.**

---

## 2. Mandatory AI Metadata Block

Every competency **shall** include `ai_metadata` object. Skills include skill-level block or inherit with overrides.

```
ai_metadata
    ├── recommendation_rules[]
    ├── confidence_thresholds
    ├── explainability_fields
    ├── human_review_triggers[]
    ├── suggested_interventions[]
    ├── scheduling_preferences
    ├── grouping_preferences
    ├── parent_coaching_rules[]
    ├── ai_usage_constraints
    └── version
```

---

## 3. Recommendation Rules

| Field | Required | Description |
|-------|----------|-------------|
| `ai_coaching_rule_keys[]` | Yes | Registered Decision Engine keys |
| `rule_priority` | Yes | Order when multiple fire |
| `rule_conditions[]` | Yes | Conceptual triggers — mastery band, error pattern, risk |
| `rule_outputs[]` | Yes | Strategy, resource, assessment, intervention |
| `domain_coach_role` | Yes | Doc 29 / Doc 41 role |
| `wilson_certified_only` | SL | bool — Step/band recommendations |

**Namespace:** `{domain}.aic.{category}.{action}` — e.g., `sl.aic.intervention.concept`

**Minimum:** 1 rule per competency; 3+ for Tier-1 graduation competencies.

---

## 4. Confidence Thresholds

| Field | Default | Description |
|-------|---------|-------------|
| `recommendation_surface_min` | 0.60 | Below — on-demand only |
| `recommendation_prominent_min` | 0.80 | Above — proactive surface |
| `mastery_suggestion_min` | 0.75 | AI may suggest validation ready |
| `intervention_tier2_min` | 0.65 | Tier 2 suggestion threshold |
| `parent_coach_min` | 0.70 | Parent-facing recommendations |
| `auto_action_ceiling` | 0.00 | **No auto-actions** — always 0 for mastery/tier |

Skill-level overrides permitted with justification.

---

## 5. Explainability Fields

Every rule **shall** define:

| Field | Purpose |
|-------|---------|
| `summary_template` | Plain-language pattern with placeholders |
| `cite_concepts` | bool — include concept_keys |
| `cite_evidence` | bool — include evidence_ids |
| `cite_graph_path` | bool — prerequisite walk |
| `role_variants[]` | teacher, parent, student text |
| `unknown_data_disclosure` | Template when profile incomplete |

Stored in rule registry — competency references rule keys.

---

## 6. Human Review Triggers

| Trigger Key | Condition | Required Reviewer |
|-------------|-----------|-------------------|
| `hr.mastery_validation` | AI suggests L3 ready | Educator |
| `hr.tier2_intervention` | Tier 2 plan proposed | Educator |
| `hr.tier3_intervention` | Tier 3 proposed | Specialist |
| `hr.step_band_advance` | SL Step band | Wilson certified |
| `hr.accommodation_change` | New accommodation suggested | Team |
| `hr.acceleration` | Acceleration path proposed | Educator |
| `hr.cross_domain_unlock` | Cross-domain advance | Educator |
| `hr.ai_evidence` | AI-scored evidence | Educator |
| `hr.parent_escalation` | Parent coach struggle flag | Teacher |

Competency declares which triggers apply via `human_review_triggers[]`.

---

## 7. Suggested Interventions

| Field | Description |
|-------|-------------|
| `intervention_strategy_keys[]` | Doc 20 refs |
| `error_pattern_map[]` | `{ errorPattern, interventionKey }` |
| `concept_fallback_key` | Doc 38/39 re-teach target |
| `dosage_adjustment_hint` | increase / maintain / spacing |
| `micro_intervention_keys[]` | Doc 20 micro types |

Linked to `common_error_patterns[]` on competency (Doc 25).

---

## 8. Scheduling Preferences

```
scheduling_preferences
    ├── preferred_session_types[]
    ├── min_duration_minutes
    ├── max_duration_minutes
    ├── optimal_frequency_per_week
    ├── spacing_days_review
    ├── time_of_day_notes          (profile-aware — not prescriptive)
    ├── virtual_eligible
    ├── requires_certified_teacher (SL)
    └── whole_child_weight         (EF load — SIE input)
```

---

## 9. Grouping Preferences

```
grouping_preferences
    ├── default_group_type           (solo, pair, small_group)
    ├── min_group_size
    ├── max_group_size
    ├── homogeneity                  (skill_band, mixed)
    ├── wilson_min_2                 (SL bool)
    └── pairing_rules[]              (mentor, similar level)
```

---

## 10. Parent Coaching Rules

| Field | Description |
|-------|-------------|
| `parent_activity_keys[]` | Doc 42 / resource refs |
| `parent_coach_rule_keys[]` | `sl.aic.parent.*` |
| `home_evidence_types[]` | Doc 27 — parent-sourced |
| `capacity_band_max` | low / medium / high activity |
| `plain_language_summary` | Family-facing focus |
| `escalation_to_teacher_triggers[]` | Struggle patterns |

**Rule:** Parent rules never recommend Wilson instruction delivery.

---

## 11. AI Usage Constraints

| Field | Description |
|-------|-------------|
| `ai_student_coach_allowed` | bool |
| `ai_assessment_assist_allowed` | bool — human validate |
| `ai_answer_withholding` | Required for decoding assessments |
| `jurisdiction_ai_policy_ref` | Doc D compliance |
| `prohibited_ai_actions[]` | Explicit block list |

---

## 12. Inheritance: Competency → Skill

| Field | Inheritance |
|-------|-------------|
| Recommendation rules | Skill adds specific; inherits general |
| Confidence thresholds | Skill may tighten — not loosen without approval |
| Human review triggers | Inherit all competency triggers |
| Scheduling/grouping | Skill overrides with narrower scope |
| Parent rules | Skill-specific activities |

---

## 13. Authoring Checklist

| # | Check |
|---|-------|
| 1 | ai_coaching_rule_keys registered |
| 2 | Confidence thresholds explicit |
| 3 | All high-stakes triggers mapped |
| 4 | Explainability templates exist for each rule |
| 5 | No auto_action above 0 |
| 6 | Parent rules capacity-aware |
| 7 | SL step rules wilson_certified_only |
| 8 | AI review passed — Doc 48 |

---

## 14. Governance

| Rule | Requirement |
|------|-------------|
| **AIMS-1** | No published competency without ai_metadata block |
| **AIMS-2** | Rule keys semver-versioned |
| **AIMS-3** | auto_action_ceiling = 0 platform-wide for mastery |
| **AIMS-4** | Explainability mandatory — no black-box rules |
| **AIMS-5** | AI review required before publish |

---

*End of Document 47 — AI Metadata Standard™*
