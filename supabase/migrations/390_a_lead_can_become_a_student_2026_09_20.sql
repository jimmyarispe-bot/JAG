-- A family can enrol without having filled in an application.
--
-- MEASURED, 20 September 2026:
--
--   admissions_applications              0 rows
--   sis_admissions_conversions           0 rows
--   students with an admissions_lead_id  2 of 102
--   admissions_leads                   315
--
-- The admissions-to-student pipeline has never run. Not once, for anybody.
--
-- WHY, AND IT IS NOT NEGLIGENCE.
--
-- sis_admissions_conversions.application_id is NOT NULL, so a conversion
-- requires a row in admissions_applications. There is no application form in
-- the JAG, so there are no applications, so conversion is impossible. The front
-- door is bolted from the inside, and every student in this network arrived
-- through the side door because it is the only one that opens.
--
-- Julian Oubre Towa's family completed and paid for an Admissions/Registration
-- Application on 15 September, into a table that has never held a single row.
--
-- WHAT THIS COSTS TODAY. Three sections of every student profile - Admissions,
-- Documents and Scholarships - load through getStudentConversion(), which reads
-- this empty table. On all 102 student records those three tabs have shown
-- nothing since the day they were built, and always would have. The page
-- renders, the tab opens, and there is nothing in it. No error, nothing to
-- notice.
--
-- WHAT THIS CHANGES. application_id becomes nullable, so a LEAD can convert
-- straight to a student. That matches what actually happens here: families
-- enquire, are accepted, and enrol, and the application step exists only on
-- paper that never reaches the platform.
--
-- The unique constraint on application_id STAYS. Postgres treats NULLs as
-- distinct, so it still prevents one application converting twice while
-- allowing any number of application-less conversions.
--
-- AND A NEW ONE: one conversion per student. Without it, converting the same
-- child twice creates a second family, a second guardian and a duplicate
-- enrolment - all of it silently, because each insert succeeds on its own.
--
-- NOT added: a unique on lead_id. One enquiry covering siblings would need to
-- convert twice, and nothing here knows whether that happens. A constraint that
-- guesses is worse than one that waits.
--
-- THIS ALONE MAKES NOTHING APPEAR. It unlocks a door. Somebody still has to
-- walk through it for real families, and the three tabs still have to read
-- something. That is the work this migration makes possible, not the work
-- itself.

begin;

alter table public.sis_admissions_conversions
  alter column application_id drop not null;

comment on column public.sis_admissions_conversions.application_id is
  'The application this conversion came from, when there was one. NULL is normal '
  'and expected: a family can be accepted and enrolled without an application '
  'ever existing in the platform.';

create unique index if not exists idx_sis_conversions_one_per_student
  on public.sis_admissions_conversions (student_id);

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- application_id must read is_nullable = YES. The counts below are the
-- starting line: 0 conversions today, and whatever exists after a real
-- conversion is run is the proof that the door opened.

select 'application_id nullable' as check,
       is_nullable as answer
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sis_admissions_conversions'
  and column_name = 'application_id'

union all

select 'conversions on record', count(*)::text
from public.sis_admissions_conversions

union all

select 'students linked to a lead', count(*)::text
from public.students where admissions_lead_id is not null

union all

select 'leads at a stage that should convert', count(*)::text
from public.admissions_leads
where lead_stage in ('accepted', 'enrolled');
