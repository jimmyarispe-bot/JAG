-- 529_the_school_leader_sees_what_went_out_in_her_name_2026_10_09.sql
--
-- Heather Badger-Brown forwarded a letter to Jimmy on 9 October with four
-- words on top of it:
--
--     "I wasn't invited to this interview. Jag wants my job."
--
-- The letter went to Lianet Cicero about her daughter Alexandra. It was sent
-- FROM heather.brown@theacademyway.org. It was signed "The Academy Virtual
-- Admissions". Heather had never seen it.
--
-- Jimmy, the same day: "also anything that is sent from/on behalf of the
-- school to a parent needs to have the school leader blind copied in."
-- Confirmed on the 9th: the four people below, every letter to a family, and
-- a real BCC rather than a morning digest.
--
-- WHAT EXISTS TODAY AND WHY IT IS NOT THIS. A school leader gets SEPARATE
-- staff notices at some steps - new inquiry, interest meeting booked,
-- decision needed. Different wording, different moments, only where somebody
-- wired one. She has never seen the words her own name was signed to.
--
-- ============================================================================
-- A COLUMN OF ITS OWN, NOT admissions_contact_email
-- ============================================================================
--
-- schools.admissions_contact_email ALREADY holds these exact four people.
-- Reusing it would have worked today and been wrong tomorrow.
--
-- That column answers "who does a parent reply to, and whose calendar do they
-- book". This one answers "who is accountable for what this school says". They
-- are the same person at all four campuses in October 2026 and they are not
-- the same question. Point a reply-to at an admissions assistant one morning
-- and the school leader silently stops being copied on her own mail.
--
-- That is precisely the fault corrected this morning in migration 525, where
-- one person's name and work address lived in two columns and drifted. The
-- lesson there was not "deduplicate everything" - it was "one column, one
-- question". Two questions get two columns.
--
-- NULL MEANS NOBODY IS COPIED. Not "fall back to the admissions contact".
-- A guessed BCC is a person reading a family's mail because a column was
-- empty, and there is no undoing that.

begin;

alter table public.schools
  add column if not exists school_leader_bcc_email text;

comment on column public.schools.school_leader_bcc_email is
  'The school leader blind-copied on every letter this school sends a family. Added 9 October 2026 after Heather Badger-Brown found a letter sent over her own name that she had never seen. Deliberately NOT admissions_contact_email: that column answers who a parent replies to, this one answers who is accountable for what the school says. Null means nobody is copied - never fall back to another address.';

-- ============================================================================
-- THE FOUR, AS JIMMY NAMED THEM
-- ============================================================================
--
-- Nina has GA. Danni has FL. Heather has HS and Virtual - two schools, one
-- person, two rows, because the column belongs to the school and not to her.

update public.schools set school_leader_bcc_email = 'nina.gaddy@theacademyga.org'
 where name = 'The Academy GA';

update public.schools set school_leader_bcc_email = 'danni.treu@theacademyfl.org'
 where name = 'The Academy FL';

update public.schools set school_leader_bcc_email = 'heather.brown@theacademyway.org'
 where name in ('The Academy HS', 'The Academy Virtual');

do $$
declare v_missing int;
begin
  select count(*) into v_missing
    from public.schools
   where name in ('The Academy FL','The Academy GA','The Academy HS','The Academy Virtual')
     and coalesce(btrim(school_leader_bcc_email), '') = '';
  if v_missing > 0 then
    raise exception '% of the four campuses has no school leader. Nothing is half-configured here.', v_missing;
  end if;
  raise notice 'All four campuses have a school leader to copy.';
end $$;

commit;

-- ============================================================================
-- RUN THIS BEFORE THE CODE SHIPS, NOT AFTER
-- ============================================================================
--
-- The deploy that reads this column adds it to LEAD_MERGE_CONTEXT_COLS, the
-- projection behind every admissions letter. Ship that against a database
-- without the column and Postgres refuses the whole select - every lead
-- query, not just the BCC. Migration first, then claude-ship.
--
-- ============================================================================
-- WHAT IT WILL MEAN FOR HER INBOX
-- ============================================================================
--
-- Jimmy chose the strict reading of his own sentence: EVERY letter to a
-- family, not only the ones carrying her signature. So Heather is copied on
-- the application chasers at 24, 72 and 96 hours as well as the acceptances.
-- Two campuses' worth.
--
-- That is what was asked for and it is the right default - the quiet letters
-- are exactly the ones nobody notices going wrong, and "tomorrow at ." went
-- out for weeks. If it becomes too much, the narrowing is a filter on
-- template_key in one place, not a rebuild.
--
-- A STAFF NOTICE IS NOT BCC'd. She is already the recipient; copying her on
-- her own mail is noise. Only channel = 'email' - the family's letters.
