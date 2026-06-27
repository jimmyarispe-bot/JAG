# Platform Profile Registry

Entity-agnostic profile framework for AcademyOS. The **Student Profile** is the first registered implementation; future kinds reuse the same architecture.

## Architecture

```
src/lib/platform/profile/          # Generic framework (entity-agnostic)
  types.ts                           # ProfileKind, ProfileEnvelopeBase, section defs
  registry.ts                        # registerProfileKind, registerProfileSection
  resolver.ts                        # resolveProfile, loadActiveSectionData
  envelope.ts                        # buildProfileEnvelopeBase, module loading
  navigation.ts                      # Grouped navigation model
  access.ts                          # Permission + module gating
  index.ts

src/lib/students/profile/            # First implementation: Student
  kind.ts                            # ProfileKindDefinition
  sections.ts                        # 23 section definitions + loadData
  envelope.ts                        # buildStudentProfileEnvelope
  register.ts                        # Side-effect registration
  index.ts                           # resolveStudentProfile()
```

## Registered profile kinds

| Kind | Status | Base path |
|------|--------|-----------|
| `student` | **Registered** | `/dashboard/students/{id}` |
| `employee` | Planned | `/dashboard/hr/employees/{id}` |
| `family` | Planned | TBD |
| `school` | Planned | TBD |
| `organization` | Planned | TBD |
| `scholarship` | Planned | TBD |
| `grant` | Planned | TBD |
| `vendor` | Planned | TBD |
| `facility` | Planned | TBD |

## Adding a new profile kind

1. Create `src/lib/{domain}/profile/kind.ts` with `ProfileKindDefinition`
2. Create `sections.ts` with `ProfileSectionDefinition[]`
3. Create `envelope.ts` with kind-specific envelope builder
4. Create `register.ts` that calls `registerProfileKind` + `registerProfileSection`
5. Import register module from `platform/profile/index.ts` or domain entry

## URL contract

- Canonical: `{basePath}/{entityId}?section={key}`
- Legacy (student): `?tab=` redirects via `legacySectionRedirects`

## Section gating

Each section declares:

- `moduleKey` — must be enabled in Configuration Studio (except `platform`)
- `permissions` — user must hold **any** listed permission
- `status` — `live` | `partial` | `placeholder`

## Student sections (23)

Overview (pinned) + 22 grouped sections across Core, Learning, Student Life, Support, Financial, Operations, Intelligence, and System.

## API usage (Phase 3+)

```typescript
import "@/lib/platform/profile"; // ensures student registration
import { resolveStudentProfile } from "@/lib/students/profile";

const profile = await resolveStudentProfile(supabase, studentId, {
  section: "overview",
});
// profile.navigation, profile.viewTabs, profile.activeSectionDef
```
