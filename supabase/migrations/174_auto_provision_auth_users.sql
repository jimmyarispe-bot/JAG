-- =========================================
-- Auto-provision public.users from auth.users
-- Ensures every new auth.users row gets a matching public.users profile
-- (required by login/session: src/lib/auth/session.ts).
-- Idempotent: safe to re-run. Does not modify existing public.users rows.
-- =========================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'name'), '')
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

-- Replace prior provisional name if an earlier draft was applied
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_auth_user_provision();

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- One-time backfill: provision auth.users rows missing from public.users
insert into public.users (id, email, full_name)
select
  au.id,
  au.email,
  coalesce(
    nullif(btrim(au.raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(au.raw_user_meta_data->>'name'), '')
  )
from auth.users au
where not exists (
  select 1 from public.users u where u.id = au.id
)
on conflict (id) do nothing;
