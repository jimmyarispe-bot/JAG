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
| `employee` | **Registered** | `/dashboard/hr/employees/{id}` |
| `family` | **Registered** | `/dashboard/families/{id}` |
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

## Student sections (24)

Overview (pinned) + grouped sections across Core, Learning, Student Life, Support, Financial, Operations, Intelligence, and System.

## Employee sections (28)

Overview (pinned) + HR, employment, communication (notes, activity), and system sections.

## Family sections (19)

Overview (pinned) + relationships, support, financial, communication, operations, student life, intelligence, and system sections. All 19 sections ship with native lazy-loaded modules. Resolves guardians and students through the Platform Relationship Engine.

## Build-time validation

Registry integrity is validated during `npm run build` via `validatePlatformRegistry()`:

- Duplicate section keys (tracked at registration time)
- Missing section module registrations
- Orphaned section modules
- Invalid navigation groups

See `docs/architecture/platform-testing-strategy.md` for the full testing approach.

## Developer diagnostics

Read-only registry audit at `/dashboard/platform/diagnostics` (requires `configuration.admin`, `configuration.manage`, or `certification.admin`).

Displays registered kinds, sections, section modules, validation findings, activity catalog, relationship types, service health, and installed modules.

## API usage (Phase 3+)

```typescript
import "@/lib/platform/profile"; // ensures student registration
import { resolveStudentProfile } from "@/lib/students/profile";

const profile = await resolveStudentProfile(supabase, studentId, {
  section: "overview",
});
// profile.navigation, profile.viewTabs, profile.activeSectionDef
```
