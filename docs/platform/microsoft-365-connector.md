# Microsoft 365 Connector

**Sprint:** 075  
**Version:** 1.0.0  
**Catalog id:** `microsoft`  
**Source system:** `microsoft-365`  
**Package:** `src/lib/platform/integrations/connectors/microsoft-365/`

## Mission

Second production connector on the Integration Platform Core. Maps Outlook / Calendar / OneDrive / SharePoint / Teams into **exactly the same canonical entities as Google Workspace**, so Copilot never needs to know whether a meeting originated in Outlook or Google Calendar.

## Package structure

```
microsoft-365/
├── auth/
├── outlook/
├── calendar/
├── onedrive/
├── sharepoint/
├── teams/
├── people/
├── groups/
├── mapping/
├── normalization/
├── services/          # includes Unified Communication Dashboard
├── registry.ts
├── platform-connector.ts
├── connector.ts
└── index.ts
```

## Canonical parity (Google ≡ Microsoft)

| Object | Canonical type | KG kind |
|--------|----------------|---------|
| Mail / Chat | `comms.message` | Communication |
| Calendar event | `comms.event` | Meeting |
| Teams meeting | `comms.meeting` | Meeting |
| OneDrive / SharePoint file | `document.file` | Document |
| Contact / User | `person.contact` / `person.user` | Person |
| Team / Group | `person.group` | Organization |
| Task | `work.task` | Task |

Graph node ids use the provider-neutral prefix `prod:{Kind}:{externalId}`.

## Unified Communication Dashboard

`buildUnifiedCommunicationDashboard(organizationId)` merges Google Workspace + Microsoft 365 feeds into one ECC surface:

- Recent meetings (kind: `Meeting`)
- Recent communications (kind: `Communication`)
- Unified calendar
- Provider lineage kept for audit only — Copilot-facing summaries use kind, not vendor

ECC widget kind: `unified_communication_dashboard`  
UI: `src/components/integrations/UnifiedCommunicationDashboard.tsx`

## Registration

```ts
import {
  createIntegrationPlatformCore,
  registerMicrosoft365PlatformConnector,
  buildUnifiedCommunicationDashboard,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
registerMicrosoft365PlatformConnector(platform);
await platform.syncNow("microsoft", "microsoft-org-1", "full");
const dash = buildUnifiedCommunicationDashboard("exec-demo-org");
```

Also registered via `createOiosOperatingSystem()` alongside Google Workspace.
