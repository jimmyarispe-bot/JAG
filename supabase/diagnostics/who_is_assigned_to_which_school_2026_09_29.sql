-- WHO IS ASSIGNED TO WHICH SCHOOL, AND WHAT ROLE DO THEY HOLD
--
-- 29 September 2026. Jimmy: when Danni or any school leader first signs in
-- they should land on their own admissions pipeline board - Nina GA only,
-- Heather Virtual and HS, Danni everyone, Jimmy unchanged.
--
-- THE SCOPING MECHANISM ALREADY EXISTS. `user_schools` maps a person to a
-- school, and `is_assigned_to_school()` / `can_access_school()` are built on
-- it - a SCHOOL_LEADER sees a school only if they have a row there. So the
-- board does not need a new idea; it needs the right rows and a landing page
-- that uses them.
--
-- WHICH MEANS THE FIRST QUESTION IS WHAT THOSE ROWS SAY TODAY. If Nina has no
-- row she sees nothing; if she has three she sees three campuses. Building
-- the landing page before reading this would produce a board that is
-- confidently scoped to the wrong thing.
--
-- One statement. Reads only.

select x.section, x.person, x.detail
from (
  -- Every person who has any school assignment at all.
  select 1 as ord, 'A. ASSIGNED' as section,
         coalesce(u.email, us.user_id::text) as person,
         s.name as detail
    from public.user_schools us
    left join auth.users u on u.id = us.user_id
    left join public.schools s on s.id = us.school_id

  union all

  -- The four people Jimmy named, whether or not they are assigned anywhere.
  -- A name missing from section A but present here is somebody who will see
  -- an empty board.
  select 2, 'B. THE FOUR NAMED',
         u.email,
         'assignments=' || (
           select count(*)::text from public.user_schools us2 where us2.user_id = u.id
         ) || '   roles=' || coalesce((
           select string_agg(r.name, ', ' order by r.name)
             from public.user_roles ur
             join public.roles r on r.id = ur.role_id
            where ur.user_id = u.id
         ), '(none)')
    from auth.users u
   where lower(u.email) like 'nina%'
      or lower(u.email) like '%gaddy%'
      or lower(u.email) like 'heather%'
      or lower(u.email) like '%badger%'
      or lower(u.email) like 'danni%'
      or lower(u.email) like '%treu%'
      or lower(u.email) like 'jimmy%'

  union all

  -- The schools themselves, so the ids behind any fix are visible.
  select 3, 'C. SCHOOLS', s.name, s.id::text
    from public.schools s
) x
order by x.section, x.person, x.detail;
