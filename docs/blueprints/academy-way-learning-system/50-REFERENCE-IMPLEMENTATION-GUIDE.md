# DOCUMENT 50 — Reference Implementation Guide™

**Project:** The Academy Way Learning System™ — Phase 4.1A  
**Status:** Implementation Blueprint — Permanent Domain Template Only  
**Reference:** Structured Literacy Knowledge Base (Docs 38–42) · SL Authoring (Docs 43–49)

---

## 1. Charter

The **Reference Implementation Guide™ (RIG)** defines how **every future knowledge base and competency library** shall imitate the Structured Literacy reference implementation — the permanent template for Real-Life Math, LitLab, Earthology, Life Lab, AI Venture Lab, and future Academy programs.

**Copy the architecture. Adapt the content.**

---

## 2. Structured Literacy Reference Stack

The SL implementation is the **gold standard** comprising two layers:

### Layer A — Knowledge Base (Phase 4.1)

| Document | Artifact | Purpose |
|----------|----------|---------|
| **38** | Knowledge Map™ | Concept nodes |
| **39** | Learning Relationships™ | Concept graph |
| **40** | Assessment Framework™ | Domain assessment architecture |
| **41** | AI Coach™ | Domain AI roles |
| **42** | Parent Success Framework™ | Family layer |

### Layer B — Authoring System (Phase 4.1A)

| Document | Artifact | Purpose |
|----------|----------|---------|
| **43** | Competency Authoring Methodology™ | Universal process |
| **44** | Atomic Skill Authoring Guide™ | Skill standard |
| **45** | Progression Authoring Guide™ | Progression types |
| **46** | Cross-Domain Connection Standard™ | Cross-links |
| **47** | AI Metadata Standard™ | AI block |
| **48** | Quality Assurance Framework™ | QA gates |
| **49** | Publishing Pipeline™ | Lifecycle states |

### Layer C — Competency Population (Phase 4.2+)

| Phase | Deliverable |
|-------|-------------|
| **4.2** | First SL competencies — phonological awareness |
| **4.2+** | Full SL library scale-up |
| **5+** | Subsequent domains per Doc 30 priority |

---

## 3. Domain Replication Template

Every new domain **shall** produce:

```
DomainReferenceImplementation
    ├── 1. Domain Knowledge Map          (imitate Doc 38)
    ├── 2. Domain Learning Relationships (imitate Doc 39)
    ├── 3. Domain Assessment Framework   (imitate Doc 40)
    ├── 4. Domain AI Coach               (imitate Doc 41)
    ├── 5. Domain Parent Success         (imitate Doc 42)
    └── 6. Competency Library            (Docs 43–49 process)
```

**Numbering:** Domain-specific docs may use domain prefix — e.g., `RLM-Knowledge-Map` — structurally identical to SL docs 38–42.

---

## 4. Knowledge Map Template (Doc 38 Pattern)

| Required Element | Every Domain |
|------------------|--------------|
| Concept node schema | §3 Doc 38 — adapt fields |
| 15–25 major concepts | Domain-appropriate count |
| concept_key namespace | `{DOMAIN}-CONCEPT-{KEY}` |
| strand mapping | Doc 13–17 strands |
| purpose, importance, prerequisites | Per concept |
| ai/scheduling/assessment/evidence links | Per concept |
| Gold standard cross-ref | Link to SL exemplar concept where shared (e.g., EF) |

---

## 5. Learning Relationships Template (Doc 39 Pattern)

| Required Element | Every Domain |
|------------------|--------------|
| Typed edges §3 Doc 39 | All 9 types where applicable |
| Progression subgraph | Domain primary path |
| Confusion pairs | Min 5 per domain |
| Error cause edges | Linked to intervention |
| Cross-domain edges | Doc 46 canonical map |
| Traversal contracts | PAJ, AIC, SIE, intervention |
| DAG validation | `requires` acyclic |

---

## 6. Assessment Framework Template (Doc 40 Pattern)

| Required Element | Every Domain |
|------------------|--------------|
| Purpose taxonomy | Diagnostic → mastery validation |
| Domain modalities | Min 4 modalities |
| Method key registry | `assess.{domain}.*` |
| Confidence model | Base weights + modifiers |
| Human validation matrix | High-stakes gates |
| Concept/evidence mapping | Required on instruments |

---

## 7. AI Coach Template (Doc 41 Pattern)

