-- The twelve teachers and seven courses of the virtual schools.
--
-- Before this, public.employees held ZERO rows and public.courses held ZERO
-- rows. Nothing could reference an instructor, no class existed to enrol a
-- child into, and the attendance screens and the contractor pay ledger were
-- both waiting on a foundation nobody had laid.
--
-- NO AUTH ACCOUNTS ARE CREATED HERE. public.users.id references auth.users, so
-- a login cannot be conjured in SQL. Teachers exist as employees with their
-- name and email on employee_profiles; when accounts are provisioned later,
-- employees.user_id is filled in and nothing built on top has to change.
--
-- WHICH SCHOOL comes from the email domain on the roster of 19 September 2026:
-- @TheAcademyVirtual.org and @TheAcademyHS.org. Marnie Witters is on
-- @TheAcademyWay.org, the network domain, which names no campus - Jimmy
-- confirmed The Academy HS rather than letting the loader guess.
--
-- Re-runnable: employee_number is the email local part, which makes
-- (school_id, employee_number) a natural key, and courses key on (school_id, code).

begin;

-- =========================================================================
-- TEACHERS
-- =========================================================================

with roster(first_name, last_name, email, school_name) as (
  values
    ('Raven',    'Rogers',   'Raven.Rogers@TheAcademyVirtual.org',    'The Academy Virtual'),
    ('Casandra', 'Manghun',  'Casandra.Manghun@TheAcademyVirtual.org','The Academy Virtual'),
    ('Kim',      'Hawkins',  'Kim.Hawkins@TheAcademyVirtual.org',     'The Academy Virtual'),
    ('Marissa',  'Vanella',  'Marissa.Vanella@TheAcademyVirtual.org', 'The Academy Virtual'),
    ('Renne',    'Tracewell','Renne.Tracewell@TheAcademyVirtual.org', 'The Academy Virtual'),
    ('Jessica',  'Vedder',   'Jessica.Vedder@TheAcademyVirtual.org',  'The Academy Virtual'),
    ('Holly',    'Medlong',  'Holly.Medlong@TheAcademyVirtual.org',   'The Academy Virtual'),
    ('Jessica',  'Price',    'Jessica.Price@TheAcademyVirtual.org',   'The Academy Virtual'),
    ('Katie',    'Vetere',   'Katie.Vetere@TheAcademyVirtual.org',    'The Academy Virtual'),
    ('Craig',    'Mann',     'Craig.Mann@TheAcademyHS.org',           'The Academy HS'),
    ('Peter',    'Alouise',  'Peter.Alouise@TheAcademyHS.org',        'The Academy HS'),
    -- Network domain names no campus; Jimmy confirmed HS on 19 September 2026.
    ('Marnie',   'Witters',  'Marnie.Witters@TheAcademyWay.org',      'The Academy HS')
),
resolved as (
  select r.*, s.id as school_id, split_part(r.email, '@', 1) as employee_number
  from roster r
  join public.schools s on lower(trim(s.name)) = lower(r.school_name)
),
upserted as (
  insert into public.employees (school_id, employee_number, employee_type, employment_status)
  select school_id, employee_number, 'teacher', 'active' from resolved
  on conflict (school_id, employee_number) do update
    set employment_status = 'active', updated_at = now()
  returning id, school_id, employee_number
)
insert into public.employee_profiles
  (employee_id, first_name, last_name, display_name, contact_email, job_title)
select u.id, r.first_name, r.last_name, r.first_name || ' ' || r.last_name, r.email, 'Teacher'
from upserted u
join resolved r
  on r.school_id = u.school_id and r.employee_number = u.employee_number
on conflict (employee_id) do update
  set first_name    = excluded.first_name,
      last_name     = excluded.last_name,
      display_name  = excluded.display_name,
      contact_email = excluded.contact_email,
      job_title     = excluded.job_title,
      updated_at    = now();

-- =========================================================================
-- COURSES
-- =========================================================================

insert into public.courses (school_id, code, name, status)
select s.id, c.code, c.course_name, 'active'
from (values
  ('DIGITLAB',   'DigitLab',            'The Academy Virtual'),
  ('EARTHOLOGY', 'Earthology',          'The Academy Virtual'),
  ('LITLAB',     'LitLab',              'The Academy Virtual'),
  ('STRUCTLIT',  'Structured Literacy', 'The Academy Virtual'),
  ('ENTREP',     'Entrepreneurship',    'The Academy HS'),
  ('WORLDOLOGY', 'WorldOlogy',          'The Academy HS'),
  ('DATAOLOGY',  'DataOlogy',           'The Academy HS')
) as c(code, course_name, school_name)
join public.schools s on lower(trim(s.name)) = lower(c.school_name)
on conflict (school_id, code) do update
  set name = excluded.name, status = 'active', updated_at = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Teachers and courses now in the JAG, plus the one person this migration
-- would have had to guess about. A name absent here is a name that will pay
-- nothing and teach nothing until somebody notices, so it is named now.

select 'teacher' as kind,
       p.display_name as name,
       p.contact_email as detail,
       s.name as school
from public.employee_profiles p
join public.employees e on e.id = p.employee_id
join public.schools s on s.id = e.school_id
where p.job_title = 'Teacher'
union all
select 'course', c.name, c.code, s.name
from public.courses c
join public.schools s on s.id = c.school_id
order by kind, name;
