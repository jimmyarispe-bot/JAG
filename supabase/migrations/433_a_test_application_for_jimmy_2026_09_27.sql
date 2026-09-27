-- A test family, so the application can be walked as a parent walks it.
--
-- Jimmy, 26 September: set up the invited application so he can see it.
--
-- WHY A TEST LEAD RATHER THAN A REAL ONE. Minting a token against a real
-- family's lead is harmless by itself, but the point of the walk is to press
-- the buttons - and pressing Submit on a real lead moves that family's stage,
-- marks their application received and emails them the shadow-days invitation
-- for real. Lisa Roy's application was submitted twice by accident already.
-- A test lead can be submitted, broken and thrown away.
--
-- IT IS MARKED AS A TEST IN THREE PLACES - the child's surname, the notes, and
-- a guardian email that is Jimmy's own. The last test record in this system
-- (a teacher) took two migrations to remove because nothing on the row said
-- what it was. The archive statement is at the bottom of this file, ready.
--
-- THE CAMPUS IS GEORGIA, because the Georgia path is the one with the most
-- conditional questions behind it - GA GOAL, Academy-Based, Special Needs -
-- and therefore the one where a walk teaches the most.
--
-- Safe to re-run: the insert is guarded, and the token function returns an
-- existing token rather than replacing it, so a link already open keeps
-- working.

do $$
declare
  v_ga uuid;
  v_n  integer;
begin
  select count(*) into v_n from public.schools where lower(trim(name)) = 'the academy ga';
  if v_n <> 1 then
    raise exception 'Expected exactly 1 school named The Academy GA, found %.', v_n;
  end if;
  select id into v_ga from public.schools where lower(trim(name)) = 'the academy ga';

  insert into public.admissions_leads (
    school_id, first_name, last_name,
    current_grade, referral_source,
    guardian_first_name, guardian_last_name, guardian_email,
    lead_stage, inquiry_date, notes
  )
  select
    v_ga, 'Walkthrough', 'ZZ-TEST',
    '5th_grade', 'Other',
    'Jimmy', 'Arispe', 'jimmy.arispe@gmail.com',
    'application_started', current_date,
    'TEST RECORD - not a real family. Created 27 September 2026 so the invited '
    'application can be walked end to end. Archive when finished; the statement '
    'is in migration 433.'
  where not exists (
    select 1 from public.admissions_leads
     where guardian_email = 'jimmy.arispe@gmail.com'
       and last_name = 'ZZ-TEST'
  );
end $$;

-- ── THE LINK ─────────────────────────────────────────────────────────────────
--
-- OPEN IT IN A PRIVATE WINDOW. A normal window carries the staff session, and
-- the whole claim being tested is that a family with no account can open this.
--
-- token_length must read 64. If it does not, stop - token-access.ts checks the
-- shape before it touches the database and the page will say the link is no
-- longer active.

select
  'Open this in a private window' as instruction,
  'https://theacademyway.thejag.org/apply/start/' ||
    public.mint_application_access_token(l.id) as url,
  length(public.mint_application_access_token(l.id)) as token_length,
  l.id as lead_id
  from public.admissions_leads l
 where l.guardian_email = 'jimmy.arispe@gmail.com'
   and l.last_name = 'ZZ-TEST';

-- ── WHEN YOU ARE DONE, ARCHIVE IT ────────────────────────────────────────────
--
-- Run this on its own afterwards. It leaves the row for the record and takes
-- it out of every working list, which is what archived means here.
--
-- update public.admissions_leads
--    set lead_stage = 'declined',
--        archived_at = now(),
--        notes = coalesce(notes, '') || chr(10) || 'Walk finished; archived.'
--  where guardian_email = 'jimmy.arispe@gmail.com'
--    and last_name = 'ZZ-TEST';
