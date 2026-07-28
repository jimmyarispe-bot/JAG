# Quality Score

Transparent, configurable product quality score.

## Formula

```
overall = Σ (rawScore_i × weight_i / 100)
```

Weights must sum to **100**.

## Default weights

| Component | Weight |
|-----------|--------|
| Test health | 20 |
| Architecture health | 15 |
| Documentation coverage | 12 |
| Performance baselines | 10 |
| Security findings | 15 |
| Technical debt (inverted) | 10 |
| Accessibility | 8 |
| Release readiness | 10 |

## Evidence sources

Studio catalog/graph health, testing workspace, documentation intelligence, dependency risk, PERs, pack docs (RC hardening / perf reports).

## Approval process

See approvals API — roles must approve in order before Certified/Released:

Engineering → Architecture → QA → Executive → Release

Each record stores approver, timestamp, decision, comments.

## API

- `GET /api/studio/quality` — all products
- `GET /api/studio/quality?productId=` — one score
- `GET /api/studio/quality?weights=1` — current weights
- `PATCH` — update weights
