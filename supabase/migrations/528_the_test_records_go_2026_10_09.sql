-- 528_the_test_records_go_2026_10_09.sql
--
-- Jimmy, 9 October 2026: "any student or parent inquiry or application with
-- the word test or disregard should be deleted from the jag"
--
-- ELEVEN LEADS, NAMED BY ID, NOT BY PATTERN
--
-- The pattern found them. The pattern is NOT what deletes them. A
-- like '%test%' left in a migration is a loaded gun pointed at the next
-- family called Testa, Contreras-Test or anyone with "latest" in an email
-- address, and it fires the next time somebody re-runs this file. Every id
-- below was read, by name, before it was written down.
--
-- WHAT GOES
--
--   created     child                                       apps  letters
--   ---------------------------------------------------------------------
--   14 Sep      test disregard test disregard                  0        9
--   24 Sep      disregard this test arispe                     1        7
--   27 Sep      Walkthrough ZZ-TEST                            1        0
--   28 Sep      test disregard test disregard                  0        5
--   29 Sep      test first name test last name                 1       10
--   30 Sep      Danni Test            (dbtreu@gmail.com)       0        4
--    5 Oct      test disregard jimmy test disregard arispe     0        6
--    5 Oct      test jimmy test arispe                         0        6
--    5 Oct      test jimmy test arispe                         0        6
--    5 Oct      jimmy test arispe test                         0        4
--    7 Oct      disregard test wed disregard test wed          0        4
--
-- Ten carry jimmy.arispe@gmail.com. The eleventh is Danni's, created
-- 30 September, and it matches Jimmy's rule exactly - the child is called
-- "Danni Test". It is included. TO KEEP IT, comment out the single line
-- marked DANNI below and nothing else changes.
--
-- WHAT IT TAKES WITH IT, measured rather than assumed:
--
--   3 applications
--   61 letters already recorded
--   14 LETTERS STILL QUEUED TO SEND and 7 parent reminders still waiting.
--      Those are the ones that matter. Every one of them was going to fire
--      at a test record on a schedule, and this is what stops them.
--   1 enrollment packet
--   plus gates, decisions, tasks, notes, stage history and tokens, through
--   23 cascading foreign keys.
--
-- WHAT WOULD HAVE BLOCKED IT, AND DOES NOT
--
--   sis_admissions_conversions.lead_id is ON DELETE RESTRICT - a lead that
--   ever became an enrolment cannot be deleted. Checked: 0 of the eleven.
--
--   students.admissions_lead_id and sis_enrollments.lead_id are ON DELETE
--   SET NULL, which would silently cut a real child loose from their lead
--   rather than refuse. Checked: 0 of the eleven. The pre-flight below
--   checks all three again at run time and refuses rather than proceeding,
--   because this file could be run on a day when that is no longer true.
--
-- THERE IS NO UNDO. Supabase Pro keeps daily backups with 7 days of
-- retention, bought this morning, so the floor exists - but restoring one is
-- a whole-database operation, not a row.

begin;

do $$
declare
  v_ids uuid[] := array[
    'd32d4f1f-4b8f-48e3-a99a-a528028ad201',  -- 14 Sep  test disregard test disregard
    '93f009e0-7b84-4f2b-af0e-a19198d32d1b',  -- 24 Sep  disregard this test arispe
    '31129b42-e432-4c7a-bfbc-46442b3b32d2',  -- 27 Sep  Walkthrough ZZ-TEST
    '94825ae3-6563-48ce-b702-6ca44e66b395',  -- 28 Sep  test disregard test disregard
    '6735a3ee-dd9e-41a8-9ed2-5f77452a60ea',  -- 29 Sep  test first name test last name
    'e47d67f3-965e-4efe-bb79-5b66a97a8203',  -- 30 Sep  Danni Test            <-- DANNI
    '0166791e-850f-4448-933c-bfa6e574f7b5',  --  5 Oct  test disregard jimmy test disregard arispe
    '7d908be8-ce00-476e-8d1e-ebe8ed8cd200',  --  5 Oct  test jimmy test arispe
    '7b03800b-9a54-4ffe-89b5-f4d3957c4234',  --  5 Oct  test jimmy test arispe
    '8202e5c7-725d-4ddb-aa43-d8c4973dc5cf',  --  5 Oct  jimmy test arispe test
    '16c4fb21-38bd-4c7c-b3ab-57087ca3afaa'   --  7 Oct  disregard test wed disregard test wed
  ]::uuid[];
  v_found int;
  v_bad   int;
  v_q     int;
  v_r     int;
begin
  -- --------------------------------------------------------------------
  -- PRE-FLIGHT. Every one of these refuses rather than deleting.
  -- --------------------------------------------------------------------

  /* 1. Each id still exists AND still reads as a test record. If somebody
        renamed one to a real child between the list being made and this
        running, stop. */
  select count(*) into v_found
    from public.admissions_leads l
   where l.id = any(v_ids)
     and lower(
           coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'') || ' ' ||
           coalesce(l.guardian_first_name,'') || ' ' || coalesce(l.guardian_last_name,'') || ' ' ||
           coalesce(l.guardian_email,'')
         ) ~ '(test|disregard)';

  if v_found <> array_length(v_ids, 1) then
    raise exception
      'Expected % leads still reading as test records, found %. Nothing deleted - re-run find_the_test_records.sql and look at what changed.',
      array_length(v_ids, 1), v_found;
  end if;

  /* 2. None has become an enrolment. */
  select count(*) into v_bad from public.sis_admissions_conversions where lead_id = any(v_ids);
  if v_bad > 0 then
    raise exception '% of these leads converted to an enrolment. Nothing deleted.', v_bad;
  end if;

  /* 3. No real child hangs off one. SET NULL would cut them loose silently. */
  select count(*) into v_bad from public.students where admissions_lead_id = any(v_ids);
  if v_bad > 0 then
    raise exception '% student records point at these leads. Nothing deleted.', v_bad;
  end if;

  select count(*) into v_bad from public.sis_enrollments where lead_id = any(v_ids);
  if v_bad > 0 then
    raise exception '% enrolments point at these leads. Nothing deleted.', v_bad;
  end if;

  -- --------------------------------------------------------------------
  -- WHAT IS ABOUT TO STOP SENDING - said out loud before it happens
  -- --------------------------------------------------------------------
  select count(*) into v_q from public.admissions_communication_queue where lead_id = any(v_ids);
  select count(*) into v_r from public.admissions_parent_reminders     where lead_id = any(v_ids);
  raise notice 'Deleting % leads. % queued letters and % parent reminders will stop.', v_found, v_q, v_r;

  delete from public.admissions_leads where id = any(v_ids);

  raise notice 'Done. % leads deleted.', v_found;
end $$;

commit;

-- ============================================================================
-- AFTERWARDS
-- ============================================================================
--
-- Check nothing is left:
--
--     C:\Projects\JAG-GA-CLEAN\find_the_test_records.sql
--
-- It should return zero rows.
--
-- WHAT THIS DOES NOT STOP. The next test record. The public inquiry form at
-- https://theacademyway.thejag.org/apply takes any name, which is correct -
-- a form that argues with a parent about her own child's name is worse than
-- one that collects eleven of these in three weeks.
--
-- What is missing is a way to mark a lead as a test ON PURPOSE, so it never
-- enters the pipeline, never queues a letter and never needs a migration to
-- remove. Fourteen letters were queued and waiting to fire at records that
-- were never real. That is the actual fault here, and it is a build, not a
-- cleanup.
