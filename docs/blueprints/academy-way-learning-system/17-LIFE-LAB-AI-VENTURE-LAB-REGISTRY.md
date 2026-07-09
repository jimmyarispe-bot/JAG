# DOCUMENT 17 — Life Lab™ & AI Venture Lab™ Registry

**Project:** The Academy Way Learning System™ — Phase 3  
**Domain Keys:** `domain.life_lab`, `domain.ai_venture_lab`  
**Status:** Registry Architecture Only — No Skill Enumeration  
**Framework alignment:** Documents 4 (AI Venture Lab), 5 (Life Lab)

---

## 1. Charter

Life Lab™ and AI Venture Lab™ share a **unified competency registry architecture** because both domains prepare students for **adult independence and economic participation** — Life Lab emphasizes personal and civic life skills; AI Venture Lab emphasizes business creation and AI-enabled entrepreneurship.

**Registry rule:** Single ULR namespace with two domain keys — shared strands use `cross_domain_links` rather than duplicate skill IDs.

---

## 2. Dual-Domain Registry Structure

```
domain.life_lab                          domain.ai_venture_lab
    └── [Life Lab Strands — §3A]             └── [Venture Lab Strands — §3B]
            └── Sub-Strands                          └── Sub-Strands
                    └── Competencies                         └── Competencies
                            └── Atomic Skills                        └── Atomic Skills

                    ═══════ SHARED STRAND BRIDGE (§4) ═══════
```

**Domain codes:** `LLB` (Life Lab), `AVL` (AI Venture Lab)  
**Skill ID prefixes:** `AW-LLB-{strand}-{skill}`, `AW-AVL-{strand}-{skill}`

---

## 3A. Life Lab™ Strand Architecture

| Strand Key | Name | Document 5 Alignment |
|------------|------|---------------------|
| `domain.life_lab.strand.financial_literacy` | Financial Literacy | Overlaps RLM — links not duplicates |
| `domain.life_lab.strand.independent_living` | Independent Living | Daily life, home, self-care |
| `domain.life_lab.strand.employment` | Employment | Job search, workplace skills |
| `domain.life_lab.strand.leadership` | Leadership | Teams, influence, service |
| `domain.life_lab.strand.communication` | Communication | Interpersonal, conflict, advocacy |
| `domain.life_lab.strand.executive_function` | Executive Function | Planning, organization, self-regulation |

---

## 3B. AI Venture Lab™ Strand Architecture

| Strand Key | Name | Document 4 Alignment |
|------------|------|---------------------|
| `domain.ai_venture_lab.strand.business_creation` | Business Creation | Idea to entity |
| `domain.ai_venture_lab.strand.innovation` | Innovation | Problem finding, design |
| `domain.ai_venture_lab.strand.ai_literacy` | AI Literacy | Understanding AI capabilities/limits |
| `domain.ai_venture_lab.strand.prompt_engineering` | Prompt Engineering | Effective AI interaction |
| `domain.ai_venture_lab.strand.automation` | Automation | Workflows, tools, integration |
| `domain.ai_venture_lab.strand.digital_products` | Digital Products | Build and ship digital goods |
| `domain.ai_venture_lab.strand.marketing` | Marketing | Audience, messaging, channels |
| `domain.ai_venture_lab.strand.sales` | Sales | Conversion, customer conversation |
| `domain.ai_venture_lab.strand.operations` | Operations | Delivery, fulfillment, systems |
| `domain.ai_venture_lab.strand.business_finance` | Business Finance | P&L, cash flow, pricing |
| `domain.ai_venture_lab.strand.customer_experience` | Customer Experience | Support, retention, feedback |
| `domain.ai_venture_lab.strand.ethics` | Ethics | Responsible business and AI use |
| `domain.ai_venture_lab.strand.professionalism` | Professionalism | Workplace norms, reliability |
| `domain.ai_venture_lab.strand.career_readiness` | Career Readiness | Portfolio, networking, interviews |
| `domain.ai_venture_lab.strand.portfolio_development` | Portfolio Development | Venture and career artifacts |

---

## 4. Shared Strand Bridge

Strands that span both domains use **bridge competencies** — one canonical skill ID with dual domain tags:

| Bridge Topic | Primary Domain | Secondary Domain |
|--------------|----------------|------------------|
| Financial literacy | life_lab.financial_literacy | ai_venture_lab.business_finance |
| Employment | life_lab.employment | ai_venture_lab.career_readiness |
| Communication | life_lab.communication | ai_venture_lab.sales, marketing |
| Leadership | life_lab.leadership | ai_venture_lab.operations |
| Innovation | ai_venture_lab.innovation | earthology.innovation (cross-link) |
| Executive function | life_lab.executive_function | All venture strands (EF demand metadata) |

**Implementation pattern:**

```
atomic_skill.domain_tags = ['domain.life_lab', 'domain.ai_venture_lab']
atomic_skill.canonical_domain = 'domain.life_lab'  // primary for reporting
```

---

## 5. Sub-Strand Architecture

### 5.1 Life Lab Sub-Strand Pattern (4-Year Cycle)

Aligned with Document 5 four-year progression:

| Year Band | Sub-Strand Suffix | Focus |
|-----------|-------------------|-------|
| **Y1** | `.foundations` | Awareness and guided practice |
| **Y2** | `.application` | Supported independence |
| **Y3** | `.independence` | Minimal scaffolding |
| **Y4** | `.mastery` | Teach-back, mentorship, transition |

```
domain.life_lab.strand.independent_living
    ├── sub_strand.independent_living.foundations
    ├── sub_strand.independent_living.application
    ├── sub_strand.independent_living.independence
    └── sub_strand.independent_living.mastery
```

### 5.2 Venture Lab Sub-Strand Pattern (Venture Cycle)

Aligned with Document 4 Learning Cycles:

| Cycle Phase | Sub-Strand Suffix | Focus |
|-------------|-------------------|-------|
| **Discover** | `.discover` | Problem, market, idea |
| **Design** | `.design` | Solution, prototype |
| **Build** | `.build` | MVP, product |
| **Launch** | `.launch` | Go-to-market |
| **Grow** | `.grow` | Scale, iterate |
| **Reflect** | `.reflect` | Portfolio, lessons |

```
domain.ai_venture_lab.strand.business_creation
    ├── sub_strand.business_creation.discover
    ├── sub_strand.business_creation.design
    ├── sub_strand.business_creation.build
    ├── sub_strand.business_creation.launch
    ├── sub_strand.business_creation.grow
    └── sub_strand.business_creation.reflect
```

---

## 6. Competency Architecture

### 6.1 Life Lab Competency Template

| Template | Description |
|----------|-------------|
| **Awareness** | Recognize importance and vocabulary |
| **Practice** | Perform with coaching |
| **Independence** | Perform without prompting |
| **Generalization** | Transfer across contexts |
| **Advocacy** | Self-advocate or teach others |

### 6.2 Venture Lab Competency Template

| Template | Description |
|----------|-------------|
| **Understand** | Conceptual business/AI knowledge |
| **Prototype** | Create minimum viable artifact |
| **Validate** | Test with real users/market |
| **Operate** | Run ongoing venture function |
| **Scale** | Grow or pivot with evidence |

### 6.3 Shared Competency Fields

| Field | Description |
|-------|-------------|
| `year_band` | Y1–Y4 (Life Lab) or cycle phase (Venture) |
| `ef_demand_level` | Executive function load |
| `authentic_context` | Required real-world element |
| `venture_artifact_type` | pitch, product, campaign, etc. |
| `rlm_skill_links[]` | Real-Life Math prerequisites |
| `litlab_skill_links[]` | Communication/writing prerequisites |
| `graduation_readiness_domain` | Doc 7 mapping |

---

## 7. Atomic Skill Representation (Phase 4 Pattern)

| Required Field | Life Lab | Venture Lab |
|----------------|----------|-------------|
| `performance_context` | Home, community, workplace | Market, customer, team |
| `scaffolding_level` | Y1–Y4 band | Cycle phase |
| `venture_milestone` | — | Optional venture checkpoint |
| `ai_tool_category` | — | Optional AI tool class |
| `ethics_checkpoint` | Advocacy, safety | ethics strand cross-ref |

---

## 8. Evidence Architecture

| Evidence Type | Life Lab | Venture Lab |
|---------------|----------|-------------|
| `artifact.life_skill_demo` | Cooking, budgeting log | — |
| `artifact.venture_pitch` | — | Pitch deck, video |
| `artifact.product` | — | MVP, digital product |
| `artifact.financial` | Personal budget | Business P&L |
| `observation.workplace` | Job shadow | Customer interaction |
| `reflection.venture` | Life transition plan | Cycle retrospective |
| `certification.external` | First aid, food handler | Optional external creds |