| Required Role | Adaptation Notes |
|---------------|------------------|
| Teacher Coach | Required all domains |
| Parent Coach | Required all domains |
| Student Coach | Required all domains |
| Administrator Coach | Required |
| Scheduling Coach | Required |
| Intervention Coach | Required |
| Assessment Coach | Required |
| Evidence Coach | Required |
| Family Coach | Required |
| **Domain-specific coach** | Optional — e.g., Venture Mentor Coach |

Rule namespace: `{domain}.aic.*`

---

## 8. Parent Success Template (Doc 42 Pattern)

| Required Element | Every Domain |
|------------------|--------------|
| Home practice rules | Capacity-aware |
| Routines | Domain-appropriate |
| Language activities | Multilingual note |
| EF supports | Cross-cutting |
| Motivation + celebrations | Strengths-first |
| Progress communication | Plain language |
| Home evidence workflow | Supplementary weight |
| Family coaching boundaries | Coach not instructor |

---

## 9. Competency Authoring (Docs 43–49)

**Universal — no domain duplication of process.**

| Document | Domain-Specific Customization |
|----------|------------------------------|
| **43 CAM** | Research sources; expert reviewer pool |
| **44 ASAG** | skill_id prefix `AW-{DOMAIN}-*` |
| **45 PAG** | Primary progression types per §5 Doc 45 |
| **46 CDCS** | Domain section in canonical map |
| **47 AIMS** | Domain rule namespace |
| **48 QAF** | Add domain expert review — replace Wilson with domain equivalent |
| **49 PP** | Same state machine |

---

## 10. Domain Rollout Sequence

| Order | Domain | Knowledge Base Docs | Competency Library |
|-------|--------|---------------------|-------------------|
| **1** | Structured Literacy | 38–42 ✓ | Phase 4.2 — PA first |
| **2** | Real-Life Math | RLM-KM, RLM-LR, RLM-AF, RLM-AIC, RLM-PSF | After SL Gold Standard Declaration |
| **3** | LitLab | LL-KM series | After RLM gate |
| **4** | Earthology | EO-KM series | |
| **5** | Life Lab | LLB-KM series | |
| **6** | AI Venture Lab | AVL-KM series | May parallel Life Lab bridge |

**Gate:** Doc 30 — Library N+1 blocked until Library N quality metrics met.

---

## 11. Cross-Domain Implementation

When replicating domains:

1. Publish domain knowledge base (38–42 pattern)  
2. Register cross-domain links in Doc 46 map  
3. Author competencies with `cross_domain_connections[]`  
4. Validate Intelligence Graph integration  
5. Pilot with cross-domain cohort if links are `requires`  

---

## 12. SL Exemplar Registry Keys

First SL publish (Phase 4.2) registers:

```
gold_standard_refs
    ├── exemplar_competency_key       (first PA competency)
    ├── exemplar_skill_ids[]          (first PA skill set)
    ├── exemplar_assessment_key
    ├── exemplar_parent_activity_key
    └── exemplar_ai_rule_keys[]
```

Future domains **compare against** exemplars in QA review.

---

## 13. Phase 4.2 Handoff — Structured Literacy Phonological Awareness

Upon Phase 4.1A completion, Phase 4.2 **authorized** to:

| Step | Action |
|------|--------|
| 1 | Select `SL-CONCEPT-PHONOLOGICAL_AWARENESS` cluster |
| 2 | Author competencies per Doc 25 + Doc 43 |
| 3 | Author atomic skills per Doc 44 |
| 4 | Define linear + recursive progression Doc 45 |
| 5 | Link LitLab cross-domain Doc 46 where applicable |
| 6 | Complete AI metadata Doc 47 |
| 7 | Pass QA Doc 48 |
| 8 | Pilot → Publish Doc 49 |
| 9 | Register gold_standard_refs |

**First batch scope:** Foundational phonological awareness sub-strand — not full SL library.

---

## 14. Anti-Patterns for New Domains

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Skip knowledge base — go straight to competencies | Publish 38–42 pattern first |
| Invent new authoring process | Use Docs 43–49 unchanged |
| Duplicate SL decoding in LitLab | Cross-domain link only |
| Publish without pilot | Doc 49 pilot gate |
| Weaker QA for domain 2+ | Same Doc 48 gates |

---

## 15. Governance

| Rule | Requirement |
|------|-------------|
| **RIG-1** | SL stack is permanent reference — not replaced |
| **RIG-2** | New domains replicate Layer A before Layer C |
| **RIG-3** | Gold standard refs updated on SL Phase 4.2 publish |
| **RIG-4** | Domain knowledge docs structurally isomorphic to 38–42 |
| **RIG-5** | Phase 4.2 begins only after Phase 4.1A complete |

---

*End of Document 50 — Reference Implementation Guide™*
