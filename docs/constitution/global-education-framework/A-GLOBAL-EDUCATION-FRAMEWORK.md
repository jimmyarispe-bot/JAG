# CONSTITUTIONAL DOCUMENT A — Global Education Framework™

**AcademyOS Constitution — Amendment: Global Education Framework™**  
**Status:** Constitutional Architecture — No Implementation  
**Version:** 1.0  
**Effective:** June 27, 2026  
**Amends:** AcademyOS Constitution v2.0  
**Governing Schools:** The Academy Virtual™ · The Academy High School™

---

## 1. Constitutional Principle (New)

> **AcademyOS shall be GLOBAL BY DESIGN. LOCAL BY CONFIGURATION.**

The platform shall **never assume** that learners reside in a single country, speak a single language, use a single currency, follow a single educational system, or qualify for a single funding model.

All localization shall occur through **configurable frameworks** while preserving **one unified Education Operating System**.

| Attribute | Requirement |
|-----------|-------------|
| **Global by Design** | Core architecture, registries, and workflows built for international scale from inception |
| **Local by Configuration** | Country, region, and jurisdiction behavior activated through Configuration Studio — not forked codebases |
| **One Education OS** | Single platform kernel; no per-country product silos |
| **Academy schools** | The Academy Virtual and The Academy High School operate as **global schools** enrolling worldwide |

This principle is **foundational** — subordinate frameworks (Documents B, C, D) implement it; no module may violate it.

---

## 2. Charter

The **Global Education Framework™ (GEF)** defines how AcademyOS serves students, families, educators, and partner organizations **throughout the world** while maintaining constitutional integrity, evidence-based mastery, and unified platform services.

GEF is **not** a separate product. It is the **international operating layer** atop the Platform Kernel (Constitution Part II).

---

## 3. Global by Design

### 3.1 Definition

**Global by Design** means every constitutional subsystem is architected assuming:

- Multi-country deployment from day one
- Multi-timezone concurrent operation
- Multi-language content and interface requirements
- Multi-currency financial flows
- Diverse legal and educational jurisdictions
- Cross-border enrollment and credential recognition

### 3.2 Design Requirements

| Domain | Global-by-Design Requirement |
|--------|------------------------------|
| **Identity** | International address formats; phone E.164; document types beyond US-only |
| **Time** | UTC storage; locale-aware display; scheduling across zones |
| **Money** | ISO 4217 currencies; exchange metadata where needed |
| **Language** | Unicode; RTL support; locale fallback chains |
| **Education** | Competency model jurisdiction-agnostic; local mapping via config |
| **Evidence** | KEE records locale and jurisdiction context |
| **Registries** | Platform Registry Framework — global keys, local overlays |
| **Compliance** | Jurisdiction rule engine — not hard-coded US law |

### 3.3 Prohibited Assumptions

The platform shall **not** assume by default:

- United States as sole country of operation
- English as sole instructional or UI language
- USD as sole currency
- US grade levels as sole placement vocabulary
- US graduation credits as sole completion model
- US-only funding programs (FAFSA, state vouchers) as universal
- US Eastern Time as system default for all users

Defaults may exist for **initial deployment** — they must be **overridable by configuration**.

---

## 4. Local by Configuration

### 4.1 Definition

**Local by Configuration** means jurisdiction-specific behavior is expressed through **Configuration Studio** and **registry overlays** — not duplicate application modules.

```
Global Platform Kernel
    └── Configuration Layer
            ├── Country Profile
            ├── Region Profile
            ├── Language Pack
            ├── Curriculum Overlay
            ├── Assessment Overlay
            ├── Funding Catalog
            ├── Compliance Rules
            └── Reporting Templates
```

### 4.2 Configuration Hierarchy

| Level | Scope | Examples |
|-------|-------|----------|
| **Global** | Platform-wide defaults | ULR skill IDs; mastery scale; core workflows |
| **Country** | Nation-state rules | Compulsory education age; data residency; currency |
| **Region** | State, province, canton, emirate | Graduation requirements; funding programs |
| **Organization** | School or network | Branding; optional program emphasis |
| **Learner** | Individual | Language preference; timezone; accommodations |

**Rule:** Lower levels override higher where permitted; global invariants (mastery philosophy, evidence rules) are **not** overridable.

### 4.3 Configuration Studio Mandate

Configuration Studio is the **sole authorized channel** for:

