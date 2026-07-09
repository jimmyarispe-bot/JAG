# DOCUMENT 38 — Structured Literacy Knowledge Map™

**Project:** The Academy Way Learning System™ — Phase 4.1  
**Domain Key:** `domain.structured_literacy`  
**Status:** Gold Standard Reference Implementation — Knowledge Architecture Only  
**Authority:** Permanent reference for all future domain knowledge bases  
**Integrates:** Doc 13 · Docs 25–30 · Part VI-F Wilson Framework (metadata only)

---

## 1. Charter

The **Structured Literacy Knowledge Map™ (SLKM)** defines every **major concept area** in AcademyOS Structured Literacy — the canonical knowledge layer that competencies, lessons, assessments, interventions, AI recommendations, parent activities, scheduling, evidence, and Personal Academic Journeys reference.

**This is NOT a competency library.** Concept nodes precede competency population (next phase: foundational phonological awareness).

**Explicit exclusions:**
- No Wilson curriculum, lesson plans, manuals, or copyrighted assessments
- AcademyOS metadata, instructional architecture, and learning relationships only

---

## 2. Knowledge Base Architecture

```
Structured Literacy Knowledge Base™
    ├── Knowledge Map (this document)     — Concept nodes
    ├── Learning Relationships (Doc 39) — Graph edges
    ├── Assessment Framework (Doc 40)   — SL assessment architecture
    ├── AI Coach (Doc 41)                 — SL AI roles
    └── Parent Success Framework (Doc 42) — Family layer
            ↓ references
    ULR Competencies & Atomic Skills (future population)
    Instructional Resources (Doc 28)
    KEE Evidence (Doc 27)
```

**Concept ID convention:** `SL-CONCEPT-{KEY}` — e.g., `SL-CONCEPT-PHONEMIC_AWARENESS`

---

## 3. Universal Concept Node Schema

Every concept in the Knowledge Map **shall** define:

| Field | Description |
|-------|-------------|
| `concept_key` | Immutable identifier |
| `title` | Display name |
| `strand_key` | Doc 13 strand mapping |
| `purpose` | Why this concept exists in SL |
| `importance` | Real-world and literacy impact |
| `prerequisites[]` | Concept keys that must precede |
| `dependencies[]` | Concepts that rely on this |
| `related_concepts[]` | Soft associations |
| `typical_progression` | Developmental sequence narrative |
| `difficulty` | `foundational` → `advanced` band |
| `ai_relationships[]` | Doc 41 rule category refs |
| `scheduling_considerations` | Doc 13 + SIE hints |
| `assessment_considerations` | Doc 40 method refs |
| `evidence_relationships[]` | Doc 27 type refs |

---

## 4. Concept Catalog

---

### 4.1 Phonological Awareness

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-PHONOLOGICAL_AWARENESS` |
| **strand_key** | `domain.structured_literacy.strand.phonological_awareness` |
| **Purpose** | Develop awareness that spoken language comprises units of sound — words, syllables, onset-rime |
| **Importance** | Foundational predictor of reading success; enables phonemic work |
| **Prerequisites** | Oral language exposure; listening comprehension |
| **Dependencies** | Phonemic awareness, alphabetic principle |
| **Related concepts** | Language processing, phonemic awareness |
| **Typical progression** | Word awareness → syllable segmentation → onset-rime → phoneme readiness |
| **Difficulty** | Foundational |
| **AI relationships** | `sl.aic.strategy.explicit`, `sl.aic.group.skill_band` |
| **Scheduling** | Short daily bursts; auditory-heavy; min group 2 |
| **Assessment** | Screening, observation checklist, progress monitoring |
| **Evidence** | `observation.instructional`, `measurement.progress`, `media.audio` |

---

### 4.2 Phonemic Awareness

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-PHONEMIC_AWARENESS` |
| **strand_key** | `domain.structured_literacy.strand.phonemic_awareness` |
| **Purpose** | Manipulate individual phonemes — blend, segment, delete, substitute |
| **Importance** | Direct bridge to decoding and spelling |
| **Prerequisites** | Phonological awareness (syllable/onset-rime) |
| **Dependencies** | Alphabetic principle, decoding, encoding |
| **Related concepts** | Phonological awareness, sound-symbol correspondence |
| **Typical progression** | Blend → segment → manipulate → phoneme-grapheme link |
| **Difficulty** | Foundational → developing |
| **AI relationships** | `sl.aic.intervention.micro`, `sl.aic.practice.retrieval` |
| **Scheduling** | Daily 10–15 min blocks; multisensory sessions |
| **Assessment** | Progress monitoring probes, observation |
| **Evidence** | `observation.checklist`, `measurement.progress` |

