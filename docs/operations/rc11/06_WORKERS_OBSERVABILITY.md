# Background workers & observability

## Workers (cron → `/api/platform/process-queues`)

Orchestrator: `processAllPlatformQueues` plus RC11 jobs in `src/lib/production/workers.ts`:

- Workflow execution (existing admissions/platform queues)
- Scheduled triggers
- Founder insight snapshots
- JAG pipeline processing
- Notification delivery
- Certification reminders
- Financial aging
- Health snapshots

Auth: `Authorization: Bearer $CRON_SECRET`

## Observability dashboards

- `/dashboard/executive/observability` — pipeline latency, queues, integrations, AI provider latency, errors, release health
- Mission Control / Integration Command Center (existing)
- JAG metrics: `jag_pipeline_metrics`

## Realtime

`src/lib/production/realtime.ts` — Supabase channel subscriptions for founder/executive/notifications/workflows/insights (fallback to poll when channels unavailable).
