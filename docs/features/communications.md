# Communications & Engagement Platform

AcademyOS RC3 — centralized communications with a complete audit trail. External Gmail / Twilio / Calendar integrations are abstracted and deferred.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `supabase/migrations/190_communications_engagement_platform.sql` |
| Core module | `src/lib/communications/` |
| Provider adapters (stubs) | `src/lib/communications/providers/` |
| Dashboard UI | `/dashboard/communications` |
| Notification Center | Top nav via `NotificationCenter` |
| Family / Student timelines | Profile Communications sections |
| Executive Intelligence | `recordActivity` + activity catalog |

### Data model

**`platform_communications`** — first-class communication entity  
Fields: subject, body (text/html), type, direction, priority, sender, related student/family/school, status, scheduled/sent/delivered/read timestamps, tags, metadata, **`audit_id`** (unique).

Types: `email | sms | portal | call | meeting | announcement | notification | reminder`  
Statuses: `draft | scheduled | queued | sent | delivered | read | failed | archived`

Related tables:

- `platform_communication_recipients`
- `platform_communication_attachments` (versioned)
- `platform_communication_templates`
- `platform_announcements`
- `platform_phone_call_logs`
- `platform_meeting_logs`
- `platform_in_app_notifications`

## Permissions

| Role | Access |
|------|--------|
| CEO / Founder | Full |
| School Leader | Full school access |
| Admissions | Compose for students/families; no org-wide announce |
| Teachers | Compose for their students/classes |
| Parents | View own family communications |
| Students | View own communications |

Helpers: `canViewCommunications`, `canComposeCommunications`, `canManageCommunications`, `canAnnounceSchoolWide`.

## Timeline behavior

Family and Student profile **Communications** sections load:

1. `platform_communications` (newest first) — emails, SMS, portal, calls, meetings, announcements
2. Existing portal conversations / instructional meetings (family)
3. Platform activity events with `classification: "communication"`

Compose deep-links: `/dashboard/communications/compose?familyId=…` or `?studentId=…`.

## Scheduling

- One-time: set `scheduled_for` → status `scheduled`
- Recurring metadata: `schedule_rrule` (iCal RRULE string stored for future worker)
- Immediate send: `composeAndSend` → `queued` then provider adapter + `sent`

A future job worker will process due scheduled rows; infrastructure and status model are in place now.

## Templates

Seeded categories: Welcome, Enrollment, Missing Documents, Scholarship Reminder, Tuition Reminder, Attendance, Schedule Change, Behavior, Progress Update, Graduation.

Merge variables:

- `{{StudentName}}`
- `{{GuardianName}}`
- `{{School}}`
- `{{Teacher}}`
- `{{Program}}`

Preview via `renderTemplate` / compose Preview action. Usage increments `usage_count` and emits `template.used`.

## Notification flow

1. Events create rows in `platform_in_app_notifications`
2. Dashboard layout merges platform notifications + admissions staff notifications
3. Top nav **Notification Center** shows unread badge, open links, mark-as-read

Examples: student added, scholarship approved, tuition overdue, missing document, meeting reminder, parent replied (via `createInAppNotification`).

## Phone calls & meetings

- **Phone:** direction, duration, notes, follow-up, outcome → linked communication + `phonecall.logged`
- **Meetings:** parent conference / IEP / scholarship / staff → participants, notes, decisions, action items → `meeting.logged`

## Provider adapters (deferred)

| Adapter | Status |
|---------|--------|
| Gmail | Stub |
| Outlook | Stub |
| Twilio SMS | Stub |
| Parent Portal | Records in-app |
| Push | Stub |

`getAdapterForChannel()` selects the adapter; external sends return `deferred: true` until integration sprints.

## Executive Intelligence events

| Event | When |
|-------|------|
| `communication.created` | Draft / create |
| `communication.sent` | Send success |
| `communication.failed` | Send failure |
| `communication.read` | Marked read |
| `communication.archived` | Archive |
| `template.created` | New template |
| `template.used` | Template applied |
| `announcement.published` | Publish |
| `meeting.logged` | Meeting saved |
| `phonecall.logged` | Call saved |

Feeds Executive Timeline, Knowledge Graph, Operational Loop, and Audit History via `platform_activity_events`.

## Acceptance criteria

- [x] Communications are first-class entities with `audit_id`
- [x] Family and Student timelines show communication history
- [x] Templates support merge variables + preview
- [x] Scheduling infrastructure (`scheduled` + RRULE metadata)
- [x] Notification Center in top navigation
- [x] Phone calls and meetings logged
- [x] Executive Intelligence receives lifecycle events
- [x] External providers abstracted (stubs only)
- [x] Existing AcademyOS modules unchanged in behavior
