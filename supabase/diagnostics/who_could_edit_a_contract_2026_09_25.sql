/*
  WHO COULD EDIT A CONTRACT — 2026-09-25
  Read-only. Nothing here writes.

  WHY. The form builder will be able to change the campus applications and,
  once the contracts move into JAG, the Enrollment and Tuition Contract itself.
  Jimmy: editing is for him and Danni. School leaders must not be able to
  change a contract.

  Picking the gate by reading role names would repeat a documented mistake: the
  first version of the admissions-contacts page checked for CEO / FOUNDER /
  SCHOOL_LEADER and locked out the account that owns the platform, because role
  names are a different axis from what somebody is allowed to do.

  So this asks the database who actually holds what, rather than inferring it.

  WHAT EMPTY MEANS, decided before running it:

  1. zero rows means no user rows are readable here at all, which would be a
     policy refusal rather than an empty platform - stop and say so.
  2. a permission with zero holders is a permission nobody has, which makes it
     useless as a gate no matter how well it is named.
  3. ZERO ROWS IS THE GOOD ANSWER for section 3. Any row is a school leader who
     would be able to edit a contract under that gate.
*/

select
  '1. people and their roles' as check,
  coalesce(u.full_name, u.email, u.id::text) as detail,
  'roles=' || coalesce(
       (select string_agg(r.role, ', ' order by r.role)
        from public.user_roles r where r.user_id = u.id),
       'none') as extra
from public.users u
where coalesce(u.is_active, true)

union all

select
  '2. holders of each candidate gate',
  p.permission_key,
  count(distinct p.user_id)::text || ' user(s): ' || coalesce(
    string_agg(distinct coalesce(u.full_name, u.email), ', '), 'nobody')
from public.user_permissions p
left join public.users u on u.id = p.user_id
where p.permission_key in (
  'school.configure', 'finance.view', 'admissions.manage',
  'org.manage', 'configuration.admin', 'data.admin'
)
  and coalesce(p.effect, 'allow') = 'allow'
group by p.permission_key

union all

select
  '3. school leaders holding school.configure',
  coalesce(u.full_name, u.email, u.id::text),
  'THIS PERSON COULD EDIT A CONTRACT'
from public.user_permissions p
join public.users u on u.id = p.user_id
join public.user_roles r on r.user_id = u.id
where p.permission_key = 'school.configure'
  and coalesce(p.effect, 'allow') = 'allow'
  and r.role = 'SCHOOL_LEADER'

order by 1, 2;
