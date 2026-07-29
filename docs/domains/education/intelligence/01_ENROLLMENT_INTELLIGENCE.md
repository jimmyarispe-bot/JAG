# 01 — Enrollment Intelligence

**Program D2.1 — Education Cognitive Contributor #1**  
**Package:** `src/lib/domains/education/cognition/enrollment`  
**Contributor id:** `education.cognition.enrollment`

---

## 1. Purpose

Demonstrate how the Education domain **reasons**, **produces evidence**, and **recommends actions** through JAG — without modifying Core, without UI, and without database access.

Enrollment Intelligence **never executes** Action Runtime.

---

## 2. Inputs

Normalized contracts only (host-supplied):

| Contract | Role |
|----------|------|
| Student | Subject of enrollment |
| Family | Optional family / guardian context |
| Enrollment Request | Request id + organization |
| Program | Target program |
| Campus | Optional placement campus |
| Capacity | Seats filled / total / waitlist |
| Scholarship Status | none · pending · approved · denied · review_required |
| Required Documents | Document requirements + status |
| Academic History | Transcript on file, etc. |
| Assessment | not_required · pending · complete · incomplete |
| Interview | Family interview status |
| Signatures | Required signature completion |

Embedded on Think request via:

```ts
intent.attributes["education.enrollment"] = observation
// or
organizationalContext.attributes["education.enrollment"] = observation
```

**No database queries** inside this contributor.

---

## 3. Outputs

| Output | Description |
|--------|-------------|
| EvidenceSet | Opaque `CognitiveEvidenceRef[]` (`source: education.enrollment`) |
| Recommendation[] | Kind + title + explanation + confidence + priority |
| Confidence | Overall readiness score 0..1 |
| Explanation | Human-readable readiness summary |
| Priority | Urgency (1 = highest) |
| Blocking Issues | Hard stops |
| Warnings | Soft conditions |
| Suggested Actions | Action **proposals** only |

---

## 4. Evidence examples

| Code | Meaning |
|------|---------|
| `missing_transcript` | Transcript missing |
| `missing_required_document` | Other required doc gap |
| `capacity_reached` | No seats |
| `capacity_available` | Seats remain |
| `scholarship_approved` / `scholarship_pending` / `scholarship_review_required` | Aid state |
| `assessment_incomplete` / `assessment_pending` / `assessment_complete` | Eval state |
| `required_signatures_missing` | Signatures incomplete |
| `family_interview_complete` / `family_interview_pending` | Interview state |
| `campus_unassigned` | Campus missing |
| `documents_complete` | Docs satisfied |

---

## 5. Recommendations

| Kind | Typical trigger |
|------|-----------------|
| Approve Enrollment | Ready — no blockers |
| Hold Pending Documents | Missing / rejected docs |
| Waitlist | Capacity reached |
| Request Evaluation | Assessment pending/incomplete |
| Assign Campus | Campus unassigned |
| Assign Program | Program missing (defensive) |
| Flag Scholarship Review | Scholarship pending/review |
| Recommend Parent Meeting | Interview pending |

Each recommendation includes:

- **Why** (`explanation`)  
- **Supporting evidence** (`evidenceIds`)  
- **Confidence**  
- **Priority**  
- **Constitutional traceability** (`constitutionalTrace` → Laws 1, 3, 7)

---

## 6. Action proposals (not execution)

| Proposal | Action id candidate |
|----------|---------------------|
| ApproveEnrollment | `education.enrollment.approve` |
| RejectEnrollment | `education.enrollment.reject` |
| RequestDocuments | `education.enrollment.request_documents` |
| ScheduleEvaluation | `education.enrollment.schedule_evaluation` |
| NotifyFamily | `education.enrollment.notify_family` |
| AssignCampus / AssignProgram / WaitlistEnrollment / … | see `ENROLLMENT_ACTION_PROPOSAL_IDS` |

Action Runtime may later dispatch these via Education Action contributors. This module only proposes.

---

## 7. Runtime compatibility

Implements `CognitiveContributor`:

- `supports` — observation present or enroll intent  
- `gatherEvidence` — EvidenceSet  
- `analyze` — findings (readiness + blockers)  
- `recommend` — drafts with `suggestedNextAction` + constitutional attributes  

Registered by Education Domain Builder alongside the foundation cognition placeholder.

---

## 8. Traceability

```text
EnrollmentObservation (contracts)
  → EnrollmentEvidence (Law 7 refs)
  → EnrollmentAnalyzer (readiness)
  → EnrollmentRecommendations (proposals)
  → CognitiveContributor surface
  → JAG Cognitive Runtime (no Core changes)
```
