# DOCUMENT 104 — The JAG™ Executive Dashboard Metrics™

**Foundational Phonological Awareness**  
**Metrics Package Key:** `metrics.rlp.sl.pa.v1.0.0`  
**Competency Library:** Document 98  
**Analytics Framework:** Document 23  
**Version:** 1.0.0  
**Status:** Reference Implementation — Metric Definitions Only  
**Audience:** Teachers, instructional leaders, network executives, research partners

---

## 1. Charter

This document defines **every executive-relevant metric** for the Foundational Phonological Awareness Reference Learning Package — conceptual definitions, inputs, consumers, and guardrails.

**Principles (Document 23):**

- Metrics inform decisions — they do not declare mastery alone (Document 6)  
- All metrics derive from KEE evidence, PAJ state, scheduling, and profile — not parallel silos  
- Confidence pairs with predictions  
- Aggregates for research are anonymized (Document 24)

**No implementation.** AcademyOS consumes these definitions at runtime.

---

## 2. Metric Architecture

```
ExecutiveDashboardMetrics — PA Package
    ├── student_metrics[]
    ├── teacher_metrics[]
    ├── school_metrics[]
    ├── network_metrics[]
    ├── longitudinal_metrics[]
    ├── research_metrics[]
    └── ai_confidence_metrics[]
```

**Registry namespace:** `metrics.sl.pa.*`

---

## 3. Student Metrics

### 3.1 Placement & Progress

| Metric Key | Definition | Calculation (Conceptual) | Unit | Consumer |
|------------|------------|--------------------------|------|----------|
| `metrics.sl.pa.current_competency` | Active PA competency on PAJ | `PAJ.active_competency_key` where library = Doc 98 | competency_key | Teacher, Parent |
| `metrics.sl.pa.competency_level` | Mastery level on current competency | PAJ level 0–4 | level | Teacher, PAJ |
| `metrics.sl.pa.competencies_l3_count` | Count of Doc 98 competencies at L3 | `count(competency_key WHERE level >= 3)` | count / 24 | Teacher, GRE |
| `metrics.sl.pa.pathway_completion_pct` | Progress through PA library | `competencies_l3_count / 24 * 100` | % | Parent, Leader |
| `metrics.sl.pa.group_stage` | Current competency group (1–8) | Map competency to group | ordinal | Teacher |
| `metrics.sl.pa.handoff_ready` | PA-024 L3 candidacy | Boolean — all PA-024 criteria | bool | Teacher, AIC |

### 3.2 Velocity & Growth

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.learning_velocity` | Rate of competencies reaching L2+ | Doc 23 §3.1 applied to PA competencies | comp/week | Teacher, Leader |
| `metrics.sl.pa.mastery_velocity` | Rate of competencies reaching L3 | Doc 23 §3.2 applied to PA competencies | comp/week | GRE, Leader |
| `metrics.sl.pa.probe_growth_rate` | Change on weekly PA probe | `(current_probe - prior_probe) / weeks` | points/week | Intervention |
| `metrics.sl.pa.weeks_on_stage` | Duration on current competency | Days since stage entry / 7 | weeks | Coach, AIC |
| `metrics.sl.pa.retention_pass_rate` | 2-week retention probe pass | Pass/fail on spaced probe | bool | Assessment |

### 3.3 Engagement & Dosage

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.session_attendance_rate` | PA sessions attended / scheduled | SIE attendance records | % | Leader |
| `metrics.sl.pa.weekly_pa_minutes` | PA instructional minutes per week | Sum SIE PA session durations | minutes | Leader, SIE |
| `metrics.sl.pa.dosage_adequacy` | Meets 4–5× weekly target when active | Binary vs. Document 98 parameter | bool | SIE, Leader |
| `metrics.sl.pa.engagement_persistence` | Minutes before shutdown/disengage | Observation median | minutes | Teacher, EF |

