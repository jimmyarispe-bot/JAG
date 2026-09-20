-- Fiona Drescher, and the name a child goes by.
--
-- Two of the sixty-four children on the Fall 2026-2027 Virtual schedule had no
-- student record. Neither was a stranger: both had a signed enrolment contract
-- that arrived by Zoho Forms into Jimmy's email and never reached the platform.
--
-- ISRAEL COOKS was in the JAG the whole time. The schedule calls him Josiah, so
-- every search for "Josiah Cooks" found nothing. Jimmy, 19 September 2026:
-- "always go by name on any state records" - his Georgia Special Needs
-- Scholarship determination reads Israel Cooks, so that is the record, and
-- Josiah is what he is called. preferred_name is exactly the column for that.
--
-- FIONA DRESCHER had nowhere to live. Her contract is with The Academy NJ, LLC,
-- and there is no Academy NJ in the JAG - four schools exist: FL, GA, HS and
-- Virtual. Jimmy placed her at The Academy HS on 19 September.
--
-- A NUMBER, THE WAY EVERYONE ELSE GOT ONE. generate_student_number(school_id)
-- has existed since migration 078 and is called from exactly one place - the
-- admissions-to-SIS conversion - which is why migration 363 had to backfill 75
-- students who arrived any other way. Fiona is arriving another way, so this
-- calls it rather than leaving her as the seventy-sixth.
--
-- WHAT THIS DOES NOT DO, AND YOU SHOULD KNOW IT:
--
--   * No date of birth. It is not on Fiona's contract. She joins the 11 students
--     migration 363 counted as missing one.
--   * No guardian. Julia Dasaro - jdasaro218@gmail.com, 732-904-8221, 13 Forest
--     View Dr, Bayville NJ 08721 - cannot be linked: student_family_link needs a
--     row in public.users, and public.users.id references auth.users, so an
--     account cannot be conjured in SQL. Her mother's details exist on the
--     contract and nowhere in the platform. Note the surname differs from the
--     child's, which is precisely how a family becomes unfindable by search.
--   * No contract. Jimmy, 19 September: "move forward wo their contracts". Both
--     contracts on file are for 2025-2026 while both children are being taught
--     in 2026-2027.

begin;

-- =========================================================================
-- 1. THE NAME HE IS CALLED
-- =========================================================================

update public.students
   set preferred_name = 'Josiah',
       updated_at     = now()
 where id = '8be1e5ba-c998-41b5-aea6-b60171f883b3';

-- =========================================================================
-- 2. FIONA DRESCHER
-- =========================================================================
--
-- Keyed on name + school so a re-run updates rather than creating a second
-- Fiona. She is being taught right now, so 'enrolled' and 'active' rather than
-- the 'pending' default - a child in four classes is not a pending applicant.

insert into public.students
  (school_id, first_name, last_name, grade_level, status,
   enrollment_status, lifecycle_stage, school_year_id, student_number)
select s.id, 'Fiona', 'Drescher', '10', 'active',
       'enrolled', 'active', sy.id,
       public.generate_student_number(s.id)
from public.schools s
left join public.school_years sy
  on sy.school_id = s.id and sy.is_current
where lower(trim(s.name)) = 'the academy hs'
  and not exists (
    select 1 from public.students x
    where lower(trim(x.first_name)) = 'fiona'
      and lower(trim(x.last_name))  = 'drescher'
  );

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- Two rows. Israel Cooks must show preferred_name 'Josiah'; Fiona must show a
-- six-digit student_number and The Academy HS. A missing Fiona row means the
-- insert found an existing one - check which, rather than running it again.

select st.first_name,
       st.last_name,
       st.preferred_name,
       st.grade_level,
       st.student_number,
       st.enrollment_status,
       sch.name as school,
       st.date_of_birth,
       st.id
from public.students st
left join public.schools sch on sch.id = st.school_id
where st.id = '8be1e5ba-c998-41b5-aea6-b60171f883b3'
   or (lower(trim(st.first_name)) = 'fiona' and lower(trim(st.last_name)) = 'drescher')
order by st.last_name;
