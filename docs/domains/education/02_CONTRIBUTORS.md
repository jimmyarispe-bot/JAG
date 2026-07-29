# 02 — Education Contributors

All contributors are **placeholders**. They satisfy Runtime contracts so registration works; they do not implement Education workflows.

---

## Registered contributors

| Id | Kind | Behavior in D1 |
|----|------|----------------|
| `education.context` | Context | `discover()` → `[]` |
| `education.intent` | Intent | Catalog declared; `detect()` → `[]` |
| `education.cognition` | Cognition | `gatherEvidence()` → `[]`; no recommend |
| `education.experience` | Experience | Empty widgets / briefing / nav |
| `education.action` | Action | Catalog declared; `execute` → `skipped` |
| `education.evidence` | Evidence | `collect` / `publish` → `[]` |
| `education.memory` | Memory | `publish` → `[]` |
| `education.twin` | Twin | `publish` → `[]` |

---

## Contracts (non-executable)

| Module | Declares |
|--------|----------|
| `context/contracts` | School · Campus · Term · Program · Class · Session · Student · Family · Teacher |
| `intent/contracts` | Teach · Learn · Assess · Enroll · Support · Communicate · Plan · Review |
| `actions/contracts` | Approve Enrollment · Schedule Session · Record Attendance · Publish Progress |
| `cognition/contracts` | Provider interface + scopes (no algorithms) |
| `experience/contracts` | Fragment id tokens (no React) |
| `evidence/contracts` | Evidence source tokens |
| `memory/contracts` | Memory kind tokens |
| `twin/contracts` | Twin entity type tokens |

---

## Factory

```ts
import { createEducationContributors } from "@/lib/domains/education";

const contributors = createEducationContributors();
```
