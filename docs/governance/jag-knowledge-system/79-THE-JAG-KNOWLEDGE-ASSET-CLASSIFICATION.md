# DOCUMENT 79 — The JAG Knowledge Asset Classification™

**The JAG™ — Knowledge Domains Foundational Organization Standard**  
**Status:** Permanent Classification Architecture — No Implementation  
**Version:** 1.0  
**Effective:** June 27, 2026  
**Parent:** Document 78 — The JAG Knowledge Domains™

---

## 1. Charter

**The JAG Knowledge Asset Classification™ (JAG-KAC)** defines **every asset type** in the JAG Knowledge System. Every asset receives exactly one primary `asset_class` and maps to a Knowledge Domain (Doc 78).

**Classification key convention:** `jag.asset_class.{class_key}`

---

## 2. Classification Hierarchy

```
Knowledge Domain (Doc 78)
    └── Asset Class (this document)
            └── Asset Instance (versioned record)
                    └── Publication Package (Doc 80)
```

---

## 3. Instructional Asset Classes

### 3.1 Knowledge Base

| Attribute | Definition |
|-----------|------------|
| **class_key** | `knowledge_base` |
| **Purpose** | Domain-level canonical knowledge architecture |
| **Contains** | Knowledge maps, concept catalogs, relationship graphs |
| **Example** | Structured Literacy Knowledge Map (Doc 38) |
| **Maturity path** | Doc 83 — target Level 7+ Published |
| **Domain** | Curriculum domains primarily |

### 3.2 Concept Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `concept_library` |
| **Purpose** | Permanent instructional knowledge model for one concept |
| **Contains** | Definition, progression, enhancement profiles (Docs 52–55), derivation plan |
| **Example** | Phonemic Awareness (Doc 62) |
| **Precedes** | Competency libraries |
| **Domain** | Curriculum domains |

### 3.3 Competency Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `competency_library` |
| **Purpose** | Collections of competencies derived from concept libraries |
| **Contains** | Competency records per Doc 25 |
| **Example** | `library.structured_literacy` |
| **Domain** | Curriculum domains |

### 3.4 Atomic Skill Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `atomic_skill_library` |
| **Purpose** | Smallest assessable instructional units |
| **Contains** | Skill records per Docs 12, 44 |
| **ID convention** | `AW-{DOMAIN}-{SEQ}` — immutable once published |
| **Domain** | Curriculum domains |

### 3.5 Assessment Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `assessment_library` |
| **Purpose** | Assessment methods, instruments, items, windows |
| **Contains** | Methods (Doc 21), items (Doc 26), domain frameworks (Doc 40) |
| **Boundary** | No third-party copyrighted instruments embedded |
| **Domain** | Curriculum + Learning Sciences |

### 3.6 Evidence Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `evidence_library` |
| **Purpose** | Evidence type taxonomy, bundle rules, confidence models |
| **Contains** | Doc 27 taxonomy; bundle definitions |
| **Note** | Runtime evidence instances are AcademyOS — taxonomy is JAG |
| **Domain** | Learning Sciences + cross-cutting |

### 3.7 Instructional Resource Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `instructional_resource_library` |
| **Purpose** | Lessons, practice, projects, media linked to competencies |
| **Contains** | Resources per Doc 28 |
| **Domain** | Curriculum domains |

---

## 4. Audience Asset Classes

### 4.1 Teacher Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `teacher_guide` |
| **Purpose** | Educator-facing instructional guidance |
| **Contains** | Look-fors, fidelity notes, session guidance |
| **Domain** | Teacher Excellence + curriculum domain |

### 4.2 Parent Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `parent_guide` |
| **Purpose** | Family-facing support without proprietary curriculum |
| **Contains** | Activities, coaching cards, home practice |
| **Domain** | Family Success + curriculum domain |

### 4.3 Professional Development Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `professional_development_guide` |
| **Purpose** | Structured educator learning content |
| **Contains** | Modules, objectives, practice, reflection |
| **Domain** | Teacher Excellence, Publications domain |

### 4.4 Certification Manual

| Attribute | Definition |
|-----------|------------|
| **class_key** | `certification_manual` |
| **Purpose** | Requirements and standards for JAG credentials |
| **Contains** | Competency requirements, assessment, renewal |
| **Domain** | Publications + Teacher Excellence / Leadership |

---

## 5. Intelligence Asset Classes

### 5.1 AI Reasoning Library

| Attribute | Definition |
|-----------|------------|
| **class_key** | `ai_reasoning_library` |
| **Purpose** | AI rule keys, reasoning profiles, explainability |
| **Contains** | Docs 29, 41, 47, 55 profiles |
| **Domain** | AI & Learning Intelligence |

### 5.2 Research Summary

| Attribute | Definition |
|-----------|------------|
| **class_key** | `research_summary` |
| **Purpose** | Synthesized research with citations |
| **Contains** | Findings, application notes, validation status |
| **Domain** | Research & Continuous Improvement |

### 5.3 Decision Tree

