-- JULIAN TOWA'S ANSWERS BELONG TO HIS OWN RECORD
--
-- 30 September 2026. Jimmy opened Julian's application link and found half
-- the required fields empty - preferred name, applying-for grade, residency
-- state, the four narrative questions, every programme question.
--
-- WHY THEY WERE EMPTY. prefillValuesForLead reads two things: eleven columns
-- on the LEAD ROW, and the family's own interest answers. Julian's accepted
-- record was created on 25 August, before the interest form existed, so it
-- has no answers at all - only the lead columns could fill, which is exactly
-- what Jimmy saw.
--
-- His mother's 21 answers DO exist. They are attached to a SECOND Julian
-- lead, created on 30 September when Jimmy sent her the inquiry link to see
-- what would happen. Same child, same campus, same guardian, different row.
--
-- WHAT THIS DOES. Re-points that submission at the accepted lead. One
-- UPDATE of one column. The answers themselves are not touched: they hang
-- off the submission, not off the lead.
--
-- WHY THIS IS SAFE FOR JULIAN AND WAS REFUSED FOR MADDOX MIXON. Prefill
-- takes the MOST RECENT submission only, and an answer beats the lead row -
-- including school_id. Julian's accepted lead has no submission to compete
-- with and today's inquiry named the same campus, The Academy Virtual, so
-- nothing can be overwritten with something else.
--
-- Maddox is the opposite on both counts: his accepted lead already carries
-- its own submission from 15 September with 25 answers, and today's inquiry
-- named The Academy GA while his accepted record is The Academy HS. Moving
-- it would make the GA answer the most recent one and silently move him
-- between campuses. Nothing is done for Maddox here.
--
-- THE DUPLICATE LEAD IS NOT DELETED. Deleting it would cascade and take the
-- four emails sent to his mother today with it. It is left where it is, now
-- with no submission on it, for somebody to close from the board.
--
-- Safe to re-run: after the first run there is nothing left to move.

begin;

do $$
declare
  v_keep uuid;
  v_dupe uuid;
  v_sub  uuid;
  v_n    integer;
begin

  -- ---------------------------------------------------------------------
  -- 1. Exactly one accepted Julian, and exactly one other. Anything else
  --    and nothing happens.
  -- ---------------------------------------------------------------------
  select count(*) into v_n from public.admissions_leads l
   where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%';
  if v_n <> 2 then
    raise exception
      'Expected exactly TWO Julian Towa leads, found %. Nothing moved.', v_n;
  end if;

  select l.id into v_keep from public.admissions_leads l
   where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%'
     and l.lead_stage = 'accepted';
  if v_keep is null then
    raise exception 'No accepted Julian Towa lead. Nothing moved.';
  end if;

  select l.id into v_dupe from public.admissions_leads l
   where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%'
     and l.id <> v_keep;

  -- ---------------------------------------------------------------------
  -- 2. Same campus, or stop. This is the check that makes the move safe:
  --    an answer beats the lead row, so a submission from another campus
  --    would move the child between schools without anybody deciding to.
  -- ---------------------------------------------------------------------
  if (select school_id from public.admissions_leads where id = v_keep)
     is distinct from
     (select school_id from public.admissions_leads where id = v_dupe) then
    raise exception
      'The two Julian Towa leads are at DIFFERENT campuses. Moving the '
      'submission would change which school his application is for. Nothing '
      'moved - decide which campus is right first.';
  end if;

  -- ---------------------------------------------------------------------
  -- 3. The accepted record must have nothing to compete with.
  -- ---------------------------------------------------------------------
  select count(*) into v_n from public.admissions_interest_submissions
   where lead_id = v_keep;
  if v_n > 0 then
    raise notice
      'The accepted Julian Towa lead already has % submission(s). Nothing '
      'moved - this operation is only for a record that has none.', v_n;
    return;
  end if;

  select id into v_sub from public.admissions_interest_submissions
   where lead_id = v_dupe order by submitted_at desc limit 1;
  if v_sub is null then
    raise notice 'Nothing to move: the duplicate has no submission.';
    return;
  end if;

  -- ---------------------------------------------------------------------
  -- 4. Move it.
  -- ---------------------------------------------------------------------
  update public.admissions_interest_submissions
     set lead_id = v_keep
   where id = v_sub;

  raise notice
    '457/julian: submission % moved from the duplicate lead to the accepted '
    'one. His application will now prefill from his mother''s own answers.',
    v_sub;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect the accepted lead to carry the submission and its 21 answers, and
-- the duplicate to carry none.

select coalesce(l.lead_stage, '(none)')                 as stage,
       coalesce(s.name, '(no campus)')                  as campus,
       l.created_at::date                               as created,
       count(distinct sub.id)                           as submissions,
       count(ans.id)                                    as answers
  from public.admissions_leads l
  left join public.schools s on s.id = l.school_id
  left join public.admissions_interest_submissions sub on sub.lead_id = l.id
  left join public.admissions_interest_answers ans on ans.submission_id = sub.id
 where lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%'
 group by 1, 2, 3
 order by 3;
