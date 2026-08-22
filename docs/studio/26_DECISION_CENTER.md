# Decision Center

Studio's executive surface — one evidence context, several views over it.

Every view is derived from repository and Studio evidence. Nothing is sampled,
estimated, or fetched from git; if a claim appears in a view, an `evidence` array
names where it came from.

## Shared evidence context

`buildDecisionEvidenceContext(root?)` assembles the inputs every view needs —
architecture violations, dependency analysis, coverage, PERs, products and the
knowledge graph — and caches the result keyed by repository root.

```ts
import {
  buildDecisionEvidenceContext,
  clearDecisionEvidenceContext,
} from "@studio";

const ctx = buildDecisionEvidenceContext(root);
```

Pass `ctx` into the builders below to compute several views from one pass.
Omit it and each builder assembles its own. `clearDecisionEvidenceContext()`
drops the cache — needed only when the tree changes mid-process.

## Views

| Builder | Returns | Documented in |
|---------|---------|---------------|
| `buildDecisionOverview` | `DecisionOverview` — health scores, quality, counts | this file |
| `buildProductDecisionCards` | `ProductDecisionCard[]` — per-product posture | this file |
| `buildReleaseDecisionViews` | `ReleaseDecisionView[]` — gate/approval state | [15_RELEASES](15_RELEASES.md) |
| `buildDecisionRecommendations` | `DecisionRecommendation[]` | [25_ENGINEERING_RECOMMENDATIONS](25_ENGINEERING_RECOMMENDATIONS.md) |
| `buildRiskCenter` | `RiskCenterView` | [27_RISK_CENTER](27_RISK_CENTER.md) |
| `buildPerCenter` | `PerCenterView` | [05_PER_ENGINE](05_PER_ENGINE.md) |
| `buildEngineeringTimeline` | `TimelineEvent[]` | [29_TIMELINE](29_TIMELINE.md) |
| `buildActivityFeed` | `ActivityItem[]` | [28_ACTIVITY_FEED](28_ACTIVITY_FEED.md) |

## Overview fields

`DecisionOverview` carries the numbers the dashboard leads with:

- `platformHealth`, `studioHealth`, `knowledgeGraphHealth` (0–100)
- `overallQualityScore` — see [17_QUALITY](17_QUALITY.md)
- `repositoryFreshness` — timestamp of the scan behind the view
- `topRisks`, `openPers`, `releaseReadyCount`
- `products` — the per-product cards

## Dashboard

`buildDecisionCenter(root?)` composes every view into one
`DecisionCenterDashboard`, sharing a single evidence context so the repository is
scanned once rather than once per view. `createDecisionCenterService()` wraps it
for callers that want a service handle.

## Determinism

Given an unchanged tree the same inputs produce the same output. Ids are derived
from content (`risk:api:undoc`, `tl:release:<id>`), not from insertion order or
timestamps, so views can be diffed across runs.
