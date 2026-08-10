-- 215: Persist user profile display fields on public.users
-- Profile attributes only (first/last/display name + job title).
-- Does not alter roles, permissions, or auth identities.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists title text;

comment on column public.users.first_name is 'Profile first name (not auth identity).';
comment on column public.users.last_name is 'Profile last name (not auth identity).';
comment on column public.users.display_name is 'Profile display name shown in UI chrome.';
comment on column public.users.title is 'Personal job title for UI (not a platform role).';

-- Backfill display_name from full_name where missing.
update public.users
set display_name = nullif(trim(full_name), '')
where display_name is null
  and full_name is not null
  and trim(full_name) <> '';

-- Best-effort split of existing full_name into first/last when unset.
update public.users
set
  first_name = coalesce(
    first_name,
    nullif(trim(split_part(trim(full_name), ' ', 1)), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(
      trim(substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 2)),
      ''
    )
  )
where full_name is not null
  and trim(full_name) <> ''
  and (first_name is null or last_name is null);

-- Copy personal title from auth metadata when public.users.title is empty.
update public.users u
set title = nullif(trim(au.raw_user_meta_data ->> 'title'), '')
from auth.users au
where au.id = u.id
  and u.title is null
  and coalesce(trim(au.raw_user_meta_data ->> 'title'), '') <> '';

-- Jimmy Arispe — profile only (no role / auth identity changes).
update public.users
set
  first_name = 'Jimmy',
  last_name = 'Arispe',
  display_name = 'Jimmy Arispe',
  full_name = 'Jimmy Arispe',
  title = 'Founder & CEO'
where lower(email) in (
  'jimmy@theacademyway.org',
  'jimmy.arispe@theacademyway.org'
);

update auth.users
set
  raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'first_name', 'Jimmy',
      'last_name', 'Arispe',
      'full_name', 'Jimmy Arispe',
      'display_name', 'Jimmy Arispe',
      'title', 'Founder & CEO'
    ),
  updated_at = now()
where lower(email) in (
  'jimmy@theacademyway.org',
  'jimmy.arispe@theacademyway.org'
);

-- Danni Treu — title change only (CEO role / permissions unchanged).
update public.users
set
  first_name = 'Danni',
  last_name = 'Treu',
  display_name = 'Danni Treu',
  full_name = 'Danni Treu',
  title = 'Chief Schools Officer'
where lower(email) in (
  'danni@theacademyway.org',
  'danni@academyos.org'
);

update auth.users
set
  raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'first_name', 'Danni',
      'last_name', 'Treu',
      'full_name', 'Danni Treu',
      'display_name', 'Danni Treu',
      'title', 'Chief Schools Officer'
    ),
  updated_at = now()
where lower(email) in (
  'danni@theacademyway.org',
  'danni@academyos.org'
);
