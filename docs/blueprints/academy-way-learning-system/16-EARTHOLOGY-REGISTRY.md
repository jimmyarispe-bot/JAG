# DOCUMENT 16 — Earthology™ Registry

**Project:** The Academy Way Learning System™ — Phase 3  
**Domain Key:** `domain.earthology`  
**Status:** Registry Architecture Only — No Skill Enumeration

---

## 1. Charter

Earthology™ is the **integrated social studies and sciences competency domain** — understanding Earth, life, society, and humanity's role in global systems through inquiry, citizenship, and sustainability.

**Pedagogical stance:** Place-based, inquiry-driven, project-capable — not textbook chapter sequencing.

---

## 2. Registry Position in ULR

```
domain.earthology
    └── [15 Strands — §3]
            └── [Sub-Strands — §4]
                    └── [Competencies — §5]
                            └── [Atomic Skills — Phase 4]
```

**Domain code:** `EO`  
**Skill ID prefix:** `AW-EO-{strand_code}-{skill}`

---

## 3. Strand Architecture

| Strand Key | Name | Disciplinary Core |
|------------|------|-------------------|
| `domain.earthology.strand.earth_science` | Earth Science | Geology, weather, water, space |
| `domain.earthology.strand.life_science` | Life Science | Biology, ecosystems, human body |
| `domain.earthology.strand.environmental_science` | Environmental Science | Human-environment interaction |
| `domain.earthology.strand.geography` | Geography | Place, region, movement, human-environment |
| `domain.earthology.strand.communities` | Communities | Local to global community structures |
| `domain.earthology.strand.government` | Government | Systems, branches, civic process |
| `domain.earthology.strand.history` | History | Chronological reasoning, historical thinking |
| `domain.earthology.strand.economics` | Economics | Scarcity, markets, trade |
| `domain.earthology.strand.culture` | Culture | Diversity, traditions, identity |
| `domain.earthology.strand.citizenship` | Citizenship | Rights, responsibilities, participation |
| `domain.earthology.strand.global_systems` | Global Systems | Interconnected world systems |
| `domain.earthology.strand.technology` | Technology | Tools, innovation impact on society |
| `domain.earthology.strand.innovation` | Innovation | Design thinking, invention |
| `domain.earthology.strand.future_earth` | Future Earth | Trends, scenarios, foresight |
| `domain.earthology.strand.sustainability` | Sustainability | Stewardship, SDG alignment |

---

## 4. Sub-Strand Architecture

Earthology uses **inquiry lens sub-strands** applied across content strands:

| Lens Key | Name | Application |
|----------|------|-------------|
| `lens.investigate` | Investigate | Ask questions, gather data |
| `lens.explain` | Explain | Construct explanations |
| `lens.argue` | Argue | Evidence-based claims |
| `lens.apply` | Apply | Solutions and action |
| `lens.connect` | Connect | Cross-strand synthesis |

**Structure pattern:**

```
domain.earthology.strand.{content_strand}
    ├── sub_strand.{content}.investigate
    ├── sub_strand.{content}.explain
    ├── sub_strand.{content}.argue
    ├── sub_strand.{content}.apply
    └── sub_strand.{content}.connect
```

**Example (History — structure only):**

```
domain.earthology.strand.history
    ├── sub_strand.history.investigate    (source analysis, chronology)
    ├── sub_strand.history.explain        (causation, continuity)
    ├── sub_strand.history.argue          (historical interpretation)
    ├── sub_strand.history.apply          (lessons for today)
    └── sub_strand.history.connect        (history ↔ economics ↔ culture)
```

---

## 5. Competency Architecture

### 5.1 Competency Composition

Each sub-strand defines **2–5 competencies** using C3 Framework-inspired dimensions (Academy Way adaptation — not NCSS copy):

| Dimension | Competency Pattern |
|-----------|-------------------|
| **Questioning** | Formulate investigable questions |
| **Evidence** | Use disciplinary sources |
| **Explanation** | Construct supported explanations |
| **Action** | Propose or take informed action |

### 5.2 Earthology-Specific Fields