- Activating country packs
- Enabling regional graduation pathways
- Registering local funding programs
- Applying compliance rule sets
- Publishing localized report templates

No engineering deployment required for standard localization expansion.

---

## 5. International Scalability

### 5.1 Scalability Dimensions

| Dimension | Approach |
|-----------|----------|
| **Enrollment volume** | Horizontal platform scaling; org-sharded data where required |
| **Geographic expansion** | Country pack activation — not new codebase |
| **Language expansion** | Translation pipeline + locale packs |
| **Regulatory expansion** | Compliance rule registry per jurisdiction |
| **Partner expansion** | White-label org config within global kernel |

### 5.2 Global Schools Model

The Academy Virtual and The Academy High School enroll students **worldwide** under one academic model (Academy Way) with **local configuration** for:

- Graduation pathway recognition
- Required disclosures
- Funding eligibility surfacing
- Family support resources

### 5.3 Partner Organizations

International private schools, homeschool networks, and education partners operate on AcademyOS under **organization configuration** within country/regional rules — same kernel, local overlays.

---

## 6. International Compliance

### 6.1 Compliance Architecture

```
Compliance Rule Registry (per jurisdiction)
    ├── Data Protection (GDPR, COPPA, PIPEDA, LGPD, etc.)
    ├── Education Law (compulsory attendance, homeschool registration)
    ├── Financial Regulation (tuition, scholarships, tax receipts)
    ├── Accessibility Law (WCAG, EN 301 549, local equivalents)
    ├── Child Safeguarding
    └── Export / Sanctions Screening (where applicable)
```

### 6.2 Compliance Principles

| Principle | Statement |
|-----------|-----------|
| **Jurisdiction tagging** | Every org, learner, and record carries `jurisdiction_keys[]` |
| **Rule evaluation** | Compliance engine evaluates rules at enrollment, data processing, export |
| **Data residency** | Country packs declare residency requirements — config, not assumption |
| **Consent localization** | Consent flows match jurisdiction requirements |
| **Audit trail** | Cross-border data access logged in KEE governance |
| **No lowest common denominator** | Meet **each** applicable jurisdiction — union of requirements |

### 6.3 Compliance Governance

| Body | Role |
|------|------|
| **Legal review** | Country pack approval before activation |
| **Privacy officer** | Data protection impact assessments |
| **Configuration Studio** | Published compliance rule versions |
| **Constitutional Amendment** | Required for compliance philosophy changes |

---

## 7. Localization Philosophy

### 7.1 Core Tenets

| Tenet | Statement |
|-------|-----------|
| **Separate language from learning model** | Mastery and ULR skills are global; **examples and contexts** localize |
| **Preserve competency integrity** | Localization adapts context — does not lower standards |
| **Cultural respect** | Local examples reflect local life — not US-centric defaults |
| **Progressive enhancement** | English + US config may ship first; architecture supports all locales |
| **Human + AI translation** | Machine translation accelerates; human review for high-stakes content |
| **Family accessibility** | Family Journey content localized to family language preference |

### 7.2 What Localizes vs. What Persists

| Localizes | Persists Globally |
|-----------|-------------------|
| UI strings | Skill IDs (ULR) |
| Currency display | Mastery levels (0–4) |
| Date/time format | Evidence → mastery rules |
| Example scenarios (RLM, Life Lab) | Wilson WRS (English literacy — with multilingual support surfaces) |
| Graduation pathway labels | PAJ architecture |
| Funding program catalog | KEE evidence model |
| Report templates | Constitutional principles |
| Legal disclosures | Platform Event/Decision model |

---

## 8. Country Configuration Model

### 8.1 Country Profile Schema (Conceptual)

```
CountryProfile
    ├── country_code              (ISO 3166-1 alpha-2)
    ├── country_name
    ├── default_currency          (ISO 4217)
    ├── default_timezone          (IANA)
    ├── official_languages[]
    ├── supported_languages[]     (UI + content)
    ├── date_format_preference
    ├── number_format_preference
    ├── education_system_refs[]   (linked educational system definitions)
    ├── compulsory_education      (age range, requirements summary)
    ├── data_residency_region
    ├── compliance_rule_set_key
    ├── funding_catalog_key
    ├── family_support_catalog_key
    ├── graduation_pathway_keys[]
    ├── admissions_requirements_key
    └── status                    (draft, active, deprecated)
```

