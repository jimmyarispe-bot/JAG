-- ============================================================================
-- 566  THE DECISION FROM THE LETTER - THE SCHEMA
--      17 October 2026
-- ============================================================================
--
-- RUN THIS BEFORE THE CODE DEPLOYS. The letter engine's lead projection reads
-- admissions_leads.decision_token from this commit on; a deploy that lands
-- first fails every letter's lookup on a column that does not exist.
--
-- 567 (the three letters) runs AFTER the deploy, for the opposite reason: its
-- bodies carry merge fields the old code does not know, and an unknown field
-- is mailed as literal braces.
--
-- Two things:
--
-- 1. admissions_leads.decision_token - the authority behind the answer
--    buttons on the three "Decision needed" letters (/decide/<token>/<answer>).
--    Defaulted and backfilled exactly as skip_stage_token was in 557.
--
-- 2. A gate answered from a letter has nobody signed in, and
--    admissions_decision_gates_answer_complete demanded answered_by. It now
--    accepts a null answered_by ONLY when answered_via = 'email_link', so a
--    gate answered in JAG still has to name the person. The row then says
--    where the letter went (answer_notes), not who pressed - the trade Jimmy
--    accepted when the token pages were designed.
-- ============================================================================

begin;

alter table public.admissions_leads
  add column if not exists decision_token text
  default encode(gen_random_bytes(32), 'hex');

update public.admissions_leads
   set decision_token = encode(gen_random_bytes(32), 'hex')
 where decision_token is null;

create unique index if not exists idx_admissions_leads_decision_token
  on public.admissions_leads(decision_token)
  where decision_token is not null;

comment on column public.admissions_leads.decision_token is
  'Opens /decide/<token>/<answer>, the page behind the answer buttons on the '
  'three Decision needed letters (migration 567). No sign-in; the page reads '
  'the live stage and asks once more before anything is sent.';

alter table public.admissions_decision_gates
  add column if not exists answered_via text not null default 'jag';

alter table public.admissions_decision_gates
  drop constraint if exists admissions_decision_gates_answered_via_check;
alter table public.admissions_decision_gates
  add constraint admissions_decision_gates_answered_via_check
  check (answered_via in ('jag', 'email_link'));

alter table public.admissions_decision_gates
  drop constraint admissions_decision_gates_answer_complete;
alter table public.admissions_decision_gates
  add constraint admissions_decision_gates_answer_complete check (
    (status = 'pending' and answer is null and answered_by is null and answered_at is null)
    or (status = 'answered' and answer is not null and answered_at is not null
        and (answered_by is not null or answered_via = 'email_link'))
    or status = 'withdrawn'
  );

do $$
declare n integer;
begin
  select count(*) into n from public.admissions_leads where decision_token is null;
  if n > 0 then
    raise exception 'Refusing: % lead(s) still have no decision_token.', n;
  end if;
end $$;

commit;

select count(*) as leads_with_token from public.admissions_leads where decision_token is not null;
