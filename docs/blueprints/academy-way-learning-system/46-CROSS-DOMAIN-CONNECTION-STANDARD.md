# DOCUMENT 46 — Cross-Domain Connection Standard™

**Project:** The Academy Way Learning System™ — Phase 4.1A  
**Status:** Implementation Blueprint — Cross-Domain Linking Standard Only  
**Integrates:** Doc 25 · Doc 39 · Doc 12 Intelligence Graph · Docs 13–17

---

## 1. Charter

The **Cross-Domain Connection Standard™ (CDCS)** defines how competencies and atomic skills **reference one another across learning domains** — without duplicating instruction or breaking ULR single-namespace integrity.

**Links, not copies.** One skill ID per capability.

---

## 2. Connection Philosophy

| Principle | Statement |
|-----------|-----------|
| **Prerequisite not duplicate** | Cross-domain link points to canonical skill — never re-teaches |
| **Bidirectional documentation** | Both domains acknowledge link |
| **Rationale required** | Every link explains why |
| **Mastery propagates visibility** | PAJ shows cross-domain unlock — not auto-mastery |
| **Communication spans all** | Communication competencies link to every domain |

---

## 3. Connection Schema

```
CrossDomainLink
    ├── link_key
    ├── from_object_key          (competency_key or skill_id)
    ├── from_domain_key
    ├── to_object_key
    ├── to_domain_key
    ├── link_type                (§4)
    ├── direction                (unidirectional, bidirectional)
    ├── strength                 (0–1 — soft vs. hard)
    ├── rationale
    ├── graduation_impact        (optional)
    ├── ai_traversal_allowed     (bool)
    └── version
```

Hosted in **Intelligence Graph** — referenced from Doc 25 `cross_domain_connections[]`.

---

## 4. Link Types

| Type Key | Semantics | Example |
|----------|-----------|---------|
| `requires` | Hard gate — target domain skill L3 before source advance | LitLab reading requires SL decoding |
| `supports` | Soft boost — target helps source | Vocabulary supports comprehension |
| `applies` | Source skill applied in target context | RLM budgeting applies in Life Lab |
| `enriches` | Optional extension | Earthology enriches venture market research |
| `parallel` | Co-developed — same period scheduling | Venture pitch + LitLab presentation |
| `transfers_to` | Mastery in source enables target entry | SL fluency → LitLab oral reading |
| `shared_bridge` | Dual-tagged skill (Doc 17) | Life Lab / Venture finance bridge |

---

## 5. Canonical Cross-Domain Map

### 5.1 Structured Literacy (Wilson) → LitLab

| From (SL) | To (LitLab) | Link Type | Rationale |
|-----------|-------------|-----------|-----------|
| Decoding proficiency | Reading strand entry | requires | Text access |
| Fluency | Reading oral tasks | requires | Automatic word access |
| Encoding | Writing spelling dimension | supports | Spelling in composition |
| Vocabulary (SL) | Vocabulary strand | strengthens | Word meaning |
| Written expression (SL) | Writing strand | transfers_to | Composition bridge |
| Comprehension (SL) | Literary reading | transfers_to | Controlled → literary |

**Rule:** LitLab never teaches decoding — links to SL skills.

### 5.2 Structured Literacy → Real-Life Math

| From | To | Link Type | Rationale |
|------|-----|-----------|-----------|
| Phonemic awareness | Word problems entry | supports | Language of problems |
| Reading comprehension | RLM scenario reading | requires | Task comprehension |
| EF (literacy) | Multi-step RLM | supports | Problem persistence |

Limited direct links — RLM primarily quantitative.

### 5.3 Real-Life Math → Life Lab

| From (RLM) | To (Life Lab) | Link Type | Rationale |
|------------|---------------|-----------|-----------|
| Budgeting competencies | Independent living finance | applies | Personal budget |
| Employment math | Employment strand | requires | Paycheck literacy |
| Consumer skills | Independent living shopping | applies | Daily purchases |
| Insurance/credit | Financial literacy strand | shared_bridge | Doc 17 bridge |

### 5.4 Life Lab → AI Venture Lab

| From | To | Link Type | Rationale |
|------|-----|-----------|-----------|
| Financial literacy | Business finance | shared_bridge | Personal → business |
| Employment | Career readiness | transfers_to | Job → venture career |
| Leadership | Operations | supports | Team leadership |
| Communication | Sales, marketing | requires | Customer communication |
| EF | All venture strands | supports | Project persistence |

### 5.5 Earthology → Entrepreneurship (Venture Lab)

| From (Earthology) | To (Venture) | Link Type | Rationale |
|-------------------|--------------|-----------|-----------|
| Sustainability | Venture ethics | enriches | Responsible business |
| Innovation strand | Business creation | transfers_to | Idea to venture |
| Economics strand | Business finance | supports | Market concepts |
| Global systems | International business | applies | Cross-border ventures |
| Citizenship | Ethics strand | supports | Civic responsibility |

### 5.6 LitLab → Entrepreneurship

| From (LitLab) | To (Venture) | Link Type | Rationale |
|---------------|--------------|-----------|-----------|
| Professional communication | Sales, marketing | requires | Customer messaging |
| Presentation skills | Pitch competencies | requires | Venture pitch |
| Research strand | Market research | applies | Inquiry methods |
| Writing | Business plan narrative | parallel | Plan + pitch co-development |
| Digital literacy | Digital products | supports | Product creation |

### 5.7 Communication → Every Domain

| Communication Source | Target Domains | Link Type |
|------------------------|----------------|-----------|
| Life Lab communication | ALL | supports |
| LitLab speaking/listening | ALL | supports |
| LitLab professional comm | Venture, Life Lab, RLM | applies |
| Venture sales/marketing | RLM consumer, Earthology | enriches |

**Authoring rule:** Every domain competency review includes communication link check.

---

## 6. Authoring Process

| Step | Action |
|------|--------|
| 1 | Complete within-domain prerequisites first |
| 2 | Consult §5 canonical map for expected links |
| 3 | Add `cross_domain_connections[]` on competency |
| 4 | Propagate to atomic skills where skill-level gate needed |
| 5 | Verify target object exists or same-batch publish |
| 6 | Document bidirectional note on target domain backlog |
| 7 | QA cross-domain review — Doc 48 |

---

## 7. Traversal Rules (AcademyOS)

| Engine | Behavior |
|--------|----------|
| **PAJ** | Show locked skills with cross-domain prerequisite explanation |
| **AIC** | Recommend source domain skill when target blocked |
| **Graduation Readiness** | Aggregate across linked readiness domains |
| **Opportunity Engine** | Match on cross-domain skill sets |
| **Transcript** | Show cross-domain application notes |

**Hard `requires`:** Block unlock until target L3.  
**Soft `supports`:** Never block — AI may suggest.

---

## 8. Anti-Patterns (Prohibited)

| Anti-Pattern | Why |
|--------------|-----|
| Duplicate skill in two domains | Breaks single namespace |
| Cross-domain link without target key | Orphan reference |
| LitLab decoding competency | Violates SL boundary |
| Circular hard requires across domains | Graph validation fail |
| Link without rationale | QA reject |

---

## 9. Governance

| Rule | Requirement |
|------|-------------|
| **CDCS-1** | All cross-domain links in Intelligence Graph |
| **CDCS-2** | Canonical map (§5) updated when new pattern approved |
| **CDCS-3** | Bidirectional documentation within 1 release cycle |
| **CDCS-4** | Communication link check on every competency |
| **CDCS-5** | SL→LitLab links mandatory on reading/writing competencies |

---

*End of Document 46 — Cross-Domain Connection Standard™*