| Attribute | Definition |
|-----------|------------|
| **class_key** | `decision_tree` |
| **Purpose** | Branching instructional or operational decisions |
| **Contains** | Nodes, conditions, actions, human gates |
| **Domain** | Learning Sciences, AI domain, curriculum |

---

## 6. Operational Asset Classes

### 6.1 Implementation Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `implementation_guide` |
| **Purpose** | How to deploy JAG assets in AcademyOS or schools |
| **Contains** | Steps, prerequisites, fidelity checks |
| **Domain** | Leadership & Organizational Excellence |

### 6.2 Policy

| Attribute | Definition |
|-----------|------------|
| **class_key** | `policy` |
| **Purpose** | Binding organizational or instructional policy |
| **Contains** | Statement, scope, authority, effective date |
| **Domain** | Leadership domain primarily |

### 6.3 Playbook

| Attribute | Definition |
|-----------|------------|
| **class_key** | `playbook` |
| **Purpose** | Operational procedures for repeatable scenarios |
| **Contains** | Steps, roles, escalation, evidence |
| **Example** | Instructional Playbook (Doc 22) |
| **Domain** | Domain-specific |

### 6.4 Framework

| Attribute | Definition |
|-----------|------------|
| **class_key** | `framework` |
| **Purpose** | Structural architecture for a domain or function |
| **Contains** | Components, relationships, governance |
| **Example** | Assessment Framework (Doc 21) |
| **Domain** | Any domain |

### 6.5 Handbook

| Attribute | Definition |
|-----------|------------|
| **class_key** | `handbook` |
| **Purpose** | Comprehensive reference for an audience |
| **Contains** | Sections per Doc 82 — policy, training, acknowledgement |
| **Domain** | Leadership, Teacher, Family — per audience |

---

## 7. Publication & Learning Asset Classes

### 7.1 Publication

| Attribute | Definition |
|-----------|------------|
| **class_key** | `publication` |
| **Purpose** | Published package in any format (Doc 80) |
| **Contains** | Immutable version, format metadata, distribution rights |
| **Domain** | Publications & Professional Learning |

### 7.2 Training Module

| Attribute | Definition |
|-----------|------------|
| **class_key** | `training_module` |
| **Purpose** | Discrete unit of professional learning |
| **Contains** | Objectives, content, assessment, duration |
| **Domain** | Publications, Teacher Excellence |

### 7.3 Reference Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `reference_guide` |
| **Purpose** | Quick lookup reference |
| **Contains** | Indexed facts, tables, cross-refs |
| **Domain** | Any domain |

### 7.4 Quick Guide

| Attribute | Definition |
|-----------|------------|
| **class_key** | `quick_guide` |
| **Purpose** | Single-topic brief guidance |
| **Contains** | 1–3 page actionable content |
| **Domain** | Any domain |

---

## 8. Quality Asset Classes

### 8.1 Checklist

| Attribute | Definition |
|-----------|------------|
| **class_key** | `checklist` |
| **Purpose** | Verification list for process or quality gate |
| **Contains** | Items, pass criteria, reviewer |
| **Example** | CLQS (Doc 56) |
| **Domain** | Governance, any domain |

### 8.2 Rubric

| Attribute | Definition |
|-----------|------------|
| **class_key** | `rubric` |
| **Purpose** | Scored criteria for performance assessment |
| **Contains** | Levels, descriptors, evidence requirements |
| **Domain** | Curriculum, Teacher Excellence |

### 8.3 Template

| Attribute | Definition |
|-----------|------------|
| **class_key** | `template` |
| **Purpose** | Reusable authoring scaffold |
| **Contains** | Required sections, metadata schema |
| **Example** | Enhanced Concept Library template (Doc 51) |
| **Domain** | Governance, any domain |

---

## 9. Localization Asset Classes

| Attribute | Classes |
|-----------|---------|
| **Localization Library** | `localization_library` — country/region overlays (Doc 57) |
| **Translation Library** | `translation_library` — locale packs (Doc 57) |

Both assign to **Global Education** domain.

---

## 10. Universal Asset Record

Every classified asset **shall** carry:

```
JAGClassifiedAsset
    ├── asset_key
    ├── asset_class              (§3–9)
    ├── domain_key               (Doc 78)
    ├── secondary_domains[]
    ├── maturity_level           (Doc 83)
    ├── lifecycle_status         (Doc 60)
    ├── version
    ├── owner                    The JAG
    ├── publication_formats[]    (Doc 80 — eligible formats)
    └── ip_notice
```

---

## 11. Classification Rules

| Rule | Requirement |
|------|-------------|
| **JAG-KAC-1** | One primary asset_class per instance |
| **JAG-KAC-2** | asset_class immutable — reclassification requires new asset_key |
| **JAG-KAC-3** | Templates (concept library) ≠ instances (published library) |
| **JAG-KAC-4** | Handbook sections inherit parent handbook class |
| **JAG-KAC-5** | AI reasoning rules never classified as policy without review |

---

*End of Document 79 — The JAG Knowledge Asset Classification™*
