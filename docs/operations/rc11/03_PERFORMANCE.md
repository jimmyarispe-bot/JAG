# Performance

## Targets

- List queries paginated
- Avoid N+1 on hot paths
- Bundle budgets enforced
- Suspense boundaries on heavy dashboard segments
- Lazy-load non-critical panels

## Evidence

| Tool | Command / path |
|------|----------------|
| Perf regression | `npm run perf:regression` |
| Bundle budget | `npm run bundle:budget` |
| Load suite | `npm run load:suite` |
| Observability | `src/lib/observability`, `/dashboard/executive/observability` |
| Gate | `npm run validate:performance` |

## Dashboard

Production performance signals surface on `/dashboard/executive/observability` (pipeline latency, queue depth, error rates).
