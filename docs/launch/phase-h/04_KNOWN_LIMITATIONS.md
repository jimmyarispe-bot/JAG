# Known Limitations (pre-GA)

Disclose these for any non-GA pilot or demo. Do **not** omit in sales materials claiming GA.

| Area | Limitation |
|------|------------|
| Multi-tenant | In-memory / code-path isolation tested; live two-org RLS soak not certified |
| Scale | Not validated at 10k+ students; unbounded list queries known risk |
| E2E | Smoke covers unauthenticated redirects only |
| Integrations | Connector catalog ready; live OAuth/sync per customer credentials |
| Accessibility | D.1 remediations shipped; WCAG AA not certified |
| Mobile | No dedicated offline/mobile certification |
| AI | Tenant-boundary unit coverage; no production soak / prompt audit pack |
| DR | Procedures documented; restore not evidenced |
| Observability | Health/ready shallow; no standard APM/alert pack in repo |
| Square planned path | Hard-fail in production by design |
| Executive Phase-2 routes | Marked coming soon — not GA surfaces |

When GA is approved, convert this list into customer-facing “Release 1.0 Limitations” with owners and target closure versions.
