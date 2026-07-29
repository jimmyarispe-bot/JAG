# Education Capability Pack Registry

**Program:** D5.0  
**Package:** `src/lib/domains/education/capabilities`

## Purpose

Make Education Capability Packs first-class domain objects: discoverable, versioned, and introspectable.

This registry **does not**:

- Modify JAG Core, Runtime, or Domain SDK  
- Change Graph, Planner, or contributor implementations  
- Touch UI or database  

## Registered packs

| Pack | Id |
|------|----|
| Student Lifecycle | `education.capability_pack.student_lifecycle` |
| Student Support | `education.capability_pack.student_support` |

## Discovery APIs

```ts
import {
  listCapabilityPacks,
  getCapabilityPack,
  listContributors,
  listPlannerIntents,
  validateEducationCapabilityRegistry,
} from "@/lib/domains/education";

listCapabilityPacks();
getCapabilityPack("education.capability_pack.student_lifecycle");
listContributors("education.capability_pack.student_support");
listPlannerIntents("education.capability_pack.student_support");
validateEducationCapabilityRegistry();
```

## Docs

- [`docs/domains/education/capabilities/00_OVERVIEW.md`](../../../../docs/domains/education/capabilities/00_OVERVIEW.md)
- [`01_STUDENT_LIFECYCLE.md`](../../../../docs/domains/education/capabilities/01_STUDENT_LIFECYCLE.md)
- [`02_STUDENT_SUPPORT.md`](../../../../docs/domains/education/capabilities/02_STUDENT_SUPPORT.md)
