# DOCUMENT 107 — The JAG™ Brand Architecture™

**The JAG™ — Enterprise Foundational Governance**  
**Status:** Permanent Brand Architecture — No Implementation  
**Version:** 1.0  
**Effective:** June 28, 2026  
**Parent:** Document 106 — Enterprise Framework™  
**Related:** Document 58 — Intellectual Property Framework™

---

## 1. Charter

**The JAG Brand Architecture™** defines the **permanent hierarchy of brands, marks, naming conventions, and usage rules** across all enterprise divisions.

Consistent branding protects **trust, quality, and IP** while enabling **division autonomy** within master brand governance.

---

## 2. Brand Hierarchy Overview

```
The JAG™                          ← Master Brand (enterprise)
    ├── The Academy Way™           ← Philosophy Brand
    ├── AcademyOS                  ← Technology Brand
    ├── The Academy Schools™       ← Delivery Brand Family
    │       ├── The Academy Virtual™
    │       └── The Academy High School™
    ├── The JAG Knowledge System™  ← Knowledge Brand
    ├── The JAG Research Institute™
    ├── The JAG Professional Learning Institute™
    ├── The JAG Certification Institute™
    ├── The JAG Publications™
    ├── The JAG Global™
    └── [Future Division Brands]
```

---

## 3. Master Brand

### 3.1 The JAG™

| Attribute | Standard |
|-----------|----------|
| **Legal name** | The JAG™ (trademark) |
| **Descriptor** | *Transforming learning through knowledge, evidence, and mastery* |
| **Usage** | Enterprise communications · IP notices · governance documents · partner master agreements |
| **Symbol** | JAG wordmark + optional enterprise mark |
| **TM notice** | The JAG™ — All Rights Reserved (first prominent use per document/publication) |

**Master brand represents the whole enterprise.** Sub-brands never replace The JAG in IP ownership statements.

---

## 4. Sub-Brands

| Sub-Brand | Type | Relationship to Master |
|-----------|------|------------------------|
| **The Academy Way™** | Philosophy | Endorsed by The JAG; appears as "The Academy Way™, an educational philosophy of The JAG™" |
| **AcademyOS** | Technology product | "Powered by The JAG Knowledge System™" |
| **The Academy Schools™** | Operating brand family | "An Academy School implementing The Academy Way™" |
| **The JAG Knowledge System™** | Knowledge estate | "A division of The JAG™" |
| **The JAG Research Institute™** | Research division | Short form: JAG-RI |
| **The JAG Professional Learning Institute™** | PL division | Short form: JAG-PLI |
| **The JAG Certification Institute™** | Credential division | Short form: JAG-CI |
| **The JAG Publications™** | Publishing division | Imprint on all JAG books/courses |
| **The JAG Global™** | International division | Locale-specific co-branding allowed |

---

## 5. Programs

Programs are **named learning or operational initiatives** — not divisions.

| Program Key | Brand Treatment | Example |
|-------------|-----------------|---------|
| `program.paj` | Personal Academic Journey™ | Always with The Academy Way attribution |
| `program.family_journey` | Family Journey™ | Parent-facing |
| `program.gre` | Graduation Readiness Engine™ | Internal + transcript |
| `program.ulr` | Universal Learning Registry™ | Technical — AcademyOS + JKS |
| `program.rlp` | Reference Learning Package™ | JKS product pattern |
| `program.clqs` | Concept Library Quality Standard™ | Governance |
| `program.wilson_framework` | Wilson Framework (metadata) | **Never** imply Wilson endorsement of JAG content |

**Naming:** `{Program Name}™` on first reference; TM optional on subsequent reference within same document.

---

## 6. Products

