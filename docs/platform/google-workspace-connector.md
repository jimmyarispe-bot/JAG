# Google Workspace Connector

**Sprint:** 074  
**Version:** 1.1.0  
**Catalog id:** `google`  
**Source system:** `google-workspace`  
**Package:** `src/lib/platform/integrations/connectors/google-workspace/`

## Mission

First production connector on the Integration Platform Core (Sprint 073). Google Workspace remains the system of record; JAG syncs **metadata only** by default and never feeds raw Google objects into intelligence or the knowledge graph.

## Package structure

```
google-workspace/
├── auth/            # OAuth 2.0 install / refresh / disconnect / reconnect
├── gmail/           # Messages, threads, labels, attachments
├── calendar/        # Events, attendees, rooms, recurrence, meeting links
├── drive/           # Files, folders, permissions, ownership
├── docs/            # Created / updated / shared
├── sheets/
├── slides/
├── contacts/        # People, organizations
├── meet/            # Participants, duration, start, end
├── directory/       # Users, groups, OUs
├── mapping/         # Canonical + knowledge graph (Person, Meeting, …)
├── normalization/   # Privacy scrub + domain attributes
├── services/        # Client, store, feed, events, ECC widgets
├── registry.ts      # Platform Core registration
├── platform-connector.ts
├── connector.ts     # B4 Connector compatibility
└── index.ts
```

## Authentication

OAuth 2.0 via Sprint 073 helpers (`buildOAuthAuthorizeUrl`, `IntegrationAuthFramework` strategy `oauth2`).

| Capability | API |
|------------|-----|
| Install | `authenticate(instanceId)` |
| Refresh | `refreshAuthentication(instanceId)` |
| Disconnect | `disconnect(instanceId)` |
| Reconnect | `reconnectGoogleWorkspace(connector, instanceId)` |

## Domains & events

| Domain | Normalized | Events |
|--------|------------|--------|
| Gmail | Messages, threads, labels, attachments | `EMAIL_RECEIVED`, `EMAIL_SENT`, `EMAIL_UPDATED` |
| Calendar | Events, attendees, rooms, recurrence, meeting links | `MEETING_CREATED`, `MEETING_UPDATED`, `MEETING_COMPLETED` |
| Drive | Files, folders, permissions, ownership | `DOCUMENT_*` |
| Docs / Sheets / Slides | Created, updated, shared | `DOCUMENT_CREATED`, `DOCUMENT_CHANGED`, `DOCUMENT_SHARED` |
| Contacts | People, organizations | `CONTACT_UPSERTED` |
| Meet | Participants, duration, start, end | `MEETING_*` |
| Directory | Users, groups, OUs | `USER_CREATED` |

## Knowledge graph

Canonical kinds: **Person**, **Meeting**, **Communication**, **Document**, **Task**, **Organization**.

Built by `buildGoogleWorkspaceGraph()` from scrubbed canonical entities only.

## ECC widgets

| Widget | Kind |
|--------|------|
| Recent Meetings | `recent_meetings` |
| Calendar Summary | `calendar_summary` |
| Communication Pulse | `communication_pulse` |
| Shared Documents | `shared_documents` |
| Collaboration Activity | `collaboration_activity` |

UI: `src/components/integrations/{RecentMeetings,CalendarSummary,CommunicationPulse,SharedDocuments,CollaborationActivity}.tsx`

## Registration

```ts
import {
  createIntegrationPlatformCore,
  registerGoogleWorkspacePlatformConnector,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
registerGoogleWorkspacePlatformConnector(platform);
await platform.syncNow("google", "google-org-1", "full");
```

Also registered automatically when `createOiosOperatingSystem()` wires Integrations (not on the intelligence DAG).

## Privacy

Default: no email bodies, no document/sheet/slide contents. Org settings may opt in via `storeEmailBodies` / `storeDocumentContents`.
