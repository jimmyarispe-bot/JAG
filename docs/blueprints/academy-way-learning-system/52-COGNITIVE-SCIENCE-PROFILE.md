# DOCUMENT 52 — Cognitive Science Profile™

**Project:** The Academy Way Learning System™ — Phase 4.2A  
**Status:** Concept Library Enhancement Standard — Mandatory Section for All Concept Libraries  
**Applies to:** Document 51 (revised) · All future Concept Libraries · All domains

---

## 1. Charter

The **Cognitive Science Profile™ (CSP)** is a **mandatory section** of every Concept Library defining the cognitive demands and processes involved in mastering the concept — informing instruction, accommodations, scheduling, AI recommendations, and competency authoring.

**Not clinical assessment.** Profiles inform instructional design and platform intelligence — not diagnosis.

---

## 2. Universal CSP Schema

Every Concept Library **shall** include section **Cognitive Science Profile** with all fields below.

```
cognitive_science_profile
    ├── primary_cognitive_processes[]
    ├── secondary_cognitive_processes[]
    ├── working_memory_demands
    ├── long_term_memory_demands
    ├── retrieval_demands
    ├── attention_demands
    ├── executive_function_demands
    ├── language_demands
    ├── visual_processing_demands
    ├── auditory_processing_demands
    ├── motor_demands
    ├── metacognitive_demands
    └── instructional_implications[]
```

---

## 3. Field Definitions & Authoring Guidance

### 3.1 Primary Cognitive Processes

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Core mental operations required for the concept |
| **Format** | Named process + brief role statement |
| **Examples** | Phonological processing, procedural learning, semantic retrieval |
| **Count** | 2–5 primary processes |

### 3.2 Secondary Cognitive Processes

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Supporting processes that enhance or enable primary processes |
| **Format** | Named process + contribution |
| **Count** | 2–6 secondary processes |

### 3.3 Working Memory Demands

| Level | Definition | Instructional Response |
|-------|------------|------------------------|
| **Low** | 1–2 units held briefly | Standard session length |
| **Moderate** | 3–4 units; manipulation required | Chunking, scaffolds |
| **High** | Multi-step hold + transform | Short bursts; external aids |

Include: **verbal WM**, **phonological loop load**, **duration estimate**.

### 3.4 Long-Term Memory Demands

| Dimension | Describe |
|-----------|----------|
| **Declarative** | Facts, rules, patterns to store |
| **Procedural** | Automated routines to build |
| **Episodic** | Context-bound learning memories |
| **Load level** | low / moderate / high |
| **Consolidation** | Spacing and sleep implications (high-level) |

### 3.5 Retrieval Demands

| Dimension | Describe |
|-----------|----------|
| **Recall type** | Recognition, cued recall, free recall |
| **Transfer context** | Same vs. novel context retrieval |
| **Practice implication** | Retrieval practice applicability (Doc 18) |

### 3.6 Attention Demands

| Dimension | Level | Notes |
|-----------|-------|-------|
| **Sustained attention** | low / moderate / high | Session length cap |
| **Selective attention** | | Filter distractions |
| **Divided attention** | | Multi-channel (rare at intro) |

### 3.7 Executive Function Demands

Cross-reference Learning Profile (Doc 19). Rate each:

| EF Component | Level (L/M/H) |
|--------------|---------------|
| Planning | |
| Organization | |
| Task initiation | |
| Cognitive flexibility | |
| Inhibitory control | |
| Self-monitoring | |
| **Composite EF demand** | low / moderate / high |

### 3.8 Language Demands

| Dimension | Describe |
|-----------|----------|
| **Receptive** | Understanding oral/written instruction |
| **Expressive** | Oral/written response required |
| **Metalinguistic** | Language about language |
| **Multilingual** | Cross-linguistic considerations |

### 3.9 Visual Processing Demands

| Level | Typical Concepts |
|-------|------------------|
| **None / minimal** | Pure oral PA |
| **Moderate** | Charts, word displays |
| **High** | Complex text, diagrams |

### 3.10 Auditory Processing Demands

| Level | Typical Concepts |
|-------|------------------|
| **High** | PA, phonemic awareness |
| **Moderate** | Listening comprehension |
| **Low** | Pure visual/spatial math |

Include: discrimination, sequencing, memory for sounds.

### 3.11 Motor Demands

| Channel | Level |
|---------|-------|
| **Fine motor** | writing, manipulation |
| **Gross motor** | movement activities |
| **Oral-motor** | speech production |
| **None** | pure listening tasks |

### 3.12 Metacognitive Demands

| Dimension | Describe |
|-----------|----------|
| **Self-awareness** | Know when task is hard/easy |
| **Strategy use** | Select and apply strategies |
| **Monitoring** | Check own performance |
| **Level** | low / moderate / high |

---

## 4. Instructional Implications Array

Each CSP **shall** conclude with 3–8 bullet implications linking cognitive load to:

- Session design (Doc 22)
- Accommodations (Doc 25)
- Scheduling (Doc 54)
- AI confidence (Doc 55)

---

## 5. Integration Matrix

| Consumer | CSP Use |
|----------|---------|
| **Concept Library** | Mandatory section |
| **Competency authoring** | EF fields, accommodations |
| **Learning Profile** | Match demands to profile |
| **Scheduling Intelligence** | Duration, breaks |
| **AI Coach** | Confidence, scaffolds |
| **Intervention** | Cognitive load reduction |

---

## 6. Governance

| Rule | Requirement |
|------|-------------|
| **CSP-1** | All 12 demand fields populated — use N/A with rationale if truly none |
| **CSP-2** | No diagnostic labels in CSP |
| **CSP-3** | Cognitive Science review in Doc 56 before publish |
| **CSP-4** | Levels use standardized enum: low, moderate, high |

---

*End of Document 52 — Cognitive Science Profile™*
