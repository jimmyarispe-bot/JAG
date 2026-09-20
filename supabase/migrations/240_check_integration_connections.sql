-- 240_check_integration_connections.sql  (v2 -- real column names)
--
-- v1 selected connected_at and last_sync_at. Neither exists. I wrote those names
-- off the TypeScript status object the settings page renders, which is assembled
-- from two tables plus computed fields, and never checked them against the actual
-- schema. The real columns are below: connection identity lives in
-- integration_connections (178_rc201), sync timing in integration_sync_registry
-- (179_rc202).
--
-- What this answers: is anything recorded as "connected" that was never really
-- connected? /api/integrations/google/connect and .../microsoft/connect both fall
-- back to a demo connect when OAuth credentials are missing from the environment.
-- The demo path writes status='connected' with a placeholder token, and the
-- settings page then reports a healthy connection that will never sync.
--
-- The token is encrypted at rest and cannot be inspected here. The tell is the
-- combination: status 'connected' with no successful sync ever recorded. With no
-- GOOGLE_* variables in Vercel, any google_workspace row in the 'connected' state
-- is a demo row by definition.
--
-- Read-only. Nothing here changes data.

select
  c.provider,
  c.status,
  c.created_at,
  c.updated_at,
  c.expires_at,
  r.last_successful_sync_at,
  r.last_attempted_sync_at,
  r.consecutive_failures,
  case
    when c.status = 'connected' and r.last_successful_sync_at is null
      then 'SUSPECT -- connected but has never completed a sync'
    when c.status = 'connected'
      then 'connected, last synced ' || r.last_successful_sync_at::text
    else c.status
  end as reality_check
from public.integration_connections c
left join public.integration_sync_registry r on r.connection_id = c.id
order by c.provider;
