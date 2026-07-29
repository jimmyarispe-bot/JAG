# 003 — Decision Center

**Sprint:** JAG-003  
**Routes:** `/jag/decisions` · `/jag/decisions/[id]`  
**Status:** Complete

---

## 1. Purpose

The Decision Center is the operational heart of JAG: one queue of every action proposal produced by contributors, presented as executive decisions.

Nothing is invented. Cards are projections of bound proposals only.

---

## 2. Data flow

1. Education contributors emit `suggestedActions` / recommendation proposals.  
2. Hosts bind runs via `recordEducationExecutionSnapshot` (or per-contributor record helpers).  
3. Decision Center projects each proposal into a card with stable id.  
4. Executives filter, search, group, and update status (New → … → Dismissed).

---

## 3. Card fields

Title · Category · Organization · Domain · Capability Pack · Contributor · Priority · Confidence · Evidence Count · Recommended Action · Status

---

## 4. Status workflow

`New` · `Reviewing` · `Approved` · `Deferred` · `Completed` · `Dismissed`

Status lives in the Command Center application store (not Core / Runtime).

---

## 5. Detail page

Evidence · Recommendations · Policy Trace · Knowledge References · Contributor Trace · Dependencies · Timeline · Observability

---

## 6. Filters & groups

Filters: Priority, Organization, Domain, Capability Pack, Status, Contributor  

Groups: Students · Operations · Funding · Executive  

Search: title, recommendation, evidence text

---

## 7. Constraints

- UI + application services only  
- No JAG Core / Runtime changes  
- Do not invent decisions without source proposals  
