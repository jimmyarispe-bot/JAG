/*
  420 — THE TEST TEACHER STOPS BEING A TEACHER

  WHY NOW. As of this morning all thirteen real teachers can sign in - and so
  can "ZZZ TEST Teacher", zzz.test.teacher@theacademyvirtual.org, which sits in
  the active teacher list with a TEACHER role, a campus and an employee link.
  Left alone it appears on the pay screen, and in the list of teachers who have
  not submitted a week, every Friday, forever. Jimmy: "yes deactivate".

  DEACTIVATED, NOT DELETED. Migration 395 already threw one test teacher away
  and this is the second; a hard delete of an employee is how a screen breaks
  later when something still points at the row. Setting employment_status takes
  it out of every list that matters - migration 400 itself filters on
  `coalesce(employment_status, 'active') = 'active'` - while leaving the record
  legible.

  THE ROLE GOES TOO. Deactivating the employee does not stop the auth account
  signing in. Jimmy is deleting that account in Supabase, but if it is ever
  missed, this makes sure what is left cannot reach a teacher's screen: the
  TEACHER role and the campus assignment are revoked, and the employee's link
  to the account is cleared.

  BOUNDED BY THE ADDRESS. One account, matched on its own email. Nothing here
  can touch a real teacher.
*/

do $$
declare
  v_employee uuid;
  v_user     uuid;
  v_count    int;
begin
  select e.id, e.user_id into v_employee, v_user
  from public.employees e
  join public.employee_profiles p on p.employee_id = e.id
  where lower(coalesce(p.contact_email, ''))
        = lower('zzz.test.teacher@theacademyvirtual.org');

  if v_employee is null then
    raise exception
      'No employee found for the test teacher address. Nothing changed.';
  end if;

  update public.employees
     set employment_status = 'inactive',
         user_id = null,
         updated_at = now()
   where id = v_employee;

  if v_user is not null then
    delete from public.user_roles ur
    using public.roles r
    where ur.role_id = r.id
      and ur.user_id = v_user
      and r.name = 'TEACHER';

    delete from public.user_org_assignments
     where user_id = v_user;
  end if;

  select count(*) into v_count
  from public.employees e
  where e.employee_type = 'teacher'
    and coalesce(e.employment_status, 'active') = 'active';

  if v_count <> 13 then
    raise exception
      'Expected 13 active teachers after this, found % - rolled back so nobody real is missing.',
      v_count;
  end if;

  raise notice 'Test teacher deactivated. % active teachers remain.', v_count;
end $$;

/*
  THE ROSTER, so the result is read rather than trusted. Thirteen rows, all
  real, all able to sign in.
*/
select
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, e.employee_number
  ) as teacher,
  coalesce(p.contact_email, '(no address on file)') as address,
  case when e.user_id is null then 'NO LOGIN' else 'can sign in' end as status
from public.employees e
left join public.employee_profiles p on p.employee_id = e.id
where e.employee_type = 'teacher'
  and coalesce(e.employment_status, 'active') = 'active'
order by teacher;
