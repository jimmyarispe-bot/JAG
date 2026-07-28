# AcademyOS RC-3 — Monitoring

## Metrics

API latency, dashboard latency, queue latency, notification throughput, Executive Insight refresh, validation execution, error rate, connector status.

## Baselines

RC-3 captures pack-local baselines derived from RC-2 performance evidence. Trend history is retained in-process for the operations API.

## Operations

`GET/POST /api/academyos/operations/monitoring` exposes current metrics and trend points for Studio consumption.
