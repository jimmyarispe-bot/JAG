-- 273: Drew Ross and Jayden Byrd belong to The Academy FL.
--
-- Jimmy, 2026-09-05: "ross and byrd. florida students who attend virtually."
--
-- JAG has both at The Academy Virtual with program academy_virtual. They are
-- Florida students on the 15,000 campus rate whose delivery is virtual —
-- school FL, program academy_fl_virtual.
--
-- The distinction is not cosmetic. Under FL their tuition is FL revenue and FL
-- owes The Academy Virtual for the classes those children take. Under Virtual
-- it is Virtual's revenue and no inter-school charge exists at all.
--
-- DELIVERY MODE AND PROGRAMME ARE DIFFERENT THINGS. Penny Shropshire also
-- attends virtually and is on the HS programme at 12,750 — the same delivery,
-- a different product, a different price. "Attends virtually" implies no rate
-- on its own.
--
-- Their sis_enrollments rows move too. A row keyed to The Academy Virtual's
-- 2026-2027 year would leave them enrolled at a school they no longer attend.
--
-- IDEMPOTENT.

begin;

do $$
declare
  v_fl        uuid;
  v_fl_year   uuid;
  v_moved     int;
  v_enrol     int;
begin
  select id into v_fl from public.schools
   where name ilike '%academy%fl%' or name ilike '%academy florida%' limit 1;

  select sy.id into v_fl_year
    from public.school_years sy
   where sy.school_id = v_fl and sy.is_current
   limit 1;

  if v_fl is null or v_fl_year is null then
    raise exception 'Aborting: The Academy FL or its current school year is missing.';
  end if;

  -- Move the students.
  update public.students s
     set school_id = v_fl,
         program   = 'academy_fl_virtual'
   where lower(s.first_name) in ('drew', 'jayden')
     and lower(s.last_name)  in ('ross', 'byrd')
     and s.status = 'active'
     and (s.school_id <> v_fl or s.program is distinct from 'academy_fl_virtual');

  get diagnostics v_moved = row_count;
  raise notice '% student(s) moved to The Academy FL.', v_moved;

  -- Move their enrolment rows onto FL's year and programme.
  update public.sis_enrollments e
     set school_year_id = v_fl_year,
         program        = 'academy_fl_virtual'
    from public.students s
   where s.id = e.student_id
     and lower(s.first_name) in ('drew', 'jayden')
     and lower(s.last_name)  in ('ross', 'byrd')
     and (e.school_year_id <> v_fl_year or e.program <> 'academy_fl_virtual');

  get diagnostics v_enrol = row_count;
  raise notice '% enrolment row(s) re-pointed.', v_enrol;
end $$;

-- Both should now read The Academy FL / academy_fl_virtual, with an enrolment
-- row on FL's 2026-2027 year.
select s.first_name || ' ' || s.last_name as student,
       sc.name  as school,
       s.grade_level,
       s.program,
       sy.name  as enrolment_year,
       e.program as enrolment_program
from public.students s
left join public.schools sc on sc.id = s.school_id
left join public.sis_enrollments e on e.student_id = s.id
left join public.school_years sy on sy.id = e.school_year_id
where lower(s.last_name) in ('ross', 'byrd')
  and lower(s.first_name) in ('drew', 'jayden')
order by 1;

-- And the FL headcount, which should now be 32 active.
select count(*) as active_fl_students
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
  and s.status = 'active';

commit;
