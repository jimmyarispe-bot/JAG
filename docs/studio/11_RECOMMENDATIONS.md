# Studio Recommendation Engine

JS-002 — Actionable recommendations from measurable repository evidence.

## Principles

1. **Evidence-based** — every recommendation cites catalog paths, node ids, or PER text.
2. **No guesses** — heuristics only fire when counts/links are measurable (e.g. ≥2 notification services).
3. **Severity + score** — Studio can prioritize remediation.

## Score model

```
score = severityBase + optional boosts
```

| Severity | Base score |
|----------|------------|
| Info | 10 |
| Warning | 40 |
| Error | 70 |
| Critical | 95 |

Additional fixed scores:

| Source | Score |
|--------|-------|
| Multi-pack PER → Foundation review | 55 |
| Notification dedupe across packs | 25 |
| Payroll/timekeeping without integration test link | 45 |

Dependency issues are mirrored as recommendations with the same severity base score.

## Example recommendations

- “Payroll service has no integration test link” — service catalog entry has no test path matching integration/e2e/hardening/validation.
- “N packs implement notification-related services” — ≥2 owner packages with `/notif/i` services.
- “PER-XYZ appears in multiple products…” — `promoteToFoundation` PERs from the PER engine.
- “API missing documentation” — dependency rule `missing_documentation`.

## API

`GET /api/studio/recommendations`

Supports `severity`, `q`, `page`, `pageSize`, `force=1`.
Returns `countsBySeverity` and ranked recommendations.