---

### 4.3 Alphabet Knowledge

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-ALPHABET_KNOWLEDGE` |
| **strand_key** | `domain.structured_literacy.strand.alphabetic_principle` |
| **Purpose** | Recognize and name letter forms; distinguish letter names from sounds |
| **Importance** | Prerequisite for grapheme-phoneme mapping |
| **Prerequisites** | Visual discrimination; phonological awareness entry |
| **Dependencies** | Sound-symbol correspondence, decoding |
| **Related concepts** | Alphabetic principle, orthographic mapping |
| **Typical progression** | Letter identification → letter naming → letter-sound distinction |
| **Difficulty** | Foundational |
| **AI relationships** | `sl.aic.strategy.errorless` |
| **Scheduling** | Integrated with PA sessions; kinesthetic options |
| **Assessment** | Checklist, screening |
| **Evidence** | `observation.checklist`, `artifact.product` (letter formation) |

---

### 4.4 Alphabetic Principle

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-ALPHABETIC_PRINCIPLE` |
| **strand_key** | `domain.structured_literacy.strand.alphabetic_principle` |
| **Purpose** | Understand that letters and letter combinations represent speech sounds in systematic ways |
| **Importance** | Core structured literacy insight — unlocks decoding system |
| **Prerequisites** | Phonemic awareness, alphabet knowledge |
| **Dependencies** | Decoding, encoding, orthographic mapping |
| **Related concepts** | Sound-symbol correspondence, morphology entry |
| **Typical progression** | Conceptual understanding → applied in CVC → extended patterns |
| **Difficulty** | Foundational → developing |
| **AI relationships** | `sl.aic.strategy.explicit`, `sl.aic.assess.formative` |
| **Scheduling** | Paired with WRS-aligned sessions; certified teacher |
| **Assessment** | Placement, formative, mastery validation |
| **Evidence** | `measurement.formative`, `evidence.wilson.session` (metadata only) |

---

### 4.5 Sound Symbol Correspondence

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-SOUND_SYMBOL` |
| **strand_key** | `domain.structured_literacy.strand.alphabetic_principle` |
| **Purpose** | Map phonemes to graphemes and vice versa — single and digraph level |
| **Importance** | Operational unit of decoding and spelling instruction |
| **Prerequisites** | Alphabetic principle, phonemic awareness |
| **Dependencies** | Decoding, encoding |
| **Related concepts** | Orthographic mapping, morphology (affixes) |
| **Typical progression** | Consonants → short vowels → digraphs → long vowel patterns |
| **Difficulty** | Developing |
| **AI relationships** | `sl.aic.practice.interleave`, `sl.aic.intervention.remediation` |
| **Scheduling** | Cumulative review slots in SIE |
| **Assessment** | Progress monitoring, dictation observation |
| **Evidence** | `evidence.wilson.spelling`, `measurement.progress` |

---

### 4.6 Decoding

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-DECODING` |
| **strand_key** | `domain.structured_literacy.strand.decoding` |
| **Purpose** | Accurate word reading through syllable patterns and phonics rules |
| **Importance** | Primary word recognition pathway for dyslexic and all learners |
| **Prerequisites** | Sound-symbol correspondence, phonemic blending |
| **Dependencies** | Fluency, comprehension, orthographic mapping |
| **Related concepts** | Encoding (inverse), morphology |
| **Typical progression** | Closed syllables → VCE → vowel teams → r-controlled → multisyllabic |
| **Difficulty** | Developing → proficient |
| **AI relationships** | `sl.aic.group.wilson`, `sl.aic.schedule.dosage` |
| **Scheduling** | WRS session blocks; min group 2; fidelity tracked |
| **Assessment** | Running record, progress probe, step band check |
| **Evidence** | `evidence.wilson.reading`, `measurement.running_record` |

---

