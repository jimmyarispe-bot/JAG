# Engineering Timeline

Milestones reconstructed from repository and Studio evidence.

`buildEngineeringTimeline(root?, ctx?)` returns `TimelineEvent[]`, newest first.

## Event sources

| Source | Title | Kind |
|--------|-------|------|
| Releases | `<product> <status> <version>` | `release` |
| Certification history | `<product>: <note>` | `certification` |
| PERs promoted / implemented | Promotion or status change | `per` |
| Docs matching `rc2` / `rc-2` | RC-2 Complete | `release` |
| Docs matching `18_knowledge` / `knowledge_graph` | JS-004 Complete | `sprint` |
| Docs matching `23_graph_health` / `25_engineering` | JS-005 Complete | `sprint` |
| Knowledge graph build | Refresh with node/edge counts | `knowledge` |
| AcademyOS at RC-2 | RC-3 track active | `release` |

Release events are dated by the most meaningful stamp available:
`certifiedAt ?? releasedAt ?? createdAt`.

## Deduplication and order

Events are keyed by id in a `Map` before being returned, so a milestone derived
from two sources appears once. The result is sorted by `at` descending, with id
as a stable tiebreak — two events at the same instant keep a deterministic order
across runs.

## Shape

```ts
type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  kind: "release" | "sprint" | "per" | "certification" | "documentation" | "knowledge" | "other";
  evidence: readonly string[];
};
```

## Why documentation drives sprint milestones

Sprint completion is inferred from the presence of the docs that sprint was
required to produce. This makes the timeline self-correcting: delete the docs and
the milestone disappears, which is the intended signal rather than a bug.
