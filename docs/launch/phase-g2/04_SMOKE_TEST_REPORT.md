# 4. Smoke Test Report

| Field | Value |
|-------|-------|
| **Status** | **NOT EXECUTED against production** |
| **Automated suite** | `npm run test:smoke` (Chromium, unauthenticated redirects) |

## Required post-deploy smoke matrix

| Area | Result |
|------|--------|
| Authentication | Not run |
| Authorization | Not run |
| Admissions | Not run |
| Student enrollment | Not run |
| Scheduling | Not run |
| Attendance | Not run |
| Teacher Workspace | Not run |
| Parent Portal | Not run |
| Student Portal | Not run |
| Finance | Not run |
| HR | Not run |
| Executive Dashboards | Not run |
| Reporting | Not run |
| Messaging | Not run |
| Notifications | Not run |
| Document uploads | Not run |
| AI services | Not run |
| Executive Graph | Not run |
| Knowledge Graph | Not run |

## Minimal automated smoke (when app URL available)

```bash
PLAYWRIGHT_BASE_URL=https://<staging-or-prod> npm run test:smoke
```

Plus authenticated role journeys (Phase E.1 / G-RC1-01) — still a Critical gap.
