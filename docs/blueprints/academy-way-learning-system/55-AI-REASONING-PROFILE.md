# DOCUMENT 55 — AI Reasoning Profile™

**Project:** The Academy Way Learning System™ — Phase 4.2A  
**Status:** Concept Library Enhancement Standard — Mandatory Section for All Concept Libraries  
**Integrates:** Document 47 · Document 55 · Docs 29, 41 · Decision Engine

---

## 1. Charter

The **AI Reasoning Profile™ (AIRP)** defines **how AcademyOS reasons about each concept** — mastery signals, struggle signals, confidence factors, and triggers for scheduling, intervention, family coaching, portfolio, and transcript.

**AI recommends; humans decide; evidence confirms.**

Every Concept Library **shall** include a complete AIRP section — the concept-level input to AI Instructional Coach (Docs 29, 41).

---

## 2. Universal AIRP Schema

```
ai_reasoning_profile
    ├── indicators_of_mastery[]
    ├── indicators_of_struggle[]
    ├── confidence_factors
    ├── scheduling_implications
    ├── intervention_triggers[]
    ├── family_coaching_triggers[]
    ├── portfolio_relevance
    ├── transcript_relevance
    └── rule_key_registry[]
```

---

## 3. Indicators of Mastery

| Field | Format |
|-------|--------|
| **Indicator** | Observable signal name |
| **Evidence types** | Doc 27 keys |
| **Threshold** | Quantified where possible (e.g., 4/5 trials) |
| **Confidence weight** | 0–1 contribution |
| **Human validation** | Required bool for L3 |

**Minimum:** 4 mastery indicators per concept.

**Examples (pattern):**
- Probe score at threshold × consecutive sessions
- Observation checklist pass
- Retention probe pass at spacing interval
- Generalization task pass (if applicable)

---

## 4. Indicators of Struggle

| Field | Format |
|-------|--------|
| **Indicator** | Observable signal |
| **Severity** | amber / red |
| **Typical cause** | Link to error pattern or prerequisite gap |
| **Suggested AI action** | recommend_only — never auto-tier-3 |

**Minimum:** 4 struggle indicators.

**Examples:**
- Flat probe trend 3 sessions
- Error pattern frequency spike
- Session abandonment / EF shutdown
- Prerequisite probe fail

---

## 5. Confidence Factors

```
confidence_factors
    ├── increase_confidence[]     (dense evidence, calibrated rater, etc.)
    ├── decrease_confidence[]     (AI-only, stale evidence, low profile completeness)
    ├── floor_for_recommendation
    ├── floor_for_mastery_suggestion
    └── ceiling_without_human     (always ≤ 0.70 for mastery)
```

Cross-reference Doc 47 thresholds — concept-level overrides documented here.

---

## 6. Scheduling Implications (AI)

| Trigger | AI Scheduling Output |
|---------|---------------------|
| Mastery approaching | Suggest next concept session |
| Dosage deficit | Suggest recovery block |
| Spacing due | Suggest review session |
| EF profile high | Suggest break insertion |
| Group imbalanced | Suggest regroup |

**Rule keys (pattern):** `{domain}.aic.schedule.{concept}`

---

## 7. Intervention Triggers

| Trigger Condition | AI Output | Human Gate |
|-------------------|-----------|------------|
| Struggle indicator red × 2 | Tier 2 suggestion | Educator |
| Prerequisite gap detected | Remediation concept | Educator |
| Error pattern match | Micro-intervention | Educator |
| Dosage + stall | Intensive review suggestion | Team |

Link to Doc 20 tiers and Doc 54 warning signs.

---

## 8. Family Coaching Triggers

| Trigger | Parent Coach Output |
|---------|---------------------|
| Home practice assigned | Activity card |
| Celebration eligible | Milestone message draft |
| Struggle at home | Escalate to teacher — not new instruction |
| Capacity low on profile | Shorter activity suggestion |

**Locale:** Family communication language (Doc A).

---

## 9. Portfolio Relevance

| Field | Values |
|-------|--------|
| **portfolio_eligible_concept** | bool |
| **artifact_types[]** | audio, video, reflection, etc. |
| **quality_threshold** | Min quality score for inclusion |
| **typical_timing** | After L3, cycle end, exhibition |

Foundational concepts may be `false` — document rationale.

---

## 10. Transcript Relevance

| Field | Values |
|-------|--------|
| **transcript_eligible_concept** | bool |
| **readiness_domain_refs[]** | Doc 7 |
| **narrative_snippet_template** | Plain-language for transcript reader |
| **external_visibility** | internal_only / external_summary |

---

## 11. Rule Key Registry

Each AIRP **shall** list concept-specific rule keys:

```
rule_key_registry[]
    ├── rule_key
    ├── coach_role
    ├── trigger_summary
    └── human_review_required
```

Minimum 5 rule keys per concept library.

---

## 12. Explainability Requirements

Every rule in AIRP **must** define:

- Plain-language summary template  
- Concepts cited  
- Evidence cited  
- Alternative action when confidence low  

Doc 56 AI explainability review validates.

---

## 13. Governance

| Rule | Requirement |
|------|-------------|
| **AIRP-1** | No auto-mastery in rule registry |
| **AIRP-2** | Struggle triggers never block learner access |
| **AIRP-3** | Family triggers never diagnose |
| **AIRP-4** | AI explainability review mandatory (Doc 56) |

---

*End of Document 55 — AI Reasoning Profile™*
