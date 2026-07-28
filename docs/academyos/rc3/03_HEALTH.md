# AcademyOS RC-3 — Health

## `buildHealthReport()`

Categories: Application, Database, Authentication, Connectors, Executive Intelligence, Studio Integration, Storage, Notifications, Background Jobs.

## Status model

Healthy → Warning → Critical (worst category wins).

## Studio

Studio Integration category verifies `packages/studio` gates remain the release authority. Executive Intelligence checks pack-local insight provider only — EI core is not modified.
