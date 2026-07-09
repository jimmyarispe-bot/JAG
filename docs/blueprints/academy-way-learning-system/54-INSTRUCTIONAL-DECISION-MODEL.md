# DOCUMENT 54 — Instructional Decision Model™

**Project:** The Academy Way Learning System™ — Phase 4.2A  
**Status:** Concept Library Enhancement Standard — Mandatory Section for All Concept Libraries  
**Applies to:** Document 51 (revised) · Docs 18, 22, 29, 41 · Scheduling Intelligence

---

## 1. Charter

The **Instructional Decision Model™ (IDM)** defines **when and how to teach each concept** — readiness, warnings, pacing, grouping, and advancement gates — for educators, SIE, and AI Coach.

**Decisions are evidence-based** — not calendar-based (Doc 6).

---

## 2. Universal IDM Schema

```
instructional_decision_model
    ├── when_to_teach
    ├── when_not_to_teach
    ├── readiness_indicators[]
    ├── warning_signs[]
    ├── pacing_recommendations
    ├── grouping_recommendations
    ├── independent_practice_readiness
    ├── generalization_readiness
    ├── advancement_readiness
    └── decision_engine_rule_refs[]
```

---

## 3. Field Definitions

### 3.1 When to Teach

| Element | Content |
|---------|---------|
| **Prerequisite concepts** | concept_keys at L3 or equivalent |
| **Profile readiness** | Minimum language exposure; EF floor |
| **Context signals** | Enrollment, placement, screen fail |
| **Concurrent teaching** | What can run in parallel |
| **Wilson alignment** | Metadata — WRS block context (SL only) |

**Format:** Bulleted conditions — all should be true unless OR-group specified.

### 3.2 When NOT to Teach

| Element | Content |
|---------|---------|
| **Blocked by gaps** | Missing prerequisites |
| **Harm conditions** | e.g., teach decoding before PA stable → guessing |
| **Capacity overload** | EF/attention breakdown — pause not punish |
| **Developmentally premature** | Rare — prefer explicit instruction over wait (SL) |
| **Concurrent conflicts** | e.g., intensive PM and intro decoding same week |

**Rule:** "When not to teach" ≠ "never teach struggling learner" — means **fix prerequisite first**.

### 3.3 Readiness Indicators

Observable **green lights** — min 3:

| Indicator | Evidence Source |
|-----------|---------------|
| Prerequisite probe pass | Assessment |
| Engagement stable | Analytics |
| Profile supports modality | Learning Profile |
| Teacher observation | Look-fors |

### 3.4 Warning Signs

Observable **amber/red flags** — min 3:

| Warning | Response |
|---------|----------|
| Error pattern spike | Micro-intervention |
| Dosage missed | Schedule recovery |
| Frustration/shutdown | EF break; reduce load |
| Plateau 3+ probes | Tier review |
| Guessing behavior (downstream) | Return to PA/PM |

### 3.5 Pacing Recommendations

```
pacing_recommendations
    ├── minutes_per_session
    ├── sessions_per_week
    ├── weeks_to_proficiency_typical      (range — not guarantee)
    ├── review_ratio                      (new : review — e.g., 70:30)
    ├── spacing_interval_days[]
    └── acceleration_pace_modifier        (if transfer demonstrated)
```

### 3.6 Grouping Recommendations

| Parameter | Options |
|-----------|---------|
| **Default group type** | pair, small_group, whole_group, 1_1 |
| **Homogeneity** | skill_band, mixed |
| **Min/max size** | domain rules (SL min 2) |
| **1:1 triggers** | Tier 3, EF overload, extreme gap |

### 3.7 Independent Practice Readiness

| Field | Define |
|-------|--------|
| **Criteria** | What L3 behaviors enable solo practice |
| **Scaffold fade** | What supports removed |
| **Home practice OK** | bool + parent activity refs |
| **Not ready signals** | Requires teacher presence |

### 3.8 Generalization Readiness

| Field | Define |
|-------|--------|
| **Criteria** | L3 in controlled context + N varied contexts |
| **Evidence** | Transfer task types |
| **Blocked until** | Proficiency on core skill |

### 3.9 Advancement Readiness

| Field | Define |
|-------|--------|
| **Next concept_key** | Primary successor |
| **Criteria** | L3 + bundle confidence + educator confirmation |
| **Acceleration path** | Doc 45 — optional |
| **Hard gates** | Prerequisites on graph (Doc 39) |

---

## 4. Decision Engine Integration

Each IDM exports `decision_engine_rule_refs[]` linking to:

- Scheduling Coach (Doc 41)
- Intervention Coach
- Assessment Coach

---

## 5. Governance

| Rule | Requirement |
|------|-------------|
| **IDM-1** | When NOT to teach must include remediation path |
| **IDM-2** | Readiness indicators observable — not age alone |
| **IDM-3** | Teacher usability review (Doc 56) |
| **IDM-4** | Pacing ranges — never single fixed timeline |

---

*End of Document 54 — Instructional Decision Model™*