### 4.7 Encoding

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-ENCODING` |
| **strand_key** | `domain.structured_literacy.strand.encoding` |
| **Purpose** | Spell words using phoneme-grapheme mapping and rules |
| **Importance** | Reinforces decoding; supports written expression |
| **Prerequisites** | Phonemic segmentation, sound-symbol correspondence |
| **Dependencies** | Written expression, orthographic mapping |
| **Related concepts** | Decoding, morphology |
| **Typical progression** | Phonetic spelling → pattern spelling → morphological spelling |
| **Difficulty** | Developing → proficient |
| **AI relationships** | `sl.aic.evidence.gap`, `sl.aic.family.activity` |
| **Scheduling** | Integrated in WRS sessions; home practice optional |
| **Assessment** | Spelling probe, dictation, writing analysis |
| **Evidence** | `evidence.wilson.spelling`, `artifact.writing` |

---

### 4.8 Orthographic Mapping

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-ORTHOGRAPHIC_MAPPING` |
| **strand_key** | `domain.structured_literacy.strand.orthographic_mapping` |
| **Purpose** | Store words in long-term memory via letter-sound-meaning connections |
| **Importance** | Builds sight word repertoire without rote memorization alone |
| **Prerequisites** | Decoding proficiency on pattern; phonemic awareness |
| **Dependencies** | Fluency, automaticity |
| **Related concepts** | Vocabulary, high-frequency words |
| **Typical progression** | Decodable HF words → irregular words with explanation → fluent recognition |
| **Difficulty** | Developing → proficient |
| **AI relationships** | `sl.aic.practice.spacing`, `sl.aic.practice.retrieval` |
| **Scheduling** | Spaced review in SIE |
| **Assessment** | Word recognition probe, retention check |
| **Evidence** | `measurement.retention`, `measurement.progress` |

---

### 4.9 Morphology

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-MORPHOLOGY` |
| **strand_key** | `domain.structured_literacy.strand.morphology` |
| **Purpose** | Understand prefixes, suffixes, roots — meaning and spelling |
| **Importance** | Expands vocabulary and multisyllabic decoding |
| **Prerequisites** | Decoding multisyllabic entry; vocabulary foundations |
| **Dependencies** | Vocabulary, comprehension, written expression |
| **Related concepts** | Syntax, decoding |
| **Typical progression** | Inflections → common prefixes/suffixes → Latin/Greek roots |
| **Difficulty** | Proficient → advanced |
| **AI relationships** | `sl.aic.enrich.extension` |
| **Scheduling** | Integrated in advanced SL blocks |
| **Assessment** | Vocabulary probe, word analysis task |
| **Evidence** | `artifact.writing`, `measurement.summative` |

---

### 4.10 Fluency

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-FLUENCY` |
| **strand_key** | `domain.structured_literacy.strand.fluency` |
| **Purpose** | Read accurately, automatically, and with appropriate expression |
| **Importance** | Frees cognitive resources for comprehension |
| **Prerequisites** | Decoding accuracy; orthographic mapping on controlled text |
| **Dependencies** | Comprehension, generalization |
| **Related concepts** | Automaticity, reading comprehension |
| **Typical progression** | Accurate slow reading → automaticity → prosody |
| **Difficulty** | Proficient |
| **AI relationships** | `sl.aic.assess.progress`, `sl.aic.schedule.spacing` |
| **Scheduling** | Repeated reading blocks; ORF monitoring |
| **Assessment** | ORF probe, running record, progress monitoring |
| **Evidence** | `measurement.progress`, `measurement.running_record` |

---

### 4.11 Vocabulary

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-VOCABULARY` |
| **strand_key** | `domain.structured_literacy.strand.vocabulary` |
| **Purpose** | Know word meanings and usage — oral and reading vocabulary |
| **Importance** | Comprehension and writing quality depend on vocabulary depth |
| **Prerequisites** | Oral language; decoding sufficient for text access |
| **Dependencies** | Comprehension, written expression |
| **Related concepts** | Morphology, syntax; LitLab cross-domain |
| **Typical progression** | Tier 1 oral → taught academic → morphological families |
| **Difficulty** | Developing → advanced |
| **AI relationships** | `sl.aic.cross.litlab` |
| **Scheduling** | Embedded in text reading; explicit vocabulary blocks |
| **Assessment** | Informal probe, context task, portfolio |
| **Evidence** | `artifact.reading_log`, `observation.discussion` |

---

### 4.12 Syntax

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-SYNTAX` |
| **strand_key** | `domain.structured_literacy.strand.comprehension` |
| **Purpose** | Understand sentence-level grammar — roles of words, phrase structure |
| **Importance** | Supports comprehension and written expression |
| **Prerequisites** | Vocabulary; fluent decoding on sentence-level text |
| **Dependencies** | Sentence structure, reading comprehension |
| **Related concepts** | Written expression, morphology |
| **Typical progression** | Simple sentences → compound/complex → clause analysis |
| **Difficulty** | Proficient |
| **AI relationships** | `sl.aic.cross.litlab` |
| **Scheduling** | Integrated with comprehension instruction |
| **Assessment** | Sentence analysis task, writing analysis |
| **Evidence** | `artifact.writing`, `measurement.rubric` |