**Portfolio (Doc 10):** Venture Lab is **primary** portfolio domain — `portfolio_eligible` default true

**Transcript (Doc 11):** Y4/Mastery and Launch/Grow competencies default `transcript_eligible`

---

## 9. Assessment Architecture

| Method Key | Domain | Use |
|------------|--------|-----|
| `assess.llb.performance` | Life Lab | Live life skill demonstration |
| `assess.llb.simulation` | Life Lab | Apartment, interview simulation |
| `assess.avl.pitch` | Venture Lab | Venture pitch evaluation |
| `assess.avl.product_review` | Venture Lab | Product/market fit evidence |
| `assess.avl.ai_project` | Venture Lab | AI-enabled deliverable |
| `assess.avl.operations_audit` | Venture Lab | Business operations review |
| `assess.shared.portfolio_defense` | Both | Graduation portfolio defense |

---

## 10. AI Recommendation Framework

| Rule Key | Domain | Trigger | Output |
|----------|--------|---------|--------|
| `ai.llb.ef_scaffold` | Life Lab | EF profile + struggle | Reduced complexity skill |
| `ai.llb.transition` | Life Lab | Y4 approaching | Mastery pathway |
| `ai.avl.cycle_advance` | Venture Lab | Phase competencies L3 | Next cycle phase |
| `ai.avl.ai_tool` | Venture Lab | Skill + age policy | Appropriate AI tool |
| `ai.avl.market_gap` | Venture Lab | Venture data | Skill recommendation |
| `ai.shared.rlm_bridge` | Both | Financial competency blocked | RLM skill link |
| `ai.shared.opportunity` | Both | Skill mastery | Opportunity Engine match (Doc 9) |

**Ethics gate:** AI recommendations for venture AI tools require `ethics` strand competency threshold — org policy configurable.

---

## 11. Scheduling Intelligence References

| Element | Life Lab | Venture Lab |
|---------|----------|-------------|
| **Extended blocks** | Simulations, field | Build sprints |
| **Mentor sessions** | Y4 mentorship | Advisor meetings |
| **Market days** | Community events | Launch events |
| **Co-working time** | — | Venture work blocks |
| **Cross-schedule** | RLM financial sessions | LitLab pitch writing |

Document 7-E whole-child constraints apply to EF-heavy Life Lab skills.

---

## 12. PAJ Integration

| PAJ Element | Life Lab | Venture Lab |
|-------------|----------|-------------|
| **4-year track** | Document 5 progression | Document 4 cycle map |
| **Venture entity** | — | Optional student venture record on PAJ |
| **Transition planning** | Y4 mastery map | Career readiness + portfolio |
| **Family Journey** | Parent activities on life skills | Family as customer/market (optional) |

---

## 13. Graduation Readiness & Opportunity Engine

| System | Integration |
|--------|-------------|
| **Graduation Readiness (Doc 7)** | Life readiness, career readiness, venture readiness domains |
| **Opportunity Engine (Doc 9)** | Skills match internships, mentors, markets |
| **Student Success** | EF strand informs accommodation — not label |

---

## 14. Real-Life Math & LitLab Dependencies

| Competency Area | Prerequisite Domain |
|-----------------|---------------------|
| Personal finance | RLM money → budgeting strands |
| Business finance | RLM business_math, entrepreneurship_math |
| Pitch / marketing copy | LitLab writing, presentation |
| Customer communication | LitLab professional_communication |

Declared via `prerequisites[]` — never embedded math/ELA instruction in Life/Venture competencies.

---

## 15. Expansion Protocol

| Change | Process |
|--------|---------|
| New AI tool category | Extend ai_literacy sub-strands; version ethics competencies |
| New venture model (e.g., DAO) | Add sub-strand under business_creation — not new domain |
| Regulatory (child business laws) | Version ethics + business_creation — jurisdiction metadata |

---

## 16. Phase 4 Boundary

| Domain | Estimated Atomic Skills (Phase 4) |
|--------|-----------------------------------|
| Life Lab | ~200–280 |
| AI Venture Lab | ~350–450 |
| Shared bridge skills | ~40–60 (dual-tagged) |

Phase 3 delivers dual-domain architecture, cycle/year sub-strand patterns, bridge model, and full integration contracts.

---

*End of Document 17 — Life Lab™ & AI Venture Lab™ Registry*
