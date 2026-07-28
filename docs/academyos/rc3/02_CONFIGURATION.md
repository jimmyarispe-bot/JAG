# AcademyOS RC-3 — Configuration

## `validateConfiguration()`

Returns missing, invalid, deprecated, warnings, and recommendations for development and production.

## Feature flags

AcademyOS extension `featureFlags` (for example `academyos.enabled`) are validated at pack install. Runtime toggles remain host-managed.

## Deprecated configuration

`SMTP_HOST` is deprecated — migrate to Resend (`RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`).

## Profiles

| Profile | Strictness |
|---------|------------|
| development / test | Missing secrets → warnings |
| production | Missing Supabase/Resend → blockers |
