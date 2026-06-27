# AcademyOS Platform Services

Phase 2 cross-cutting services used by every module. Student Profile (B-01) is the first full consumer.

## Services

| Service | Path | Purpose |
|---------|------|---------|
| **Activity Engine** | `src/lib/platform/activity/` | Single write path for all state-change events |
| **Relationship Engine** | `src/lib/platform/relationships/` | Universal entity relationships |
| **Tagging System** | `src/lib/platform/tags/` | Org-scoped reusable tags on any entity |
| **Notes System** | `src/lib/platform/notes/` | Polymorphic notes with visibility and mentions |

Barrel export: `src/lib/platform/services/index.ts`

## Database

- `132_phase2_platform_services_foundation.sql` — tables and seeds
- `133_phase2_platform_services_rls.sql` — RLS policies

## Activity Engine

### Write

```typescript
import { recordActivity } from "@/lib/platform/activity";

await recordActivity(supabase, {
  eventType: "student.created",
  moduleKey: "sis",
  entityType: "student",
  entityId: studentId,
  title: "Student created",
  organizationId,
  schoolId,
  studentId,
  actorUserId,
});
```

- Validates against `ACTIVITY_EVENT_CATALOG`
- Dual-writes to legacy `platform_timeline_events`
- Fans out to Integration Hub `ihub_events`

### Read

```typescript
import { getStudentActivityFeed, getAuditActivity } from "@/lib/platform/activity";

const timeline = await getStudentActivityFeed(supabase, studentId);
const audit = await getAuditActivity(supabase, { studentId });
```

## Relationship Engine

### Types

20 system relationship types seeded in `platform_relationship_type_definitions` (student.guardian, student.teacher, school.organization, etc.).

### Write

```typescript
import { createRelationship, upsertPrimaryRelationship } from "@/lib/platform/relationships";

await createRelationship(supabase, {
  organizationId,
  relationshipType: "student.teacher",
  fromEntityType: "student",
  fromEntityId: studentId,
  toEntityType: "employee",
  toEntityId: employeeId,
  studentId,
});
```

Student mutations auto-sync via `src/lib/students/platform-sync.ts`.

## Tagging System

- System tags seeded per org: IEP, ESA, Virtual, High Priority, etc.
- Apply: `applyTags()`, `applyTagsBySlug()`, `removeTag()`
- Query: `getEntityTags()`, `findEntitiesByTags()`

## Notes System

- Create: `createNote()` with category, visibility, mentions, attachments
- Query: `getEntityNotes()`, `getStudentNotes()`, `getPinnedNotes()`
- Restricted notes use `platform_note_visibility_grants`

## Module integration contract

Every server action that mutates entity state must:

1. Call `recordActivity()` with a catalog event type
2. Use `createRelationship()` instead of ad-hoc join tables where appropriate
3. Use `applyTags()` / `createNote()` instead of module-specific stores

## Legacy compatibility

- `writeTimelineEvent()` delegates to `recordActivity()`
- `aggregateStudentTimeline()` will migrate to Activity Engine in B-01c