---

### 4.13 Sentence Structure

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-SENTENCE_STRUCTURE` |
| **strand_key** | `domain.structured_literacy.strand.writing_connections` |
| **Purpose** | Construct and parse grammatically coherent sentences |
| **Importance** | Bridge from word-level literacy to discourse |
| **Prerequisites** | Syntax awareness; encoding proficiency |
| **Dependencies** | Written expression, reading comprehension |
| **Related concepts** | Syntax, written expression |
| **Typical progression** | Oral sentence formulation → written simple → varied structures |
| **Difficulty** | Proficient |
| **AI relationships** | `sl.aic.assess.writing_analysis` |
| **Scheduling** | Writing block linkage |
| **Assessment** | Writing analysis, rubric |
| **Evidence** | `artifact.writing`, `peer.review` |

---

### 4.14 Reading Comprehension

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-READING_COMPREHENSION` |
| **strand_key** | `domain.structured_literacy.strand.comprehension` |
| **Purpose** | Construct meaning from text — literal and inferential |
| **Importance** | Ultimate literacy outcome for academic success |
| **Prerequisites** | Fluency on text level; vocabulary; syntax |
| **Dependencies** | Generalization, transfer; LitLab depth |
| **Related concepts** | Vocabulary, language processing |
| **Typical progression** | Controlled text → grade-level → cross-text synthesis |
| **Difficulty** | Proficient → advanced |
| **AI relationships** | `sl.aic.cross.litlab`, `sl.aic.enrich.opportunity` |
| **Scheduling** | Post-decoding sessions; text complexity band |
| **Assessment** | Running record + comprehension questions, portfolio |
| **Evidence** | `measurement.running_record`, `artifact.reading_log` |

---

### 4.15 Written Expression

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-WRITTEN_EXPRESSION` |
| **strand_key** | `domain.structured_literacy.strand.writing_connections` |
| **Purpose** | Express ideas in writing with accuracy and clarity |
| **Importance** | Demonstrates integrated literacy; academic and life skill |
| **Prerequisites** | Encoding, sentence structure, vocabulary |
| **Dependencies** | Transfer to LitLab composition |
| **Related concepts** | Encoding, syntax, executive function |
| **Typical progression** | Sentence → paragraph → short composition |
| **Difficulty** | Proficient → advanced |
| **AI relationships** | `sl.aic.assess.writing_analysis`, `sl.aic.cross.litlab` |
| **Scheduling** | Extended writing blocks |
| **Assessment** | Writing analysis, rubric, portfolio |
| **Evidence** | `artifact.writing`, `mastery.validation` |

---

### 4.16 Executive Function (Literacy Context)

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-EXECUTIVE_FUNCTION` |
| **strand_key** | `domain.structured_literacy.strand.og_principles` |
| **Purpose** | Apply planning, attention, and self-regulation during literacy tasks |
| **Importance** | EF demands affect SL session success — not separate from literacy |
| **Prerequisites** | None — parallel support dimension |
| **Dependencies** | Sustained decoding practice, written expression |
| **Related concepts** | Language processing, automaticity |
| **Typical progression** | External scaffolds → internal self-monitoring |
| **Difficulty** | Cross-cutting |
| **AI relationships** | `sl.aic.accommodation.apply`, `sl.aic.schedule.break` |
| **Scheduling** | Shorter blocks if high EF demand; break insertion |
| **Assessment** | Observation fidelity, self-reflection |
| **Evidence** | `observation.instructional`, `self.reflection` |

---

