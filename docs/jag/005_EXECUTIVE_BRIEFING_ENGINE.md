# 005 — Executive Briefing Engine

**Sprint:** JAG-005 (+ enhancement)  
**Routes:** `/jag/briefings` · `/jag/briefings/[id]` · `/jag/briefings/share/[token]`  
**Status:** Complete

---

## 1. Purpose

Generate evidence-backed executive briefings.

A briefing is a **narrative**, not a dashboard. It is synthesized deterministically from Command Center application stores.

No JAG Core / Runtime / Domain SDK changes. No LLM. No fabricated content.

---

## 2. Organization scope

| Scope | Behavior |
|-------|----------|
| Single Organization | One session org |
| Multi-Organization | Selected session orgs |
| Entire Enterprise | All session orgs (enterprise-ready) |

---

## 3. Timeline windows

Today · This Week · This Month · Quarter · Custom

---

## 4. Briefing types (follow-up ready)

Morning Brief · Weekly Executive Review · Monthly Board Report · Quarterly Strategic Review · Operational Incident Brief · Funding Brief · Student Success Brief · Compliance Brief · Risk Brief

Same engine; kind changes section order and narrative emphasis.

---

## 5. Brief structure

Standard narrative sections plus first-class executive questions:

1. Executive Summary  
2. **What happened?**  
3. **Why did it happen?**  
4. **What should I decide today?**  
5. **What happens if I do nothing?**  
6. **What should I watch next?**  
7. Today's Priorities  
8. Critical Risks  
9. Opportunities  
10. Decision Queue Summary  
11. Completed Outcomes  
12. Emerging Trends  
13. Recommended Executive Actions  
14. Executive Insights  
15. Appendix  

Each section includes evidence references, confidence, contributor sources, and policy references (when applicable).

---

## 6. Explainability

Every recommendation supports:

Show Evidence · Show Contributors · Show Policies · Show Confidence · Show Dependencies · Show Timeline

---

## 7. Decision links

Recommendations link to Decision Center records so executives can Review, Approve, Assign, and Track without searching elsewhere.

Section actions: Approve Decision · Open Decision · Assign · Create Follow-up · Add Executive Note · Schedule Review

---

## 8. Executive insights

Computed only from bound intelligence:

Largest improvement · Largest deterioration · Highest / lowest confidence · Fastest-growing risk · Highest-impact opportunity · Most successful completed decision · Most overdue decision

---

## 9. Share & export

| Capability | Behavior |
|------------|----------|
| Print-friendly | `?mode=print` |
| PDF export | Browser print → PDF |
| Board presentation | `?mode=board` |
| Read-only share link | `/jag/briefings/share/[token]` (public) |
| Email delivery | Reserved for future integration |

---

## 10. Constraints

- Application layer under `src/lib/jag-command-center/briefing-engine/`  
- Do not modify Core, Runtime, or Domain SDK  
- Do not fabricate health, risks, or outcomes  
