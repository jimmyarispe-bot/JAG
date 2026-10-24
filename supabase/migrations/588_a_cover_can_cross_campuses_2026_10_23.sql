-- 588_a_cover_can_cross_campuses_2026_10_23.sql
--
-- Katie Vetere, 23 October 2026, 10:25pm:
--
--     "there is no option for me to cover Marnie. I covered 2 of her
--      classes. The sheet does not have her name as a drop-down option"
--
-- WHY MARNIE WAS NOT ON THE LIST
--
-- listColleagues() read public.employees with the teacher's own session, so
-- employees_select RLS - can_access_school(school_id) - decided who appeared.
-- Katie's staff record is The Academy Virtual. Marnie's is The Academy HS,
-- even though her Earth Lab classes are Virtual courses. RLS hid her, and the
-- "Whose class" dropdown quietly lost her. The same read is how a guest line
-- gets its name, so a cross-campus cover that did get saved would have shown
-- as "for a colleague".
--
-- THE FIX
--
-- One SECURITY DEFINER read that returns exactly two things - an employee id
-- and a name - for staff across the network. Nothing else about another
-- school's employees is exposed, and employees RLS is left untouched.
--
--   p_ids null  -> every ACTIVE employee except the caller (the dropdown)
--   p_ids given -> those employees, any status (names on lines already saved,
--                  so a colleague who has since left still reads by name)
--
-- Only a caller with a staff record gets rows. A parent-only account, or an
-- authenticated user with no employee record, gets nothing.

begin;

create or replace function public.teacher_colleague_names(p_ids uuid[] default null)
returns table (employee_id uuid, name text)
language sql
stable
security definer
set search_path to 'public'
as $$
  with me as (
    select e.id
    from public.employees e
    where e.user_id = auth.uid()
      and not public.is_parent_only(auth.uid())
    limit 1
  )
  select
    e.id,
    coalesce(
      nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
      nullif(trim(coalesce(p.display_name, '')), ''),
      'A colleague'
    )
  from public.employees e
  cross join me
  left join public.employee_profiles p on p.employee_id = e.id
  where (p_ids is null
         and e.archived_at is null
         and e.employment_status = 'active'
         and e.id <> me.id)
     or (p_ids is not null and e.id = any (p_ids));
$$;

revoke all on function public.teacher_colleague_names(uuid[]) from public, anon;
grant execute on function public.teacher_colleague_names(uuid[]) to authenticated;

commit;
