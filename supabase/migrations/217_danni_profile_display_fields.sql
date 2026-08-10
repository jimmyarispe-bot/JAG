-- 217: Correct Danni Treu profile display fields after migration 215
-- email mismatch (production uses danni.treu@theacademyway.org).
-- Profile attributes only — no roles, permissions, org, or auth credentials.

-- Stable public.users.id verified on linked remote before authoring this migration.
-- Idempotent: re-running sets the same display fields.

update public.users
set
  display_name = 'Danni Treu',
  title = 'Chief Schools Officer'
where id = '3770c0e5-8170-46b3-a8d6-6cad3b36a610'
  and lower(email) = 'danni.treu@theacademyway.org';

-- Mirror migration 215 auth metadata sync pattern (profile chrome only).
update auth.users
set
  raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'display_name', 'Danni Treu',
      'title', 'Chief Schools Officer'
    ),
  updated_at = now()
where id = '3770c0e5-8170-46b3-a8d6-6cad3b36a610'
  and lower(email) = 'danni.treu@theacademyway.org';
