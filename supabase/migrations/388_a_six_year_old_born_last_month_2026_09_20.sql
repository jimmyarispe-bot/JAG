-- Carwyn Williams was born in 2014, not 2026.
--
-- His record read date_of_birth 2026-08-11 - one month old, in the sixth grade,
-- taking maths tutoring. His Admissions/Registration Application says 11 August
-- 2014, and the form's own "My son/daughter is - 11 years old" agrees with it.
-- Somebody typed 2026 for 2014 and no screen, report or check has queried it
-- since.
--
-- HE WAS ALREADY IN THE JAG. Migration 386 did not create him - his
-- student_number is 000019, issued before Fiona Drescher's 000020 this morning,
-- so the row predates today. The not-exists guard in 386 correctly declined to
-- make a second Carwyn, and its enrolment half did the useful work. He was
-- never found earlier because the schedule prints him as "Carwyn 5:30 Math 8x",
-- one word, and a single name is not something to match a child on.
--
-- AND THEN THE SAME QUESTION ASKED OF EVERYONE ELSE.
--
-- One wrong date is a typo. The interesting question is how many others there
-- are, and nothing in this platform has ever asked. The report below is that
-- question: a date of birth in the future, or one implying a child under three
-- or over twenty-five, is not a plausible date for an enrolled student.
--
-- This is the shape the verification process Jimmy asked for should take. Not
-- "count the rows" but "state what must be true and list what is not".

begin;

update public.students
   set date_of_birth = date '2014-08-11',
       updated_at    = now()
 where lower(trim(first_name)) = 'carwyn'
   and lower(trim(last_name))  = 'williams'
   and date_of_birth is distinct from date '2014-08-11';

commit;

-- =========================================================================
-- REPORT 1 - Carwyn
-- =========================================================================

select first_name, last_name, date_of_birth, grade_level, student_number,
       date_part('year', age(date_of_birth))::int as age_now,
       created_at::date as record_created
from public.students
where lower(trim(first_name)) = 'carwyn' and lower(trim(last_name)) = 'williams';

-- =========================================================================
-- REPORT 2 - every date of birth that cannot be right
-- =========================================================================
--
-- Empty is the good answer. Anything listed is a real child whose age the
-- platform has wrong - which decides grade placement, funding eligibility and,
-- for a state scholarship, whether a claim is even valid.

select st.first_name,
       st.last_name,
       st.date_of_birth,
       st.grade_level,
       sch.name as school,
       date_part('year', age(st.date_of_birth))::int as age_implied,
       case
         when st.date_of_birth > current_date then 'BORN IN THE FUTURE'
         when age(st.date_of_birth) < interval '3 years'  then 'too young to be enrolled'
         when age(st.date_of_birth) > interval '25 years' then 'too old for a school roster'
       end as problem
from public.students st
left join public.schools sch on sch.id = st.school_id
where st.date_of_birth is not null
  and (st.date_of_birth > current_date
       or age(st.date_of_birth) < interval '3 years'
       or age(st.date_of_birth) > interval '25 years')
order by st.date_of_birth;
