# Google Workspace Production Connector — D5

**Status:** Complete  
**Location:** `src/lib/platform/integrations/connectors/google-workspace/`  
**Catalog id:** `google` (Integration Center / phase-1 continuity)  
**Source system:** `google-workspace`  

## Principle

Google Workspace remains the productivity system of record.  
JAG synchronizes **metadata only** by default, normalizes, correlates, and reasons — it does not replace Gmail / Drive / Calendar CRUD.

## Privacy (default)

| Content | Stored by default? |
|---------|--------------------|
| Email bodies / HTML / raw | **No** |
| Document / sheet cell contents | **No** |
| Subjects, labels, attendees, ownership, sharing, timestamps | Yes |

Org settings may opt in: `storeEmailBodies`, `storeDocumentContents`. Normalize scrubbing enforces policy.

## Authentication

| Capability | Support |
|------------|---------|
| OAuth 2.0 | Yes |
| Admin consent | `consentType: "admin"` |
| User consent | `consentType: "user"` |
| Domain selection | Domains listed at authenticate |
| Token refresh | `refreshToken()` |
| Disconnect / reconnect | Clears cache; resume + authenticate + sync |

Helpers: `googleWorkspaceOAuthConfig()`, `GOOGLE_WORKSPACE_OAUTH_SCOPES` (metadata-oriented scopes).

## Entities synchronized

Gmail (message / label / thread metadata), Calendar events, Drive files & folders, Docs & Sheets metadata, Meet, Tasks, Directory users / groups / OUs.

## Normalization

Every accepted record includes: internal id, external id, organization id, `sourceSystem: "google-workspace"`, sync timestamp, version, workspace domain, user id.

## Cross-system correlation

`correlateGoogleWorkspace()` links calendar/tasks to:

- QuickBooks budget variance
- Plaid cash / grant deadlines
- Executive board brief
- AcademyOS school calendar
- Square commerce context on the timeline

## ECC widgets

Executive Brief, calendar / meeting load, upcoming decisions, communication activity, collaboration, timeline, productivity indicators — Live / Cached / Synthetic badges via `googleWorkspaceDataMode()`.

## Tests

`tests/unit/integrations/google-workspace/connector.test.ts`

## Docs

- This file
- `docs/product/D5_IMPLEMENTATION_SUMMARY.md`
