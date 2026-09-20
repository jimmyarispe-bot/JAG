-- 274: Bella Ann Waldroup belongs to The Academy FL.
--
-- Jimmy, 2026-09-05: "waldroup is similar. florida student who attends the
-- academy hs virtually."
--
-- So: school = The Academy FL (who enrols and bills her), programme = HS (what
-- she actually takes), delivery = virtual.
--
-- JAG has her at The Academy HS. Same correction as Ross and Byrd in 273,
-- except her PROGRAMME really is HS — only the school is wrong.
--
-- A NOTE ON THE PROGRAM ENUM. `academy_hs` conflates a school with a
-- programme, so there is no code that says "FL student on the HS programme".
-- She is stored school=FL, program=academy_hs, which is the honest reading:
-- the school is who bills her, the programme is what she is buying. If the
-- codes are ever separated into school + programme + delivery, this row is the
-- example to test against.
--
-- IDEMPOTENT.

begin;

do $$
declare v_fl uuid; v_fl_year uuid; v_hit int;
begin
  select id into v_fl from public.schools
   where name ilike '%academy%fl%' or name ilike '%academy florida%' limit 1;
  select sy.id into v_fl_year from public.school_years sy
   where sy.school_id = v_fl and sy.is_current limit 1;

  if v_fl is null or v_fl_year is null then
    raise exception 'Aborting: The Academy FL or its current school year is missing.';
  end if;

  update public.students s
     set school_id = v_fl
   where lower(s.last_name) like 'waldroup%'
     and lower(s.first_name) like 'bell%'
     and s.status = 'active'
     and s.school_id <> v_fl;
  get diagnostics v_hit = row_count;
  raise notice '% student(s) moved to The Academy FL.', v_hit;

  -- Programme stays academy_hs; only the year moves to FL's.
  update public.sis_enrollments e
     set school_year_id = v_fl_year
    from public.students s
   where s.id = e.student_id
     and lower(s.last_name) like 'waldroup%'
     and lower(s.first_name) like 'bell%'
     and e.school_year_id <> v_fl_year;
  get diagnostics v_hit = row_count;
  raise notice '% enrolment row(s) re-pointed.', v_hit;
end $$;

select s.first_name || ' ' || s.last_name as student,
       sc.name as school, s.grade_level, s.program,
       sy.name as enrolment_year, e.program as enrolment_program
from public.students s
left join public.schools sc on sc.id = s.school_id
left join public.sis_enrollments e on e.student_id = s.id
left join public.school_years sy on sy.id = e.school_year_id
where lower(s.last_name) like 'waldroup%';

-- FL headcount. Should be 33 once 273 and 274 have both run:
-- the 32 on the roster, plus Kaitlyn Satterfield who is not a 26-27 student
-- and still needs archiving.
select count(*) as active_fl_students
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
  and s.status = 'active';

commit;