| Field | Description |
|-------|-------------|
| `disciplinary_core_idea` | Strand-specific big idea ref |
| `crosscutting_concept[]` | Patterns, cause-effect, systems, etc. |
| `place_based_anchor` | Optional local geography/community link |
| `sdg_alignment[]` | UN SDG refs for sustainability strand |
| `litlab_research_link[]` | Research strand skills for inquiry |
| `rlm_economics_link[]` | Economics ↔ Real-Life Math cross-links |

### 5.3 Project-Scale Competencies

Some competencies span **multi-week projects**:

| Field | Description |
|-------|-------------|
| `project_competency` | bool |
| `project_duration_weeks` | Typical range |
| `exhibition_eligible` | Learning exhibition / portfolio |

---

## 6. Atomic Skill Representation (Phase 4 Pattern)

| Required EO Field | Purpose |
|-------------------|---------|
| `inquiry_lens` | investigate / explain / argue / apply / connect |
| `source_type[]` | primary, secondary, data, field_observation |
| `disciplinary_practice` | Specific practice within strand |
| `local_global_scale` | local, regional, national, global |

---

## 7. Evidence Architecture

| Evidence Type | Earthology Use |
|---------------|----------------|
| `artifact.investigation` | Lab reports, field notes |
| `artifact.model` | Diagrams, maps, timelines |
| `artifact.argument` | Position papers |
| `artifact.action` | Service project documentation |
| `observation.field` | Field trip, community observation |
| `media.documentation` | Photo, video with annotation |
| `data.analysis` | Charts, GIS, datasets |

**Portfolio:** Project-scale competencies → exhibition artifacts (Doc 10)

**Transcript:** Apply and Connect lens competencies default `transcript_eligible`

---

## 8. Assessment Architecture

| Method Key | Use |
|------------|-----|
| `assess.eo.inquiry_cycle` | Full investigate→action cycle |
| `assess.eo.source_analysis` | Primary source task |
| `assess.eo.project_rubric` | Multi-week project |
| `assess.eo.civic_simulation` | Government/citizenship simulation |
| `assess.eo.exhibition` | Public presentation of learning |

**Performance tasks:** Community-based assessments linked via Performance Task Catalog (Doc 14 pattern).

---

## 9. Cross-Domain Integration

| Partner Domain | Link Type |
|----------------|-----------|
| **LitLab** | Research, writing, presentation for inquiry products |
| **Real-Life Math** | Economics, data strands |
| **Life Lab** | Citizenship, community, sustainability |
| **Venture Lab** | Innovation, technology, entrepreneurship overlap |

Cross-links via `cross_domain_links` on competencies — not duplicate definitions.

---

## 10. AI Recommendation Framework

| Rule Key | Trigger | Output |
|----------|---------|--------|
| `ai.eo.inquiry_next` | Lens competency L3 | Next lens in cycle |
| `ai.eo.place_based` | Student location/profile | Local anchor projects |
| `ai.eo.strand_balance` | PAJ gap analysis | Underrepresented strands |
| `ai.eo.project_ready` | Prerequisite lenses L3 | Project competency unlock |
| `ai.eo.sustainability_path` | Interest + mastery | SDG-aligned pathway |

---

## 11. Scheduling Intelligence References

| Element | Earthology Consideration |
|---------|-------------------------|
| **Field blocks** | Geography, environmental, community strands |
| **Lab time** | Earth/life science investigations |
| **Project weeks** | Multi-week inquiry cycles |
| **Exhibition slots** | End-of-cycle public sharing |
| **Cross-class integration** | LitLab writing block + Earthology project |

---

## 12. PAJ & Graduation Readiness

| Integration | Mapping |
|-------------|---------|
| **PAJ pathway** | Scientist, citizen, historian, steward tracks |
| **Graduation readiness** | Civic knowledge, scientific literacy (Doc 7) |
| **4-year cycle** | Document 1 Learning Cycle alignment per strand rotation |

---

## 13. Expansion Protocol

| Change | Process |
|--------|---------|
| New current event competency | Version under history/government — time-stamped |
| New SDG alignment | Extend sustainability strand metadata |
| New disciplinary strand | Add strand + lens sub-strands — rare |

---

## 14. Phase 4 Boundary

Phase 4 estimates **400–550 atomic skills** across 15 strands × 5 lenses. Phase 3 delivers inquiry lens architecture, strand definitions, and integration contracts.

---

*End of Document 16 — Earthology™ Registry*
