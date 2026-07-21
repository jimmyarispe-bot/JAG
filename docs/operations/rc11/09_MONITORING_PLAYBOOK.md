# Monitoring playbook

| Signal | Where | Alert when |
|--------|-------|------------|
| App health | `/api/health`, `/api/ready` | Non-200 for >2m |
| Queue depth | Observability dashboard / `platform_queue_jobs` | Sustained growth |
| Workflow failures | Mission Control | Spike vs baseline |
| Integration health | Extension `isConfigured` + hub | Provider error rate ↑ |
| JAG pipeline latency | `jag_pipeline_metrics` | p95 > SLA |
| AI provider latency | Observability dashboard | Deferred→timeout storms |
| Release health | `/dashboard/executive/release` | Any production module fail |

Escalate per [10_INCIDENT_RESPONSE.md](./10_INCIDENT_RESPONSE.md).
