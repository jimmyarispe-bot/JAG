# 005 — Executive Briefing Engine

**Sprint:** JAG-005  
**Routes:** `/jag/briefings` · `/jag/briefings/[id]`  
**Status:** Complete

---

## 1. Purpose

Generate evidence-backed executive briefings.

A briefing is a **narrative**, not a dashboard. It is synthesized deterministically from Command Center application stores:

- Organization Health  
- Decision Queue  
- Recent contributor executions  
- Operational readiness  
- Funding readiness  
- Student success  
- Recent outcomes  

No JAG Core / Runtime / Domain SDK changes. No LLM.

---

## 2. Organization scope

Each briefing is scoped to one organization from the session. Generation requires selecting an organization.

---

## 3. Timeline windows

| Timeline | Window |
|----------|--------|
| Today | UTC midnight → now |
| This Week | Monday UTC → now |
| This Month | 1st of month UTC → now |
| Quarter | Quarter start UTC → now |
| Custom | Caller-provided start/end |

---

## 4. Brief structure

Every briefing includes:

1. Executive Summary  
2. Today's Priorities  
3. Critical Risks  
4. Opportunities  
5. Decision Queue Summary  
6. Completed Outcomes  
7. Emerging Trends  
8. Recommended Executive Actions  
9. Appendix  

Each section carries:

- Narrative + bullets (when sources exist)  
- Evidence references  
- Confidence (or explicit unavailable)  
- Contributor sources  
- Policy references (when applicable)  

Empty sections explain what is unbound — nothing is invented.

---

## 5. Data flow

1. Hosts bind Education intelligence via `recordEducationExecutionSnapshot` (and Decision Center workflows).  
2. Executive opens `/jag/briefings`, selects organization + timeline.  
3. `synthesizeExecutiveBriefing` builds sections from stores.  
4. Briefing is saved in the application briefing archive and opened at `/jag/briefings/[id]`.

---

## 6. Constraints

- Application layer under `src/lib/jag-command-center/briefing-engine/`  
- UI under `src/components/jag/command-center/briefings/`  
- Do not modify Core, Runtime, or Domain SDK  
- Do not fabricate health, risks, or outcomes  
