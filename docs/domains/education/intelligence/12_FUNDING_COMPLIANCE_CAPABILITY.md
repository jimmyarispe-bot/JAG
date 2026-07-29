# 12 — Funding & Compliance Capability Pack

**Program D5.2 — Fourth Education Capability Pack**  
**Pack id:** `education.capability_pack.funding_compliance`  
**Version:** `0.1.0`  
**Depends on:** Student Lifecycle, Academic Operations

---

## 1. Purpose

Reason about scholarships, funding eligibility, compliance obligations, and overall funding readiness.

No Core / Runtime / Domain SDK changes. No UI. No database. Action proposals only.

---

## 2. Contributors

| Contributor | Id | Kind |
|-------------|----|------|
| Scholarship Intelligence | `education.cognition.scholarship` | observation |
| Compliance Intelligence | `education.cognition.compliance` | observation |
| Funding Readiness | `education.cognition.funding_readiness` | **synthesis** |

---

## 3. Graph

```text
Scholarship ──┐
Compliance ───┼──► Funding Readiness
Enrollment ───┘
```

---

## 4. Planner intents

- Scholarship Review  
- Funding Review  
- Compliance Review  
- Annual Eligibility  
- Funding Audit  
- Executive Funding Brief  

Scenario: `scholarship_review` (expanded to full funding pack)

---

## 5. Knowledge extensions

Entities: Funding Source, Scholarship Award, Eligibility Rule, Compliance Requirement, Renewal Cycle, Supporting Documentation, Funding Period  

Capabilities: scholarships, compliance, funding_readiness  

---

## 6. Policy extensions (metadata only)

- Scholarship eligibility  
- Renewal requirements  
- Required documentation (funding / compliance)  
- Funding deadlines  
- Compliance thresholds  

Evaluation remains in the Policy Engine only.

---

## 7. Package roots

- `src/lib/domains/education/cognition/scholarship`
- `src/lib/domains/education/cognition/compliance`
- `src/lib/domains/education/cognition/funding-readiness`
