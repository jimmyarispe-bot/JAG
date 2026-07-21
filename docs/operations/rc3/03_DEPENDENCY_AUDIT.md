# RC-3 — Dependency & Supply Chain Audit

## Command

```bash
npm audit
```

## Results (2026-07-19)

| Severity | Count | Package | Notes |
|----------|-------|---------|-------|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Moderate | 2 | `next` → nested `postcss` &lt; 8.5.10 | GHSA-qx2v-qp2m-jg93 XSS in CSS stringify |
| Low | 0 | — | — |

### Accepted risk: Next nested postcss

- `npm audit fix --force` proposes downgrading Next to 9.x — **rejected**.
- Remains until upstream Next ships patched nested postcss (track Next releases).
- Exposure is limited to CSS stringification paths inside Next’s dependency tree.

## Dependency footprint

Production deps (lean): `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `web-vitals`.

No abandoned chart/editor/date megadeps observed.

## License

MIT/Apache-compatible stack for app runtime deps; no GPL runtime dependency identified.

## CI

`npm audit --audit-level=high` added to CI (fails on high/critical only; moderate Next risk accepted).
