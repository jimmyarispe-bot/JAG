# Risk Center

Aggregated engineering risk with categories, severities and a score trend.

`buildRiskCenter(root?, ctx?)` returns a `RiskCenterView`. Every `RiskItem`
carries an `evidence` array naming the violation, cycle, PER or path it came
from — no risk is asserted without a source.

## Categories

| Category | Raised when | Severity |
|----------|-------------|----------|
| `architecture` | Architecture violations (first 20) | Mirrors the violation |
| `dependency` | `riskScore > 40` | `Error` at ≥70, else `Warning` |
| `dependency` | Each circular dependency (first 5) | `Error` |
| `per` | Open or Accepted PERs exist | `Warning` at ≥10, else `Info` |
| `connector` | Dependency issues matching `/connector/i` | `Warning` |
| `testing` | Untested services exist | `Error` at >20, else `Warning` |
| `api` | Undocumented APIs exist | `Warning` |
| `technical_debt` | untested + undocumented + open PERs > 0 | `Warning` at >40, else `Info` |
| `documentation` | Stale doc markers, or >50 undocumented APIs | `Info` |

## Score

```
riskScore = min(100, Σ weight(severity))
weight: Info=1, Warning=3, Error=8, Critical=15
```

The cap matters: a repository with many low-severity findings cannot present as
more urgent than one with a handful of critical ones.

## Trend

Each call appends `{ at, riskScore }` to an in-process trend, retained to the
last **30** entries and returned as `trends`. It is process-local and not
persisted — a fresh process starts with an empty trend.

`clearDecisionRiskTrend()` empties it. Note this is *not* cleared by
`resetStudioStoreForTests()`; call it directly if a test asserts on trend length.

## Shape

```ts
type RiskCenterView = {
  generatedAt: string;
  risks: readonly RiskItem[];
  countsByCategory: Readonly<Record<string, number>>;
  trends: readonly { at: string; riskScore: number }[];
};
```

`trend` on an individual `RiskItem` (`up` | `down` | `flat`) is a per-item
direction hint. Only elevated dependency risk currently reports `up`; the rest
report `flat`.
