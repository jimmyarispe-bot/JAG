# AcademyOS RC-3 — Diagnostics

## `runDiagnostics()`

Aggregates configuration, deployment, health, upgrades, backup, connectors, notifications, queues, migrations, and version compatibility into actionable findings.

## API

- `GET /api/academyos/operations/diagnostics`
- `POST /api/academyos/operations/diagnostics` (`fullDashboard: true` builds the operations dashboard and registers Studio artifacts)
