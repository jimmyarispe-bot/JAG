-- 322 — Step Up award IDs and a constrained scholarship programme per student.
--
-- WHY. The Step Up For Students Agreed-Upon Procedures for 2025-26 require a
-- CPA to produce, per scholarship programme, the number of students and the
-- total tuition and fees received "as posted in the student account"
-- (Section IV.A), and to sample students from each programme the school
-- participates in (Section IV.B.1). Both need the programme to be an exact
-- value, not free text — FTC, FES-EO, FES-UA and FTC-PEP are named in
-- Appendix 1 and the report is organised around them.
--
-- The award ID is the key that ties a family to a Step Up disbursement. It is
-- required on the FL admissions application, and reconciling it by hand is what
-- the September 2026 Step Up reconciliation actually consisted of.
-- `ssis_student_funding_records` had nowhere to put it: `metadata` is a
-- freeform Json column and `source_entity_id` means something else.
--
-- WHAT THIS DOES NOT DO. It does not touch payments. Scholarship money already
-- has two homes — `scholarship_award_payments` and
-- `state_funding_received_payments` — and adding a third place for the same
-- fact would make the AUP harder to answer, not easier. Which of those two is
-- authoritative is a separate decision and is recorded in the AUP readiness
-- notes rather than guessed at here.

-- 1. The four programmes the AUP names. school_id is null: these are Florida
--    state programmes, not the property of one campus.
insert into public.funding_program_catalog
  (program_code, program_name, funding_agency, state_code, payment_schedule,
   export_format, required_documents, is_active, school_id)
values
  ('FTC',     'Florida Tax Credit Scholarship',
   'Step Up For Students', 'FL', 'quarterly', 'csv', '[]'::jsonb, true, null),
  ('FES-EO',  'Family Empowerment Scholarship for Educational Options',
   'Step Up For Students', 'FL', 'quarterly', 'csv', '[]'::jsonb, true, null),
  ('FES-UA',  'Family Empowerment Scholarship for Students with Unique Abilities',
   'Step Up For Students', 'FL', 'quarterly', 'csv', '[]'::jsonb, true, null),
  ('FTC-PEP', 'Personalized Education Program',
   'Step Up For Students', 'FL', 'quarterly', 'csv', '[]'::jsonb, true, null)
on conflict do nothing;

-- 2. The award ID, and a real foreign key to the programme.
alter table public.ssis_student_funding_records
  add column if not exists award_id text,
  add column if not exists funding_program_id uuid
    references public.funding_program_catalog(id);

comment on column public.ssis_student_funding_records.award_id is
  'Step Up Award ID as it appears on the family''s award letter and in the Step Up platform. The join key for reconciling a disbursement to a student. Required on the FL admissions application.';

comment on column public.ssis_student_funding_records.funding_program_id is
  'The scholarship programme, constrained to funding_program_catalog. AUP Section IV.A reports counts and totals per programme, so this must be exact rather than the free-text program_name.';

-- Looking a student up by award ID is what reconciliation does; and the same
-- award should not be recorded twice for one student and year.
create index if not exists ssis_student_funding_records_award_id_idx
  on public.ssis_student_funding_records (award_id)
  where award_id is not null;

create unique index if not exists ssis_student_funding_records_award_unique_idx
  on public.ssis_student_funding_records (student_id, funding_program_id, award_year)
  where funding_program_id is not null and award_year is not null;

-- 3. What exists now, so the next step starts from a fact rather than a guess.
select
  (select count(*) from public.funding_program_catalog
    where funding_agency = 'Step Up For Students') as step_up_programmes,
  (select count(*) from public.ssis_student_funding_records) as funding_records,
  (select count(*) from public.ssis_student_funding_records
    where award_id is not null) as with_award_id,
  (select count(*) from public.ssis_student_funding_records
    where funding_program_id is not null) as with_programme;