### 3.4 Evidence Quality

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.evidence_bundle_completeness` | L3 bundle criteria met | PA-L3-bundle rule (Doc 98) | % | KEE, Teacher |
| `metrics.sl.pa.evidence_confidence_avg` | Mean confidence on PA evidence | KEE aggregate | 0–1 | KEE, AIC |
| `metrics.sl.pa.evidence_staleness_days` | Days since latest probe | Today - last probe date | days | AIC, Teacher |
| `metrics.sl.pa.generalization_contexts` | Varied contexts with L3 evidence | Count distinct context tags | count | PA-024 |

---

## 4. Teacher Metrics

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.teacher.learners_active` | Learners on active PA pathway | Count PAJ records | count | Teacher |
| `metrics.sl.pa.teacher.probe_logging_rate` | Weekly probes logged when due | Logged / due | % | Coach, Leader |
| `metrics.sl.pa.teacher.evidence_same_day_rate` | Evidence logged same session | Same-day / total sessions | % | Coach |
| `metrics.sl.pa.teacher.advancement_evidence_rate` | Advances with full evidence bundle | Valid advances / total advances | % | Leader |
| `metrics.sl.pa.teacher.rubric_avg` | Mean Doc 102 coach score | Average Domains 1–4 | 1–5 | Coach, Leader |
| `metrics.sl.pa.teacher.pd_module_complete` | Doc 101 completion | Boolean | bool | HR, Leader |
| `metrics.sl.pa.teacher.certification_status` | Doc 103 credential active | Enum | status | Leader |
| `metrics.sl.pa.teacher.tier2_activation_rate` | Tier 2 plans initiated appropriately | Valid triggers / flat probes | % | Intervention lead |
| `metrics.sl.pa.teacher.family_activity_assign_rate` | L2+ learners with home activity | Assigned / eligible | % | Family success |
| `metrics.sl.pa.teacher.ai_override_rate` | AI suggestions rejected by teacher | Overrides / suggestions | % | AI ethics review |

---

## 5. School Metrics

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.school.learners_on_pa_pathway` | Active PA learners | Count | count | Principal |
| `metrics.sl.pa.school.avg_pathway_completion` | Mean completion % | Mean student completion | % | Principal |
| `metrics.sl.pa.school.l3_attainment_rate` | Learners reaching PA-024 L3 in cohort period | Count / cohort | % | Principal, GRE |
| `metrics.sl.pa.school.avg_weeks_to_handoff` | Mean weeks from PA entry to PA-024 L3 | Cohort mean | weeks | Leader |
| `metrics.sl.pa.school.tier2_population_pct` | % learners on Tier 2 PA | Tier 2 / PA active | % | Intervention |
| `metrics.sl.pa.school.dosage_compliance_pct` | Learners meeting dosage target | Adequate / active | % | Leader |
| `metrics.sl.pa.school.coach_observation_coverage` | Teachers with 2× coach cycle | Observed / PA teachers | % | Instructional lead |
| `metrics.sl.pa.school.walkthrough_fidelity_avg` | Mean leader walkthrough score | Doc 102 leader form | % | Principal |
| `metrics.sl.pa.school.parent_log_participation` | Families submitting home logs | Logging / assigned | % | Family success |
| `metrics.sl.pa.school.certified_teacher_pct` | PA-certified staff | Certified / PA staff | % | HR |

---

## 6. Network Metrics

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.network.total_learners_active` | All sites — PA pathway | Sum school counts | count | Network exec |
| `metrics.sl.pa.network.median_weeks_to_handoff` | Network median time to PA-024 | Median across sites | weeks | Network exec |
| `metrics.sl.pa.network.l3_attainment_rate` | Network PA-024 rate | Aggregate | % | Network exec |
| `metrics.sl.pa.network.intervention_efficacy` | Tier 2 exit rate within 8 weeks | Exited / entered Tier 2 | % | Network PD |
| `metrics.sl.pa.network.fidelity_index` | Composite coach rubric + walkthrough | Weighted index | 0–100 | Network exec |
| `metrics.sl.pa.network.pd_completion_rate` | Doc 101 complete / PA teachers | % | % | Network PD |
| `metrics.sl.pa.network.certification_rate` | Doc 103 holders / PA teachers | % | % | Network HR |
| `metrics.sl.pa.network.asset_version_compliance` | Sites on current Doc 98 version | Compliant / total | % | JAG governance |
| `metrics.sl.pa.network.cross_site_variance` | Std dev of l3_attainment across sites | Statistical | σ | Research |
| `metrics.sl.pa.network.equity_gap` | L3 rate gap — profile subgroups | Disaggregated | pp | Equity review |

---

## 7. Longitudinal Metrics

| Metric Key | Definition | Calculation | Unit | Consumer |
|------------|------------|-------------|------|----------|
| `metrics.sl.pa.long.cohort_retention_2yr` | PA-024 L3 maintained at 2 years | Retention study | % | Research |
| `metrics.sl.pa.long.pma_handoff_success` | PMA library progression post-PA-024 | Next library velocity | comp/week | Research |
| `metrics.sl.pa.long.decoding_correlation` | PA completion vs. decoding outcomes | Correlation coefficient | r | ARI |
| `metrics.sl.pa.long.intervention_recurrence` | Return to PA pathway after exit | Recurrence rate | % | Intervention |
| `metrics.sl.pa.long.multilingual_advantage` | Bilingual vs. monolingual PA velocity | Controlled comparison | delta | Research |
| `metrics.sl.pa.long.dosage_response_curve` | Outcome by weekly minutes | Regression | slope | Research |
| `metrics.sl.pa.long.graduation_literacy_link` | PA foundation vs. literacy readiness | GRE indirect | correlation | GRE |

**Longitudinal rule:** Minimum N and anonymization per Document 24 before network publication.

