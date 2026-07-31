# JAG Communications Engine

**Universal message orchestration for The JAG OS.**

Packages register **definitions and templates**. JAG resolves recipients, renders templates, schedules, and queues **dispatch requests**.  
Delivery providers (email, SMS, push, Slack, Teams, …) are **adapters** — not part of this engine.

## Layout

| Path | Responsibility |
|------|----------------|
| `contracts/` | Immutable types + extension ports |
| `registry/` | Definitions, templates, preferences |
| `runtime/` | `CommunicationRuntime` lifecycle |
| `templates/` | Placeholder rendering |
| `routing/` | Channel selection |
| `delivery/` | Queue/persistence/provider **interfaces only** |
| `participants/` | Recipient resolution via ports |
| `channels/` | Universal channel descriptors |
| `preferences/` | Preference upsert/lookup |
| `events/` / `telemetry/` | Emission contracts |
| `testing/` | Deterministic helpers |

## Public entry

```ts
import {
  CommunicationRegistry,
  CommunicationRuntime,
  bindCommunicationExtensions,
} from "@/jag/communications";
```

## Docs

`docs/jag-os/communications/`