| Product | Brand | Owner Entity |
|---------|-------|--------------|
| **AcademyOS Platform** | AcademyOS | Platform entity |
| **Configuration Studio** | AcademyOS | Platform entity |
| **JAG Knowledge Registry** | The JAG Knowledge System™ | The JAG |
| **Reference Learning Package** | The JAG Knowledge System™ | The JAG |
| **Handbook Editions** | The JAG Publications™ | The JAG |
| **Parent / Teacher Guides** | The JAG Knowledge System™ | The JAG |
| **Certification Exams** | The JAG Certification Institute™ | The JAG |
| **Research Reports** | The JAG Research Institute™ | The JAG |

**Product naming pattern:** `{Descriptive Name}™` + division attribution in subtitle.

---

## 7. Services

| Service | Brand Treatment |
|---------|-----------------|
| **School implementation** | The Academy Schools™ + AcademyOS |
| **Partner licensing** | The JAG Global™ |
| **Professional learning delivery** | JAG-PLI |
| **Certification administration** | JAG-CI |
| **Consulting (future)** | The JAG Consulting™ |
| **Research partnerships** | JAG-RI |

**Service descriptor pattern:** `[Service Name] — a service of The JAG™`

---

## 8. Technology

| Layer | Brand | Co-brand Rule |
|-------|-------|---------------|
| Platform | AcademyOS | May not use "The JAG" as product name |
| Knowledge consumption | "Powered by The JAG Knowledge System™" | Required in partner-facing platform UI |
| AI Coach | AcademyOS AI Coach | "Guided by The Academy Way™" |
| Badges | JAG-CI certification marks | Separate mark system |

**Technology naming:** camelCase or PascalCase for code identifiers; Title Case + ™ for user-facing features.

---

## 9. Knowledge Assets

| Asset Type | Naming Pattern | Example |
|------------|----------------|---------|
| Concept Library | `{Concept Name} Concept Library™` | Phonological Awareness Concept Library |
| Competency Library | `{Domain} Competency Library™` | Foundational Phonological Awareness Competency Library |
| Teacher Guide | The JAG™ Teacher Guide™: {Topic} | Doc 99 |
| Parent Guide | The JAG™ Parent Guide™: {Topic} | Doc 100 |
| Document numbering | `DOCUMENT {n} — {Title}™` | DOCUMENT 98 |
| Asset keys | `jag.{type}.{domain}.{slug}.v{semver}` | `jag.guide.teacher.sl.pa.v1.0.0` |
| Competency keys | `AW-{DOMAIN}-{SEQ}-v{semver}` | `AW-SL-PA-001-v1.0.0` |

**Rule:** Knowledge assets carry JKS branding; Academy Way alignment stated in metadata — not separate brand on every asset.

---

## 10. Research

| Output | Brand |
|--------|-------|
| Peer-reviewed papers | Author names + "The JAG Research Institute™" affiliation |
| Internal reports | JAG-RI report numbering `JAG-RI-{YYYY}-{SEQ}` |
| Research summaries in JKS | `research.{domain}.{topic}` keys |
| Public-facing | The JAG Research Institute™ logo on cover |

**Citation format:** *The JAG Research Institute™.* (Year). *Title.* The JAG Publications™.

---

## 11. Schools

| School Brand | Usage |
|--------------|-------|
| **The Academy Schools™** | Umbrella for all direct-operated schools |
| **The Academy Virtual™** | Online school sub-brand |
| **The Academy High School™** | Secondary sub-brand |
| **Partner schools** | `{Partner Name}` + "Licensed Academy Way Partner of The JAG Global™" |

**Partner rule:** Partners may not use "The Academy Virtual" or "The Academy High School" names without franchise agreement.

---

## 12. Publications

| Imprint | Use |
|---------|-----|
| **The JAG Publications™** | Primary imprint — all consumer/professional print and digital |
| **Academy Way Press** | Optional consumer-friendly imprint for parent books |
| **JAG-RI Academic** | Research monographs and white papers |

**ISBN blocks:** Registered to The JAG Publications™ entity.

---

## 13. Certification Marks

