-- 395_throw_the_test_teacher_away_2026_09_21.sql
--
-- RUN THIS WHEN THE TEST IS DONE. Not before.
--
-- It removes everything migration 394 created: the ZZZ TEST teacher, her
-- course, its rate, the section, the five classes, the two synthetic children,
-- their enrolments, and any week she submitted while you were testing.
--
-- THIS ONE ACTUALLY DELETES, WHICH IS UNUSUAL HERE AND DELIBERATE. Everything
-- else in this project archives rather than deletes, because everything else is
-- about real people whose history has to survive. None of this is real. Leaving
-- it archived would mean carrying a fake teacher and two fake children in the
-- database forever, turning up in every future audit as something somebody has
-- to recognise and dismiss.
--
-- IT IS PINNED ON THE ZZZ TEST NAMES AND NOTHING ELSE, and it counts what it
-- removed. A count of zero means it matched nothing - which after a successful
-- 394 would mean this file is looking in the wrong place, not that the work is
-- done.

begin;

create temp table removed (ord numeric, what text, rows_removed int) on commit drop;

-- Order matters: children before parents, or the foreign keys refuse.

with s as (
  delete from public.teacher_week_submissions w
   using public.employee_profiles p
   where p.employee_id = w.employee_id
     and p.first_name = 'ZZZ TEST'
  returning w.id
)
insert into removed select 1, 'submitted weeks', count(*) from s;

with a as (
  delete from public.teacher_week_amendments am
   using public.employee_profiles p
   where p.employee_id = am.employee_id
     and p.first_name = 'ZZZ TEST'
  returning am.id
)
insert into removed select 2, 'amendments', count(*) from a;

with c as (
  delete from public.contractor_work_claims cl
   using public.employee_profiles p
   where p.employee_id = cl.employee_id
     and p.first_name = 'ZZZ TEST'
  returning cl.id
)
insert into removed select 3, 'work claims', count(*) from c;

with l as (
  delete from public.contractor_pay_ledger lg
   using public.employee_profiles p
   where p.employee_id = lg.employee_id
     and p.first_name = 'ZZZ TEST'
  returning lg.id
)
insert into removed select 4, 'pay ledger rows', count(*) from l;

with att as (
  delete from public.session_attendance_records ar
   using public.instructional_sessions i,
         public.course_sections cs,
         public.courses co
   where ar.instructional_session_id = i.id
     and i.course_section_id = cs.id
     and cs.course_id = co.id
     and co.name = 'ZZZ TEST Course'
  returning ar.id
)
insert into removed select 5, 'attendance rows', count(*) from att;

with i as (
  delete from public.instructional_sessions i
   using public.course_sections cs, public.courses co
   where i.course_section_id = cs.id
     and cs.course_id = co.id
     and co.name = 'ZZZ TEST Course'
  returning i.id
)
insert into removed select 6, 'classes', count(*) from i;

with e as (
  delete from public.student_enrollments se
   using public.course_sections cs, public.courses co
   where se.course_section_id = cs.id
     and cs.course_id = co.id
     and co.name = 'ZZZ TEST Course'
  returning se.id
)
insert into removed select 7, 'enrolments', count(*) from e;

with st as (
  delete from public.students
   where first_name = 'ZZZTEST'
     and student_number in ('ZZZ001', 'ZZZ002')
  returning id
)
insert into removed select 8, 'synthetic children', count(*) from st;

with r as (
  delete from public.class_pay_rates r
   using public.courses co
   where r.course_id = co.id and co.name = 'ZZZ TEST Course'
  returning r.id
)
insert into removed select 9, 'class rates', count(*) from r;

with cs as (
  delete from public.course_sections cs
   using public.courses co
   where cs.course_id = co.id and co.name = 'ZZZ TEST Course'
  returning cs.id
)
insert into removed select 10, 'sections', count(*) from cs;

with co as (
  delete from public.courses where name = 'ZZZ TEST Course' returning id
)
insert into removed select 11, 'courses', count(*) from co;

with p as (
  delete from public.employee_profiles where first_name = 'ZZZ TEST' returning employee_id
)
insert into removed select 12, 'employee profiles', count(*) from p;

-- The account rows migration 396 added. THE AUTH USER ITSELF IS NOT TOUCHED -
-- Supabase owns auth.users and SQL here cannot remove it. Delete that one by
-- hand in Authentication > Users, or the login keeps working against nothing.
with ur as (
  delete from public.user_roles
   where user_id = '7b298441-39c2-4196-b8c2-88facf58680d' returning user_id
)
insert into removed select 12.1, 'role assignments', count(*) from ur;

with oa as (
  delete from public.user_org_assignments
   where user_id = '7b298441-39c2-4196-b8c2-88facf58680d' returning id
)
insert into removed select 12.2, 'campus assignments', count(*) from oa;

with uu as (
  delete from public.users
   where id = '7b298441-39c2-4196-b8c2-88facf58680d' returning id
)
insert into removed select 12.3, 'platform user row', count(*) from uu;

-- The employee row last, once nothing points at it. Pinned on the employee
-- number 375's convention gave it, so it cannot match a real person.
with emp as (
  delete from public.employees e
   where e.employee_number = 'ZZZ.Test.Teacher'
  returning e.id
)
insert into removed select 13, 'employee rows', count(*) from emp;

select
  ord,
  what,
  rows_removed,
  case when rows_removed > 0 then 'removed'
       else 'nothing matched' end as result
from removed
order by ord;

commit;
