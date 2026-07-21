# Calendar, Scheduling & Resource Management

AcademyOS RC5 — unified scheduling backbone for calendars, classes, meetings, staff availability, rooms, recurrence, resource reservations, and Meet provider adapters.

The existing Academic Operations module at `/dashboard/scheduling` remains intact. This platform sits alongside it and merges instructional sessions into calendar views.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `supabase/migrations/192_calendar_scheduling_platform.sql` |
| Core module | `src/lib/calendar/` |
| Meet adapter (stub) | `src/lib/calendar/meet.ts` via Workflow extension API |
| Dashboard | `/dashboard/calendar` (Day / Week / Month / Agenda) |
| Workflow actions | `create_calendar_event`, `cancel_calendar_event`, `reschedule_calendar_event` |
| Executive Intelligence | activity catalog keys below |
| Communications | reminder fan-out via `platform_communications` |

```
Create / Update Event
        │
        ▼
 Conflict engine (teacher / student / resource / availability)
        │
        ▼
 platform_calendar_events (+ exceptions for series edits)
        │
        ├── schedule reminders (24h / 1h / 15m)
        ├── optional Meet create (deferred)
        └── recordActivity → EI + Workflows
```

## Calendar model

### `platform_calendar_events`

First-class event entity with:

- Title, description, type, status  
- Start / end / timezone / all-day  
- Recurrence rule (daily / weekly / monthly / RRULE)  
- School, program, class, teacher, students[], family  
- Resource / room  
- Google Meet URL + provider + external id  
- Color, metadata, **audit_id**

### Event types

`class | meeting | parent_conference | iep | assessment | school_event | holiday | staff_meeting | training | reminder | workflow_scheduled`

### Related tables

- `platform_calendar_exceptions` — cancel / modify a single occurrence  
- `platform_calendar_resources` — rooms, labs, vehicles, equipment, devices  
- `platform_calendar_reservations` — resource bookings  
- `platform_staff_availability` — working hours, breaks, PTO, holidays, blocked  
- `platform_calendar_reminders` — scheduled reminder offsets

## Recurrence

`expandOccurrences()` in `src/lib/calendar/recurrence.ts` supports:

- Tokens: `daily`, `weekly`, `monthly`  
- RRULE: `FREQ=DAILY|WEEKLY|MONTHLY` with `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`

Edits:

| Scope | Behavior |
|-------|----------|
| Series | Updates master row; expansions follow new rule |
| Single | Writes `platform_calendar_exceptions` (cancel or modify) |

## Conflict resolution

`detectCalendarConflicts()` blocks create/update when:

1. **Teacher** already has an overlapping event  
2. **Student** is double-booked  
3. **Resource** is reserved in the same window  
4. **Availability** marks the teacher as PTO / holiday / blocked / outside working hours

Conflicts emit `resource.conflict` to Executive Intelligence (even when create is rejected).

## Resource scheduling

Resources are typed (`room | lab | vehicle | equipment | device | other`).  
Reservations and events that reference `resource_id` share the same conflict window.

## Availability rules

Teachers (employees) store:

- Weekly working hours (`day_of_week` + `start_time`/`end_time`)  
- Breaks  
- Absolute PTO / holiday / blocked ranges  

`findTeacherAvailabilitySlots()` scans a day for open meeting windows (used by meeting scheduler helpers).

## Family & student calendars

- `getStudentSchedule(studentId, from, to)` — classes, meetings, assessments, events  
- `getFamilyCalendar(familyId, from, to)` — aggregates family-tagged events + every enrolled student’s schedule  

Dashboard filters: `?studentId=`, `?familyId=`, `?teacherId=`, `?resourceId=`.

## Workflow integration

Workflow Engine actions (RC4):

| Action | Effect |
|--------|--------|
| `create_calendar_event` | Calls `createCalendarEvent` |
| `cancel_calendar_event` | Calls `cancelCalendarEvent` |
| `reschedule_calendar_event` | Calls `updateCalendarEvent` with new start/end |

Workflows can also emit reminders via Communications after calendar create.

## Extension interfaces (Google Meet)

No live Google Meet integration in RC5.

`src/lib/calendar/meet.ts` registers `google_meet` on the Workflow **extension API**:

- `create_meeting`  
- `update_meeting`  
- `cancel_meeting`  
- Join URL returned when a future adapter is configured (`isConfigured()` currently `false`)

## Notifications

Default reminder offsets: **24 hours**, **1 hour**, **15 minutes**.

`processDueCalendarReminders()` inserts `platform_communications` rows with `type: reminder` and marks reminder rows sent/failed.

## Executive Intelligence events

| Event | When |
|-------|------|
| `calendar.created` | Event created |
| `calendar.updated` | Event updated |
| `calendar.cancelled` | Event cancelled |
| `meeting.scheduled` | Meeting-like types |
| `class.scheduled` | Class type |
| `room.reserved` | Resource reservation |
| `resource.conflict` | Conflict blocked a write |

These feed Timeline, Knowledge Graph, and Operational Loop via `recordActivity`.

## Permissions

| Role | Access |
|------|--------|
| Founder / CEO | Full |
| School Leader | School calendar management |
| Teachers | Own schedule / classes / meetings (edit allowed; scoped in UI/filters) |
| Admissions | Admissions meeting types |
| Parents | Family calendar (view) |
| Students | Personal schedule (view) |

Helpers: `canViewCalendar`, `canEditCalendar`, `canManageSchoolCalendar`, `canManageAdmissionsCalendar`.

## Views

`/dashboard/calendar` supports:

- **Day** / **Week** / **Month** / **Agenda**  
- Merges `instructional_sessions` as synthetic class occurrences (SIS)  
- Create event / resource / availability panels for editors  

## Acceptance (RC5)

- Calendar is a first-class platform module  
- Recurring events + exceptions  
- Teacher / student / resource conflict prevention  
- Family calendar aggregation  
- Workflow create / cancel / reschedule  
- Google Meet provider interface only  
- EI scheduling events registered  
- Existing Academic Operations (`/dashboard/scheduling`) unchanged  