| Mark | Issuer | Display |
|------|--------|---------|
| **JAG Certified Educator™** | JAG-CI | Badge + cert number |
| **JAG Structured Literacy Certified™** | JAG-CI | Domain-specific |
| **JAG Academy Way Leader™** | JAG-CI | Leadership pathway |
| **Microcredential badges** | JAG-CI | Digital — AcademyOS + LinkedIn metadata |

**Mark rules:**

- Display only while credential valid  
- No modification of mark colors or proportions  
- Expired credentials — remove public display within 30 days  
- Misrepresentation is trademark violation  

---

## 14. Trademark Usage

### 14.1 General Rules

| Rule | Requirement |
|------|-------------|
| **First use** | Full name + ™ in first prominent appearance per document/page |
| **Subsequent** | Short form permitted after first full reference |
| **Nominative use** | Partners may reference The JAG marks to describe licensed relationship |
| **No genericide** | Do not use JAG marks as verbs or generic nouns |
| **Co-branding** | JAG mark equal or dominant to partner mark in licensed materials |
| **Wilson** | Wilson® is Wilson Language Training property — never imply JAG ownership |

### 14.2 Required Notices

**Documents:**
```
The JAG™ — All Rights Reserved.
The Academy Way™ is an educational philosophy of The JAG™.
AcademyOS consumes The JAG Knowledge System™ under license.
```

**Software footer:**
```
© {year} AcademyOS · Knowledge © The JAG™
```

**Publications copyright page:**
```
Copyright © {year} The JAG Publications™, a division of The JAG™.
All rights reserved. No part of this publication may be reproduced without license.
```

### 14.3 Prohibited Uses

- Implying Wilson endorsement of JAG-authored content  
- Partner use of JAG marks after license termination  
- Certification marks without valid credential  
- "AcademyOS" as enterprise name for knowledge IP ownership statements  
- Removing TM from governance documents  

---

## 15. Naming Standards

### 15.1 Document Titles

```
DOCUMENT {number} — {Full Title}™
```

Optional subtitle after em dash for scope.

### 15.2 Registry Keys

| Namespace | Pattern |
|-----------|---------|
| Enterprise division | `jag.division.{key}` |
| Knowledge asset | `jag.{class}.{domain}.{slug}` |
| PL pathway | `pl.{audience}.{pathway}` |
| Certification | `cert.{domain}.{name}` |
| Metric | `metrics.{domain}.{name}` |
| Brand | `brand.{level}.{key}` |

### 15.3 Prohibited Names

- Names confusingly similar to Wilson® products  
- "JAG OS" for knowledge (use AcademyOS for platform, JKS for knowledge)  
- Unregistered division names without Document 106 amendment  

---

## 16. Logo Hierarchy

| Tier | Mark | Usage |
|------|------|-------|
| **1** | The JAG™ master wordmark | Enterprise · governance · annual report |
| **2** | Division logos | JKS · JRI · JPLI · JCI · Publications · Global |
| **3** | Product logos | AcademyOS |
| **4** | School logos | Academy Virtual · Academy HS |
| **5** | Program icons | PAJ · Family Journey — UI icons not standalone logos |
| **6** | Certification badges | Digital credentials |

**Clear space:** Minimum height of "J" around master wordmark.  
**Minimum size:** Master wordmark 120px digital / 1 inch print.  
**Color:** Primary palette defined in Brand Guidelines supplement (future design asset — not governance doc).

---

## 17. Governance

| Change Type | Authority |
|-------------|-----------|
| New sub-brand | Enterprise Leadership + Document 106 amendment |
| New certification mark | JAG-CI + trademark counsel |
| MAJOR naming change | Editorial Board + Document 107 version bump |
| Partner co-brand template | JAG Global + Legal |

**Asset key:** `jag.brand.architecture.v1.0.0`

---

*End of Document 107 — The JAG™ Brand Architecture™*

*The JAG™ — All Rights Reserved*