### 4.17 Language Processing

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-LANGUAGE_PROCESSING` |
| **strand_key** | `domain.structured_literacy.strand.phonological_awareness` |
| **Purpose** | Receive, interpret, and respond to oral and written language |
| **Importance** | Underlies PA and comprehension; profile-informed support |
| **Prerequisites** | Oral language exposure |
| **Dependencies** | Phonological awareness, comprehension |
| **Related concepts** | Vocabulary, executive function |
| **Typical progression** | Listening → processing speed → complex discourse |
| **Difficulty** | Foundational → cross-cutting |
| **AI relationships** | `sl.aic.accommodation.apply` |
| **Scheduling** | Pace adjustment; reduced linguistic load when needed |
| **Assessment** | Screening, observation |
| **Evidence** | `observation.conference`, profile-linked notes |

---

### 4.18 Generalization

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-GENERALIZATION` |
| **strand_key** | `domain.structured_literacy.strand.comprehension` |
| **Purpose** | Apply learned skills in new contexts, texts, and settings |
| **Importance** | Mastery requires generalization — not session-only performance |
| **Prerequisites** | Proficiency on target pattern in controlled setting |
| **Dependencies** | Transfer; graduation readiness literacy |
| **Related concepts** | Transfer, automaticity |
| **Typical progression** | Controlled → varied texts → novel contexts |
| **Difficulty** | Advanced |
| **AI relationships** | `sl.aic.assess.mastery_ready`, `sl.aic.enrich.acceleration` |
| **Scheduling** | Varied text sessions; cross-setting evidence |
| **Assessment** | Transfer task, mastery validation |
| **Evidence** | `mastery.validation`, `artifact.performance` |

---

### 4.19 Transfer

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-TRANSFER` |
| **strand_key** | `domain.structured_literacy.strand.writing_connections` |
| **Purpose** | Move skills across domains — SL to LitLab, content areas, life |
| **Importance** | L4 Advanced and acceleration evidence (Doc 6) |
| **Prerequisites** | Generalization within SL |
| **Dependencies** | LitLab, academic coursework |
| **Related concepts** | Generalization, reading comprehension |
| **Typical progression** | SL controlled → LitLab application → content reading |
| **Difficulty** | Advanced |
| **AI relationships** | `sl.aic.cross.litlab`, `sl.aic.enrich.opportunity` |
| **Scheduling** | Cross-domain session linking in SIE |
| **Assessment** | Cross-domain performance task |
| **Evidence** | `artifact.performance`, cross-domain KEE links |

---

### 4.20 Automaticity

| Field | Definition |
|-------|------------|
| **concept_key** | `SL-CONCEPT-AUTOMATICITY` |
| **strand_key** | `domain.structured_literacy.strand.fluency` |
| **Purpose** | Perform decoding and word recognition with minimal conscious effort |
| **Importance** | Cognitive resource allocation for comprehension |
| **Prerequisites** | Accurate decoding; orthographic mapping |
| **Dependencies** | Fluency, comprehension |
| **Related concepts** | Orthographic mapping, retrieval practice |
| **Typical progression** | Accurate slow → timed practice → automatic |
| **Difficulty** | Proficient |
| **AI relationships** | `sl.aic.practice.retrieval`, `sl.aic.practice.spacing` |
| **Scheduling** | Daily brief retrieval; spaced review |
| **Assessment** | ORF, timed word list, retention probe |
| **Evidence** | `measurement.progress`, `measurement.retention` |

---

## 5. Concept Layer vs. Competency Layer

| Layer | Phase | Object |
|-------|-------|--------|
| **Knowledge Map** | 4.1 (this doc) | Concept nodes — permanent reference |
| **Competencies** | 4.2+ | Doc 25 schema — map to `concept_key[]` |
| **Atomic Skills** | 4.2+ | Doc 12 — map to concepts + competencies |

**Rule:** Every future SL competency declares `concept_keys[]` — minimum 1.

---

## 6. Gold Standard Reference

Future domain knowledge bases (RLM, LitLab, etc.) **shall replicate**:
- Concept node schema (§3)
- Relationship graph (Doc 39)
- Domain assessment overlay (Doc 40 pattern)
- Domain AI coach roles (Doc 41 pattern)
- Family success layer (Doc 42 pattern)

---

## 7. Governance

| Rule | Requirement |
|------|-------------|
| **SLKM-1** | No Wilson proprietary content in concept definitions |
| **SLKM-2** | Concept keys immutable after publish |
| **SLKM-3** | Next phase begins with phonological awareness competency set |
| **SLKM-4** | All SL artifacts reference concept_keys |
| **SLKM-5** | Concept map changes require Doc 30 MAJOR version |

---

*End of Document 38 — Structured Literacy Knowledge Map™*
