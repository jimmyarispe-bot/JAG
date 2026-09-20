-- 283: Wren Peters, Olson's sister, who is not in JAG at all.
--
-- Jimmy, 2026-09-06: "olson and wren = petrika peters = are both on month to
-- month" ... "wren is the same parent" ... "just wren peters. no idea about
-- grade."
--
-- find_peters.sql returned one row: Olson, and no Wren anywhere — not as a
-- student, not as a lead, at any school. She is billed every month and has
-- never existed in the system.
--
-- SHE JOINS OLSON'S FAMILY, she does not get a new one. A second Peters family
-- row would split one household's billing in two, and the next person to look
-- would find two Petrikas and not know which is real. If Olson somehow has no
-- family row, one is created and he is attached to it too.
--
-- WHAT IS DELIBERATELY LEFT NULL:
--   date_of_birth — not supplied. Olson's application says 23-Feb-2024 against
--     3rd grade, which would make him two years old, so the family's form data
--     is not a safe source to pattern-match from.
--   grade_level   — "no idea about grade". A guessed grade drives placement.
-- Both are reported at the end so they are filled in rather than forgotten.
--
-- Her surname is "Peters" on Jimmy's instruction. Note that Olson's application
-- files him as "Peters Johnston, Olson" — surname first, two-part surname — and
-- JAG stores him as "Olson Peters". That disagreement is left alone here; it is
-- a separate decision.
--
-- IDEMPOTENT.

begin;

do $$
declare
  v_school_id  uuid;
  v_year_id    uuid;
  v_olson_id   uuid;
  v_family_id  uuid;
  v_student_id uuid;
  v_number     text;
begin
  select id into v_school_id from public.schools
   where name ilike '%academy virtual%' limit 1;
  if v_school_id is null then
    raise exception 'Aborting: could not find The Academy Virtual.';
  end if;

  select id into v_year_id from public.school_years
   where school_id = v_school_id and is_current limit 1;

  -- Already done?
  select id into v_student_id from public.students
   where school_id = v_school_id
     and lower(first_name) = 'wren' and lower(last_name) = 'peters';
  if v_student_id is not null then
    raise notice 'Wren Peters already exists (%). Nothing to do.', v_student_id;
    return;
  end if;

  -- Olson, and the family he belongs to.
  select id, family_id into v_olson_id, v_family_id
    from public.students
   where school_id = v_school_id
     and lower(first_name) = 'olson' and lower(last_name) like 'peters%'
     and status = 'active'
   limit 1;

  if v_olson_id is null then
    raise exception 'Aborting: Olson Peters not found at The Academy Virtual. Wren should join his family, and there is no family to join.';
  end if;

  if v_family_id is null then
    insert into public.families (school_id, family_name, billing_email, billing_phone,
                                 primary_address, city, state, zip_code, status)
    values (v_school_id, 'Peters', 'petrikap1@gmail.com', '605-645-2856',
            '301 Lariat Dr', 'Spearfish', 'SD', '57783', 'active')
    returning id into v_family_id;

    insert into public.guardians (family_id, first_name, last_name, email, phone,
                                  relationship_to_student, is_primary, receives_billing)
    values (v_family_id, 'Petrika', 'Peters', 'petrikap1@gmail.com', '605-645-2856',
            'parent', true, true);

    update public.students set family_id = v_family_id where id = v_olson_id;
    raise notice 'Created family % and attached Olson to it.', v_family_id;
  else
    raise notice 'Wren joins Olson''s existing family %.', v_family_id;
  end if;

  select public.generate_student_number(v_school_id) into v_number;

  insert into public.students (
    school_id, family_id, first_name, last_name, date_of_birth, grade_level,
    program, school_year_id, enrollment_status, enrollment_start_date,
    status, lifecycle_stage, student_number
  )
  values (
    v_school_id, v_family_id, 'Wren', 'Peters', null, null,
    'academy_virtual', v_year_id, 'enrolled', date '2026-08-01',
    'active', 'accepted', v_number
  )
  returning id into v_student_id;

  -- Guarded insert, not "on conflict (student_id, school_year_id)" — migration
  -- 229 dropped that constraint for dual enrolment.
  if v_year_id is not null then
    insert into public.sis_enrollments (student_id, school_year_id, program,
                                        enrollment_status, enrolled_at, is_primary)
    select v_student_id, v_year_id, 'academy_virtual', 'enrolled',
           date '2026-08-01', true
    where not exists (
      select 1 from public.sis_enrollments e
       where e.student_id = v_student_id
         and e.school_year_id = v_year_id
         and e.program = 'academy_virtual'
    );
  else
    raise notice 'No current school year at The Academy Virtual — enrolment row skipped.';
  end if;

  raise notice 'Created Wren Peters: student %, number %', v_student_id, v_number;
end $$;

-- Both Peters children, and what is still missing on them.
select s.first_name || ' ' || s.last_name as student,
       s.student_number, s.grade_level, s.date_of_birth, s.status,
       f.billing_email, f.billing_phone,
       case when s.date_of_birth is null or s.grade_level is null
            then 'NEEDS DOB / GRADE' else '' end as todo
from public.students s
left join public.families f on f.id = s.family_id
join public.schools sc on sc.id = s.school_id
where sc.name ilike '%academy virtual%'
  and lower(s.last_name) like 'peters%'
order by s.first_name;

-- Virtual should now read 14.
select count(*) as active_virtual_students
from public.students s
join public.schools sc on sc.id = s.school_id
where sc.name ilike '%academy virtual%' and s.status = 'active';

commit;
