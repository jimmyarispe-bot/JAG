-- ==========================================================================
-- 515 — HARRIS BORUM GETS HIS APPLICATION
--
-- 8 October 2026. Run top to bottom in the Supabase SQL editor.
-- The last statement prints the link. Copy it from there.
--
-- ── WHERE HE ACTUALLY IS ──────────────────────────────────────────────────
--
--   Harris Borum, The Academy HS
--   lead 19aa056d-78e2-4e34-8944-6008c5f0d8d5
--   stage  shadow_day_scheduled, since 1 October 2026 @ 11:41 AM
--   guardian jenn_borum@comcast.net
--
--   application_access_token   none
--   admissions_applications    no row
--
-- He is scheduled for a shadow day and has never been invited to apply. He
-- has no application, and the $100 fee has nowhere to live.
--
-- ── HOW THAT HAPPENED ─────────────────────────────────────────────────────
--
-- 1 October @ 11:41 AM is the same minute the booking scan last wrote to
-- admissions_interviews. The scan found his booking, recorded it, and moved
-- him — straight past the invite_to_apply gate, which is the step that mints
-- the link and creates the application.
--
-- That gate opens at tour_completed or interest_meeting_held
-- (gates/definitions.ts:67). He is past both, so answering it in JAG is not
-- available: there is nothing left to open.
--
-- ── WHAT THIS DOES, AND WHAT IT REFUSES TO DO ─────────────────────────────
--
-- Exactly what the gate's "yes" branch does (gates/actions.ts:325), minus
-- the two things that would be wrong here:
--
--   DOES     mint his application_access_token, through the same idempotent
--            RPC the gate uses — mint_application_access_token
--   DOES     create the admissions_applications row, status 'in_progress',
--            against The Academy HS's CURRENT school year, so the $100 has
--            somewhere to live before he opens the link
--            (application_fee_cents is not named here: migration 291
--            defaults it to 10000, and writing it twice is how two numbers
--            start disagreeing)
--
--   DOES NOT send him or his mother anything. Jimmy asked for a link to send
--            himself. A letter going out at the same time would reach Jenn
--            Borum twice.
--   DOES NOT touch his stage. He stays at shadow_day_scheduled. Rewinding a
--            child to re-open a gate is the platform moving a student, and a
--            school leader moves students.
--
-- ── IT REFUSES RATHER THAN GUESSES ────────────────────────────────────────
--
-- If The Academy HS has no current school year, this stops. Guessing a year
-- attaches a family's money to the wrong one, and the wrong year is harder
-- to find later than a missing row. Same posture as
-- planApplicationForInvite:80.
--
-- Idempotent. Re-running returns the token already minted and creates no
-- second application.
-- ==========================================================================

begin;

do $$
declare
  v_lead   uuid := '19aa056d-78e2-4e34-8944-6008c5f0d8d5';
  v_name   text;
  v_school uuid;
  v_year   uuid;
  v_app    uuid;
  v_token  text;
begin
  -- 1 ------------------------------------------------- IT IS THE RIGHT CHILD
  -- The id is from a query run this morning. Checked against the name anyway,
  -- because a uuid typed into the wrong migration is unreadable afterwards.
  select (l.first_name || ' ' || l.last_name), l.school_id
    into v_name, v_school
  from public.admissions_leads l
  where l.id = v_lead and l.archived_at is null;

  if v_name is null then
    raise exception '515: no live lead %', v_lead;
  end if;
  if lower(trim(v_name)) <> 'harris borum' then
    raise exception '515: lead % is "%", not Harris Borum', v_lead, v_name;
  end if;
  if v_school is null then
    raise exception
      '515: Harris Borum has no campus on his record, so an application '
      'cannot be created. Set his campus first.';
  end if;

  -- 2 ----------------------------------------------- THE LINK (IDEMPOTENT)
  v_token := public.mint_application_access_token(v_lead);
  if v_token is null or length(v_token) <> 64 then
    raise exception '515: the token did not mint (got %)', coalesce(v_token, 'null');
  end if;

  -- 3 ------------------------------------------- THE ROW THE FEE LIVES ON
  select a.id into v_app
  from public.admissions_applications a
  where a.lead_id = v_lead
  limit 1;

  if v_app is null then
    select y.id into v_year
    from public.school_years y
    where y.school_id = v_school and y.is_current
    limit 1;

    if v_year is null then
      raise exception
        '515: The Academy HS has no current school year, so an application '
        'cannot be created. Set the current school year, then run this again. '
        'Nothing has been minted into a link that cannot take his money.';
    end if;

    insert into public.admissions_applications (lead_id, school_year_id, application_status)
    values (v_lead, v_year, 'in_progress');
  end if;

  raise notice '515: Harris Borum is ready. Token %', v_token;
end $$;

commit;

-- 4 ------------------------------------------------------------- THE LINK
-- Copy link_to_send. Two hosts are shown because the letters build theirs
-- from NEXT_PUBLIC_APP_URL in Vercel, which this query cannot read; both
-- serve /apply/start. The thejag.org one always resolves.
select
  (l.first_name || ' ' || l.last_name)                        as child,
  coalesce(s.name, '(no campus)')                             as campus,
  l.lead_stage                                                as stage_unchanged,
  l.guardian_email                                            as send_it_to,
  'https://theacademyway.thejag.org/apply/start/'
    || l.application_access_token                             as link_to_send,
  'https://apply.theacademyway.org/apply/start/'
    || l.application_access_token                             as same_link_other_host,
  case
    when exists (select 1 from public.admissions_applications a
                 where a.lead_id = l.id)
      then 'OK — the $100 has somewhere to live'
    else 'BROKEN — no application row' end                    as the_fee,
  to_char(l.application_access_token_issued_at
            at time zone 'America/New_York',
          'FMDay, FMMonth FMDD, YYYY @ FMHH12:MI AM')         as link_issued
from public.admissions_leads l
left join public.schools s on s.id = l.school_id
where l.id = '19aa056d-78e2-4e34-8944-6008c5f0d8d5';
