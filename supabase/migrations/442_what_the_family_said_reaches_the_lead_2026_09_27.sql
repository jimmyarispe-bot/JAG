-- 442_what_the_family_said_reaches_the_lead_2026_09_27.sql
--
-- Four columns on `admissions_leads`, so that what a family tells us about
-- their state money is something the platform knows rather than something
-- buried in an answers table.
--
-- THE GAP. Migration 439 added eleven questions asking an out-of-state family
-- which state programme pays, how much, and what the award number is. Every
-- one of those answers goes to `admissions_interest_answers` and nowhere
-- else. `submit.ts` maps a fixed list of fields onto the lead through
-- `submit_public_admissions_inquiry`, and neither the residency answer nor any
-- of the funding answers is on that list - `student_residency_state` is not
-- even in `encodeLeadReferralExtras`, the convenience copy that folds the
-- unbound answers onto `referral_source` so a human can at least read them.
--
-- So a Texas family could tell us `tx_esa` for $10,000 and no lead, no student
-- record, no board filter and no report could see it. The form asks and the
-- system forgets. Same shape as the school-of-record problem: the data was
-- right and nothing downstream could reach it.
--
-- Uploads are not affected - `attachInquiryDocuments` already writes them to
-- `application_documents` against the lead, and that has always worked.
--
-- WHY THE LEAD AND NOT A FUNDING TABLE. `state_funding_verifications` is the
-- natural home, but its `application_id` is NOT NULL and an inquiry has no
-- application yet. `state_funding_awards`, which `state-funding.ts` declares a
-- TypeScript interface for, does not exist in any migration - the type is
-- describing a table nobody built. The lead is the only record that exists at
-- inquiry time, so the lead is where these land, and the application-stage
-- funding row can be seeded from them later.
--
-- THE FOUR COLUMNS
--
--   residency_state             The student's state of LEGAL residence, as the
--                               family answered it. Lower-case full name, the
--                               same values the form's rules use - 'georgia',
--                               'texas', 'other'. Not an abbreviation, because
--                               the form's conditions are written against
--                               these strings and two spellings of one fact is
--                               how they drift apart.
--
--   state_funding_program_code  Foreign key to `funding_program_catalog`. The
--                               convention migration 325 set: the form's option
--                               value IS the programme code, so the answer maps
--                               to a catalogue row exactly instead of
--                               string-matching a label in June.
--
--   state_funding_award_amount  The annual award on the letter.
--
--   state_funding_award_id      The state's award or account number, where the
--                               state issues one. Most do not. NULL here is
--                               normal and means nothing is wrong.
--
-- WHAT IS DELIBERATELY NOT MAPPED. Georgia. `ga_scholarships` is a multiselect
-- whose values are not catalogue codes (`ga_special_needs`, `ga_goal`,
-- `academy_based`), one of them is our own scholarship rather than state
-- money, and a family can tick two. Collapsing that into one programme code is
-- a judgement about money, so it waits for Jimmy rather than being guessed at
-- here. Florida IS mapped: `fl_scholarship_program` is single-valued and its
-- values are already catalogue codes.
--
-- Safe to re-run. The backfill only writes where the column is still null, so
-- a value a human has since corrected by hand is never overwritten.

alter table public.admissions_leads
  add column if not exists residency_state text,
  add column if not exists state_funding_program_code text,
  add column if not exists state_funding_award_amount numeric(12, 2),
  add column if not exists state_funding_award_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admissions_leads_state_funding_program_fk'
  ) then
    alter table public.admissions_leads
      add constraint admissions_leads_state_funding_program_fk
      foreign key (state_funding_program_code)
      references public.funding_program_catalog(program_code)
      on update cascade on delete set null;
  end if;
end $$;

create index if not exists idx_admissions_leads_residency_state
  on public.admissions_leads (residency_state)
  where residency_state is not null;

create index if not exists idx_admissions_leads_state_funding_program
  on public.admissions_leads (state_funding_program_code)
  where state_funding_program_code is not null;

comment on column public.admissions_leads.residency_state is
  'State of the student''s LEGAL residence as answered on the interest form. Lower-case full name matching the form option values (georgia, florida, texas, ..., other). Decides which state''s questions the family is asked and, for state-funded students, which campus they are registered at.';
comment on column public.admissions_leads.state_funding_program_code is
  'The state programme paying, as a funding_program_catalog.program_code. NULL means no state money or none told to us yet.';