### 8.2 Country Pack Contents

| Component | Description |
|-----------|-------------|
| **Compliance rules** | Data protection, education law summaries |
| **Funding catalog** | Government and private programs (Doc C) |
| **Family support catalog** | Resources by country |
| **Graduation pathways** | Recognized completion routes |
| **Admissions checklist** | Required documents (Doc B) |
| **RLM localization overlay** | Currency, tax, banking examples |
| **Life Lab overlay** | Independent living contexts |
| **Reporting templates** | Transcript supplements, government reports |

### 8.3 Activation Process

1. Legal review of country pack  
2. Configuration Studio publish  
3. Compliance rule set active  
4. Academy school enrollment opened for country (or waitlist)  
5. Family support and funding catalogs live  

---

## 9. Regional Configuration Model

### 9.1 Regional Scope

Regions operate **within** country profiles:

| Region Type | Examples |
|-------------|----------|
| **State / Province** | California, Ontario, Bavaria, New South Wales |
| **Territory** | Puerto Rico, Greenland |
| **Special administrative** | Hong Kong, Macau |
| **Military / diplomatic** | DoDEA regions, embassy-linked communities |

### 9.2 Regional Profile Schema (Conceptual)

```
RegionProfile
    ├── region_code
    ├── country_code              (parent)
    ├── region_name
    ├── region_type
    ├── additional_compliance_rules[]
    ├── graduation_pathway_overrides[]
    ├── funding_program_additions[]
    ├── assessment_requirements[]  (state tests where applicable)
    └── reporting_additions[]
```

### 9.3 Inheritance Rules

- Region inherits country defaults  
- Region may **add** requirements — not remove global invariants  
- Learner assigned `country_code` + `region_code` at enrollment  
- Military families: region may be **virtual** (e.g., `US-MIL-EU`) with dedicated resources  

---

## 10. Language Model

### 10.1 Language Layers

| Layer | Description |
|-------|-------------|
| **Platform UI** | Interface strings — full locale packs |
| **Instructional content** | Lessons, Playbook — per language where translated |
| **Academic content** | Domain-specific; Wilson remains English for WRS instruction |
| **Family Journey** | Parent-facing — family language preference |
| **Evidence / transcript** | Original language preserved; translations linked |
| **AI interaction** | User-selected interaction language within policy |

### 10.2 Locale Identifier

BCP 47 tags: `en-US`, `es-MX`, `fr-CA`, `ar-SA`, `zh-Hans-CN`, etc.

### 10.3 Fallback Chain

```
user_preference → org_default → country_default → platform_default (en)
```

### 10.4 Multilingual Learners

Profile supports:

- `primary_language`
- `instructional_languages[]`
- `ui_language`
- `family_communication_language`

**Rule:** Multilingual capability is **strength** — documented in Learning Profile (Doc 19), not deficit framing.

---

## 11. Curriculum Localization

### 11.1 Academy Way Global Core

Universal Learning Registry skills are **global competency definitions**. Localization applies to:

| Element | Localization |
|---------|--------------|
| **Examples** | RLM: local currency, tax, banking |
| **Performance tasks** | Local scenarios |
| **Earthology** | Local geography, government, history emphasis |
| **Life Lab** | Local housing, employment, civic norms |
| **Venture Lab** | Local business registration, market context |
| **LitLab** | Multilingual literature options where configured |
| **Wilson WRS** | Instruction in English; UI/parent materials translatable |

### 11.2 Overlay Model

```
ULR Skill (global)
    └── LocaleOverlay
            ├── localized_title (optional display)
            ├── localized_examples[]
            ├── localized_performance_task_refs[]
            └── jurisdiction_scope[]   (where overlay applies)
```

**Rule:** Skill ID and mastery criteria invariant; examples and tasks vary by locale.

### 11.3 Third-Party Curriculum

International partners may map **local curriculum standards** to ULR via Configuration Studio crosswalk — competency evidence remains in KEE.

---

## 12. Assessment Localization

| Aspect | Approach |
|--------|----------|
| **Instruments** | Translated where psychometrically validated; otherwise parallel forms |
| **Norms** | Benchmark comparisons use jurisdiction-appropriate norms when available |
| **MAP Growth** | International norms where applicable |
| **Performance tasks** | Localized scenarios; rubrics universal |
| **Accommodations** | Profile + jurisdiction rules |
| **Transcript supplements** | Local graduation equivalency statements |

