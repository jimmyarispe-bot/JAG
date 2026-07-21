# Collaboration Platforms

**Sprint:** 076  
**Package:** `src/lib/platform/integrations/connectors/collaboration/`  
**Catalog ids:** `slack`, `teams`, `zoom`  
**Versions:** 1.0.0 (all non-placeholder)

## Mission

Real-time organizational communication connectors that normalize Slack, Microsoft Teams, and Zoom into shared canonical entities, then build a **Communication Graph** for silo / latency / density / bottleneck detection and ECC widgets.

> Note: Collaboration `teams` is separate from Microsoft 365 (`microsoft`). M365 covers Outlook/Calendar/OneDrive/SharePoint/Teams as productivity SoR; this package focuses on collaboration-graph intelligence across chat and meeting platforms.

## Package structure

```
collaboration/
├── slack/                 # channels, threads, messages, users, reactions
├── teams/                 # teams, channels, chats, meetings
├── zoom/                  # meetings, recordings metadata, attendance, duration
├── mapping/
├── normalization/
├── services/              # store, demo client, shared PlatformConnector factory
├── intelligence/          # Communication Graph + ECC widget builders
├── b4-connector.ts
├── registry.ts
└── index.ts
```

## Normalization

| Provider | Objects | Canonical highlights |
|----------|---------|----------------------|
| Slack | channel, thread, message, user, reaction | `person.group`, `comms.thread`, `comms.message`, `person.user`, `comms.reaction` |
| Teams | team, channel, chat, meet, user, message | `person.group`, `comms.message`, `comms.meeting` |
| Zoom | meet, recording, attendance, user | `comms.meeting`, `document.file`, `comms.attendance` |

KG kinds: Person, Organization, Meeting, Communication, Document.  
Graph node ids: `prod:{Kind}:{externalId}`.

## Communication Graph

`buildCommunicationGraph(organizationId)` detects:

- **Silos** — low cross-group participation
- **Response latency** — avg reply minutes by channel/team
- **Collaboration density** — active participants × message volume
- **Organizational bottlenecks** — latency, silos, meeting load, single points of failure

## ECC widgets

| Widget kind | Builder field | UI |
|-------------|---------------|----|
| `communication_health` | score, silos, bottlenecks | `CommunicationHealth` |
| `response_time` | avg + per-channel latency | `ResponseTime` |
| `active_teams` | active count + density | `ActiveTeams` |
| `meeting_load` | minutes, count, severity | `MeetingLoad` |

Use `buildCollaborationEccWidgets(organizationId)` for soft-read ECC input (never raw vendor payloads).

## Registration

```ts
import {
  createIntegrationPlatformCore,
  registerCollaborationPlatformConnectors,
  buildCommunicationGraph,
  buildCollaborationEccWidgets,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
registerCollaborationPlatformConnectors(platform);
await platform.syncNow("slack", "slack-org-collab-demo", "full");
await platform.syncNow("teams", "teams-org-collab-demo", "full");
await platform.syncNow("zoom", "zoom-org-collab-demo", "full");

const graph = buildCommunicationGraph("org-collab-demo");
const widgets = buildCollaborationEccWidgets("exec-demo-org");
```

Also registered via:

- `registerAllConnectors` (B4 adapters)
- `createOiosOperatingSystem()` → Integration Platform Core