---

## 8. Research Metrics

| Metric Key | Definition | Use |
|------------|------------|-----|
| `metrics.sl.pa.research.effect_size_pa_instruction` | Pre/post PA probe effect size | ARI validation |
| `metrics.sl.pa.research.reliability_probe` | Inter-rater / test-retest on PA probes | Psychometric |
| `metrics.sl.pa.research.competency_difficulty_index` | % reaching L3 per competency | Item/competency calibration |
| `metrics.sl.pa.research.time_to_l3_by_competency` | Median instructional hours per competency | Doc 98 estimate validation |
| `metrics.sl.pa.research.error_pattern_frequency` | Doc 98 error pattern incidence | Intervention design |
| `metrics.sl.pa.research.home_evidence_correlation` | Parent log vs. school probe correlation | Doc 42 validation |
| `metrics.sl.pa.research.ai_recommendation_accuracy` | AI advance suggestion vs. educator decision | Doc 47 calibration |
| `metrics.sl.pa.research.certification_predictive_validity` | Cert holder vs. fidelity outcomes | Doc 103 validation |

**Research registry refs:** `research.sl.pa.nrp2000`, `research.sl.pa.og_principles`, `research.sl.pa.ari_outcomes`

---

## 9. AI Confidence Metrics

| Metric Key | Definition | Calculation | Consumer |
|------------|------------|-------------|----------|
| `metrics.sl.pa.ai.recommendation_confidence_avg` | Mean confidence on surfaced PA recommendations | Mean rule confidence | AIC admin |
| `metrics.sl.pa.ai.mastery_suggestion_count` | AI L3 suggestions per period | Count | AI ethics |
| `metrics.sl.pa.ai.mastery_suggestion_accept_rate` | Educator accepted / suggested | % | AI calibration |
| `metrics.sl.pa.ai.intervention_trigger_precision` | True positive Tier 2 suggestions | Validated / triggered | Intervention |
| `metrics.sl.pa.ai.intervention_trigger_recall` | Flat probes caught by AI | Suggested / actual flats | AIC |
| `metrics.sl.pa.ai.human_review_queue_depth` | Pending HR triggers for PA | Count | Ops |
| `metrics.sl.pa.ai.human_review_turnaround_hours` | Mean hours to educator resolution | Mean | Ops |
| `metrics.sl.pa.ai.parent_coach_engagement_rate` | Parents opening PA coach suggestions | % | Family success |
| `metrics.sl.pa.ai.explainability_completeness` | Recommendations with full cite path | % | Doc 47 QA |
| `metrics.sl.pa.ai.ceiling_violation_count` | Auto-actions attempted above 0.00 ceiling | Count — must be 0 | Security |
| `metrics.sl.pa.ai.confidence_by_evidence_type` | Confidence stratified by evidence source | Breakdown | KEE |
| `metrics.sl.pa.ai.handoff_suggestion_accuracy` | PA-024 handoff suggestions validated | % | Cross-domain |

**Guardrails:**

| Rule | Requirement |
|------|-------------|
| **AI-M-1** | `ceiling_violation_count` must remain 0 |
| **AI-M-2** | Mastery suggestions always paired with `hr.mastery_validation` |
| **AI-M-3** | Confidence < 0.60 — on-demand only (Document 47) |

---

## 10. Dashboard Views (Conceptual)

### Teacher Workspace

| Widget | Primary Metrics |
|--------|-----------------|
| PA Class Overview | learners_active, group_stage distribution |
| Probe Alerts | staleness_days, flat probe flags |
| Evidence Gaps | bundle_completeness |
| AI Suggestions | recommendation_confidence, review queue |

### School Leader Dashboard

| Widget | Primary Metrics |
|--------|-----------------|
| Program Health | l3_attainment_rate, dosage_compliance |
| Staff Fidelity | rubric_avg, certification_rate |
| Intervention | tier2_population, tier2 efficacy |
| Family Partnership | parent_log_participation |

### Network Executive Dashboard

| Widget | Primary Metrics |
|--------|-----------------|
| Outcomes | median_weeks_to_handoff, l3_attainment_rate |
| Implementation | fidelity_index, version_compliance |
| Equity | equity_gap, disaggregated attainment |
| Research | effect_size, ARI-linked longitudinal |

---

## 11. Metric Governance

| Process | Authority |
|---------|-----------|
| Definition changes | JAG Knowledge Governance (Document 61) |
| MAJOR metric change | When Document 98 success criteria shift |
| Research release | ARI + anonymization review (Document 24) |
| AI metric audit | Quarterly — AI ethics panel |

**Asset key:** `jag.metrics.rlp.sl.pa.v1.0.0`

---

*End of Document 104 — The JAG™ Executive Dashboard Metrics™: Foundational Phonological Awareness*

*The JAG™ — All Rights Reserved*
