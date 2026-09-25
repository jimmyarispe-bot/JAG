-- WHICH TRACEWELL ACCOUNTS EXIST - 25 September 2026
--
-- Renee is HS, and her address is renee.tracewell@theacademyhs.org.
-- The screen she photographed showed her signing in as
-- Renee.tracewell@theacademyhys.org - theacademy-H-Y-S - and that sign-in
-- reached a password check, so SOMETHING exists at that address.
--
-- Before repairing her record we need to know exactly what is there: one
-- account at the typo address, one at the correct address, or both. The fix
-- is different for each, and guessing would either strand her password or
-- leave a second account nobody is watching.
--
-- ONE statement. READ ONLY.

select
  au.id                        as auth_user_id,
  au.email                     as auth_email,
  au.email_confirmed_at is not null as email_confirmed,
  au.last_sign_in_at,
  au.created_at,
  (pu.id is not null)          as has_public_users_row,
  pu.full_name,
  (select count(*) from user_roles ur where ur.user_id = pu.id) as role_count,
  (select count(*) from public.employees e where e.user_id = pu.id) as employee_rows
from auth.users au
left join public.users pu on pu.id = au.id
where lower(au.email) like '%tracewell%'
   or lower(au.email) like '%theacademyhys%'
order by au.created_at;