comment on column public.admissions_leads.state_funding_award_id is
  'The state''s award or account number. NULL is the common case - most states publish no identifier a family can quote.';

-- ── backfill: submissions already recorded ───────────────────────────────────
-- The most recent submission per lead wins. Answers are jsonb; `#>> '{}'`
-- unwraps a scalar string without the quotes that `::text` would leave on.

with latest as (
  select distinct on (s.lead_id) s.id as submission_id, s.lead_id
    from public.admissions_interest_submissions s
   where s.lead_id is not null
   order by s.lead_id, s.submitted_at desc
),
answer as (
  select l.lead_id, a.question_key, a.value #>> '{}' as val
    from latest l
    join public.admissions_interest_answers a on a.submission_id = l.submission_id
   where a.question_key in (
     'student_residency_state',
     'state_funding_program', 'state_funding_award_amount', 'state_funding_identifier',
     'fl_scholarship_program', 'fl_scholarship_amount', 'fl_step_up_award_id'
   )
),
folded as (
  select lead_id,
         max(val) filter (where question_key = 'student_residency_state')  as residency,
         coalesce(
           max(val) filter (where question_key = 'state_funding_program'),
           nullif(max(val) filter (where question_key = 'fl_scholarship_program'), 'none')
         ) as program_code,
         coalesce(
           max(val) filter (where question_key = 'state_funding_award_amount'),
           max(val) filter (where question_key = 'fl_scholarship_amount')
         ) as amount,
         coalesce(
           max(val) filter (where question_key = 'state_funding_identifier'),
           max(val) filter (where question_key = 'fl_step_up_award_id')
         ) as award_id
    from answer
   group by lead_id
)
update public.admissions_leads t
   set residency_state            = coalesce(t.residency_state, nullif(f.residency, '')),
       state_funding_program_code = coalesce(
         t.state_funding_program_code,
         (select c.program_code from public.funding_program_catalog c
           where c.program_code = f.program_code)),
       state_funding_award_amount = coalesce(
         t.state_funding_award_amount,
         case when f.amount ~ '^[0-9]+(\.[0-9]+)?$' then f.amount::numeric else null end),
       state_funding_award_id     = coalesce(t.state_funding_award_id, nullif(f.award_id, '')),
       updated_at                 = now()
  from folded f
 where t.id = f.lead_id
   and (t.residency_state is null
     or t.state_funding_program_code is null
     or t.state_funding_award_amount is null
     or t.state_funding_award_id is null);

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'columns'          : four rows. If fewer, the alter did not take.
-- 'backfilled'       : how many leads now carry each fact. Zero residency is
--                      expected today - v28 went live tonight and no family has
--                      answered the residency question yet. Zero programme is
--                      NOT expected if any Florida family ever picked one.
-- 'unmapped program' : MUST BE EMPTY. A programme code on a lead that is not in
--                      the catalogue. The foreign key should make this
--                      impossible; it is checked because "impossible" is what
--                      the last three of these said.
-- 'leads with state money' : every lead now carrying a programme, so you can
--                      see whether the answer is the one the family gave.

select 'columns'::text as finding, column_name as detail, data_type as detail_2
  from information_schema.columns
 where table_schema = 'public' and table_name = 'admissions_leads'
   and column_name in ('residency_state', 'state_funding_program_code',
                       'state_funding_award_amount', 'state_funding_award_id')
union all
select 'backfilled', 'residency_state', count(*)::text
  from public.admissions_leads where residency_state is not null
union all
select 'backfilled', 'state_funding_program_code', count(*)::text
  from public.admissions_leads where state_funding_program_code is not null
union all
select 'backfilled', 'state_funding_award_amount', count(*)::text
  from public.admissions_leads where state_funding_award_amount is not null
union all
select 'backfilled', 'state_funding_award_id', count(*)::text
  from public.admissions_leads where state_funding_award_id is not null
union all
select 'unmapped program', t.state_funding_program_code, t.first_name || ' ' || t.last_name
  from public.admissions_leads t
 where t.state_funding_program_code is not null
   and not exists (select 1 from public.funding_program_catalog c
                    where c.program_code = t.state_funding_program_code)
union all
select 'leads with state money',
       t.first_name || ' ' || t.last_name,
       t.state_funding_program_code
         || coalesce(' / ' || t.state_funding_award_amount::text, '')
         || coalesce(' / ' || t.residency_state, '')
  from public.admissions_leads t
 where t.state_funding_program_code is not null
order by 1, 2;
