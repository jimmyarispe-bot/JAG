-- who_would_these_policies_actually_let_in.sql
--
-- One query. Paste the whole file, press Run. Reads only; changes nothing.
--
-- RUN THIS BEFORE MIGRATION 462. It decides one line of it.
--
-- THE 21 SEPTEMBER FAULT, RESTATED. A policy that reads correctly and
-- resolves wrongly returns fewer rows and no error. The way to not repeat it
-- is to look at what the roles actually resolve to in THIS database before
-- writing a predicate against them, rather than reading the role map in the
-- code and assuming the two agree.
--
-- They may well not. src/lib/platform/identity/permission-groups.ts is the
-- code's idea of who holds what. has_permission() reads
-- platform_role_permissions, which is rows, written by migrations going back
-- to 074. The file's own comments say so: "SCHOOL_LEADER holds
-- mission_control.access and school.configure as real database rows".
--
-- WHAT I NEED TO KNOW, and what each column answers:
--
--   roles                 what this person actually holds, from user_roles
--   finance_view          would has_permission('finance.view') be true for
--                         them - including the shortcut inside that function
--                         where FOUNDER, CEO and EXECUTIVE_DIRECTOR return
--                         true for EVERY permission without owning a row
--   is_founder
--   is_exec_director      the two roles I intend to write the policy against,
--                         because they do not depend on the permission rows
--                         being right
--   employee              whether they have an active employee row, which is
--                         what the teacher half of every policy turns on
--
-- WHAT I EXPECT, and what would change the migration:
--
--   Jimmy    FOUNDER, no employee row
--   Danni    EXECUTIVE_DIRECTOR
--   Heather  SCHOOL_LEADER, finance_view FALSE
--   Nina     SCHOOL_LEADER, finance_view FALSE
--
-- IF HEATHER OR NINA COMES BACK finance_view = true, then gating on that
-- permission would have shown them teacher pay, and the policy must gate on
-- the two roles instead. That is the single line this query decides.
--
-- IF DANNI IS NOT EXECUTIVE_DIRECTOR, the policy written against that role
-- would lock her out of payroll, and I need to know before it ships rather
-- than from her.

-- THE ROLE'S NAME IS READ THROUGH to_jsonb, NOT BY GUESSING THE COLUMN.
-- The first version of this file named that column directly and Postgres
-- refused it:
-- public.roles calls that column `name`. The same mistake as e.display_name
-- last night, in a file whose whole purpose is to stop me assuming. A missing
-- KEY in jsonb returns null rather than raising, so this now runs whatever
-- that column turns out to be called.
with role_key as (
  select r.id,
         coalesce(to_jsonb(r) ->> 'name',
                  to_jsonb(r) ->> 'role_key',
                  to_jsonb(r) ->> 'key',
                  to_jsonb(r) ->> 'slug')  as k
    from public.roles r
)

select coalesce(
         nullif(trim(to_jsonb(u) ->> 'display_name'), ''),
         nullif(trim(to_jsonb(u) ->> 'full_name'), ''),
         nullif(trim(to_jsonb(u) ->> 'email'), ''),
         left(u.id::text, 8)
       )                                                   as person,

       coalesce(to_jsonb(u) ->> 'email', '(no email)')      as email,

       coalesce((
         select string_agg(r.k, ', ' order by r.k)
           from public.user_roles ur
           join role_key r on r.id = ur.role_id
          where ur.user_id = u.id
       ), '(no roles)')                                     as roles,

       -- The two roles the policy will actually name.
       exists (select 1 from public.user_roles ur join role_key r on r.id = ur.role_id
                where ur.user_id = u.id and r.k = 'FOUNDER')
                                                            as is_founder,
       exists (select 1 from public.user_roles ur join role_key r on r.id = ur.role_id
                where ur.user_id = u.id and r.k = 'EXECUTIVE_DIRECTOR')
                                                            as is_exec_director,

       -- What has_permission('finance.view') would resolve to for them,
       -- reproduced rather than called: the function reads auth.uid(), which
       -- in the SQL editor is you and not them.
       (
         exists (select 1 from public.user_roles ur join role_key r on r.id = ur.role_id
                  where ur.user_id = u.id
                    and r.k in ('FOUNDER', 'CEO', 'EXECUTIVE_DIRECTOR'))
         or (
           not exists (
             select 1 from public.user_role_ids(u.id) rt
             join public.platform_role_permissions prp on prp.role_id = rt
              where prp.permission_key = 'finance.view' and prp.effect = 'deny')
           and exists (
             select 1 from public.user_role_ids(u.id) rt
             join public.platform_role_permissions prp on prp.role_id = rt
              where prp.permission_key = 'finance.view' and prp.effect = 'allow')
         )
       )                                                    as finance_view,

       case when e.id is null then 'no employee row'
            when e.employment_status is distinct from 'active'
                 then 'employee, not active'
            else 'active employee' end                      as employee

  from public.users u
  left join public.employees e on e.user_id = u.id
 order by is_founder desc, is_exec_director desc, finance_view desc, person;