Assessment Framework (Doc 21) methods carry `supported_locales[]` and `jurisdiction_validity[]`.

---

## 13. Funding Localization

| Aspect | Approach |
|--------|----------|
| **Catalog** | Per-country funding program registry (Doc C) |
| **Currency** | Display and invoice in local or selected currency |
| **Eligibility** | Rule engine — jurisdiction + family profile |
| **Scholarships** | Org and global scholarships with geographic scope |
| **Government supports** | Surfaced, not guaranteed — Family Journey pathways |
| **Tax documentation** | Country-specific receipt formats |

**Integration:** Wave 5.5 Funding Intelligence Platform consumes country/regional catalogs.

**Rule:** Platform surfaces opportunities — does not provide legal/tax advice.

---

## 14. Reporting Localization

| Report Type | Localization |
|-------------|--------------|
| **Mastery Transcript** | Multi-language reader's guide; metric + imperial optional |
| **Progress reports** | Locale date/number formatting |
| **Government submissions** | Region-specific export templates |
| **Portfolio** | Multilingual artifact metadata |
| **Graduation readiness** | Local pathway equivalency notes |

Reports reference **global evidence** with **local presentation layer**.

---

## 15. Timezone Philosophy

| Rule | Requirement |
|------|-------------|
| **Storage** | All timestamps UTC in platform kernel |
| **Display** | User/org timezone preference (IANA) |
| **Scheduling** | Scheduling Intelligence uses learner + teacher zones |
| **Global classes** | Session times shown in each participant's local time |
| **Deadlines** | Explicit timezone on every deadline |
| **No implicit EST** | Platform never assumes US Eastern for all users |

Academy Way virtual session rules (hour start, :50 end) apply in **learner's local context** unless cohort explicitly defined in UTC offset.

---

## 16. Currency Philosophy

| Rule | Requirement |
|------|-------------|
| **ISO 4217** | All currencies coded standard |
| **Multi-currency** | Tuition, scholarships, venture finance may display multiple |
| **RLM alignment** | Real-Life Math examples use learner's configured currency |
| **Exchange** | Historical rates for education only — not financial trading |
| **Precision** | Locale-aware decimal and grouping rules |
| **No USD-only** | USD may be org default — not platform lock |

---

## 17. Translation Philosophy

| Tier | Content | Process |
|------|---------|---------|
| **T1 Critical** | Legal, consent, safety | Professional human translation + review |
| **T2 Instructional** | Playbook, Family Journey | Human review of AI-assisted translation |
| **T3 UI** | Interface strings | CAT tools + glossary; human QA sample |
| **T4 Community** | Optional parent contributions | Moderated — not official without review |
| **T5 Dynamic** | AI chat, notifications | Real-time AI with glossary constraints |

**Glossary:** Academy Way terms (Personal Academic Journey, mastery levels) maintained per locale — consistent branding.

**Evidence:** Original language preserved; translations stored as linked records in KEE.

---

## 18. Accessibility Philosophy

| Principle | Global Application |
|-----------|-------------------|
| **WCAG 2.2 AA minimum** | Platform baseline |
| **Local law** | EN 301 549, AODA, etc. via compliance packs |
| **Multilingual accessibility** | Screen readers in user's UI language |
| **RTL support** | Arabic, Hebrew interface layouts |
| **Neurodiversity** | Constitution VI-D — global, not US-only framing |
| **Bandwidth** | Low-bandwidth modes for international connectivity |

Accessibility is **global by design** — not US ADA retrofit.

---

## 19. Related Constitutional Documents

| Document | Scope |
|----------|-------|
| **Document B** | Global Admissions Framework™ |
| **Document C** | Global Family Support Framework™ |
| **Document D** | Global Learning Framework™ |

---

## 20. Governance

| Rule | Requirement |
|------|-------------|
| **GEF-1** | No feature shipped with single-country hard-code without config path |
| **GEF-2** | Country pack requires legal review before activation |
| **GEF-3** | ULR skill IDs never forked per country |
| **GEF-4** | Localization overlays versioned in Configuration Studio |
| **GEF-5** | Global principle supersedes convenience defaults |
| **GEF-6** | Changes to this framework require Constitutional Amendment |

---

*End of Constitutional Document A — Global Education Framework™*
