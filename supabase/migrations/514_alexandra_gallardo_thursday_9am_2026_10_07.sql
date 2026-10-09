-- ==========================================================================
-- 514 — ALEXANDRA GALLARDO, THURSDAY 9 OCTOBER, 9:00 AM
--
-- 7 October 2026.
--
--   >>> EDIT ONE LINE BEFORE YOU RUN THIS. It is line 60, marked
--   >>> PASTE THE MEET LINK. The migration refuses to run until you do.
--
-- ── WHY A BACKFILL IS NEEDED AT ALL ───────────────────────────────────────
--
-- The "RECORD your notes" letter is queued only on the branch of the booking
-- scan that records a NEW booking (chase/run.ts:145). Alexandra Gallardo's
-- admissions_interviews row was written on or before 1 October, four days
-- before migration 502 created the letter. So the row already exists, the
-- scan's own guard skips her every time, and she appears in none of its
-- reports — confirmed in three dry runs today.
--
-- Fixing the hourly cron does not reach her. Nothing reaches her but this.
--
-- Her meeting is at 9:00 AM on Thursday and Heather Badger-Brown will walk
-- into it with no letter, no child's details to hand, and no button to
-- record what was said.
--
-- ── WHAT THIS DOES ────────────────────────────────────────────────────────
--
-- Exactly what the scan would have done, by hand:
--
--   1. mints a post_call_token on her lead if one is not already there,
--      so the RECORD YOUR NOTES button goes somewhere
--   2. inserts ONE row into admissions_communication_queue, timed to the
--      appointment's own scheduled_at, carrying the same three merge
--      overrides queueLetter sends: postCallToken, interviewDatetime,
--      meetingLink
--
-- It writes no letter and sends nothing. /api/admissions/process-communications
-- drains the queue every five minutes and will send it at 9:00 on Thursday,
-- the same path every other letter takes.
--
-- Nothing about her lead, her stage or her booking is touched.
--
-- Idempotent. Re-running raises rather than queueing a second letter.
-- ==========================================================================

begin;

do $$
declare
  -- ──────────────────────────────────────────────────────────────────────
  -- PASTE THE MEET LINK
  --
  -- Open Google Calendar, find Thursday 9 October at 9:00 AM, and copy the
  -- "Join with Google Meet" link — it looks like https://meet.google.com/abc-defg-hij
  --
  -- The Academy Virtual has no building, so this link IS the meeting. The
  -- letter reads "Call them or go to the google meets link", and without it
  -- that sentence offers Heather nothing.
  --
  -- If there is genuinely no Meet link on the event, set this to '' (two
  -- quotes) and the letter will send without one.
  -- ──────────────────────────────────────────────────────────────────────
  v_meeting_link text := 'PASTE THE MEET LINK';

  v_lead        uuid;
  v_school      uuid;
  v_starts      timestamptz;
  v_token       text;
  v_template    uuid;
  v_channel     text;
  v_when        text;
  v_existing    int;
begin
  if v_meeting_link = 'PASTE THE MEET LINK' then
    raise exception
      '514: edit the v_meeting_link line first. Paste the Google Meet link from '
      'Thursday 9 October 9:00 AM, or set it to '''' to send without one.';
  end if;

  -- 1 ------------------------------------------------------------ THE CHILD
  select l.id, l.school_id into v_lead, v_school
  from public.admissions_leads l
  where lower(trim(l.first_name)) = 'alexandra'
    and lower(trim(l.last_name))  = 'gallardo'
    and l.archived_at is null;

  if v_lead is null then
    raise exception '514: no live lead named Alexandra Gallardo';
  end if;

  -- 2 -------------------------------------------------------- THE APPOINTMENT
  -- Read from the booking rather than typed, so the letter cannot be timed to
  -- an hour somebody retyped wrongly. This is the 1 October lesson.
  select i.scheduled_at into v_starts
  from public.admissions_interviews i
  where i.lead_id = v_lead
    and i.scheduled_at > now()
  order by i.scheduled_at
  limit 1;

  if v_starts is null then
    raise exception '514: no upcoming booking on Alexandra Gallardo''s lead';
  end if;

  -- 3 -------------------------------------------------- DO NOT QUEUE IT TWICE
  select count(*) into v_existing
  from public.admissions_communication_queue q
  where q.lead_id = v_lead
    and q.template_key = 'staff_record_meeting_notes';

  if v_existing > 0 then
    raise exception
      '514: a notes letter is already queued for Alexandra Gallardo (% row(s)). '
      'Nothing to do.', v_existing;
  end if;

  -- 4 ------------------------------------------------------------- THE TOKEN
  -- 64 lowercase hex, the same shape mintPostCallToken produces. Minted once
  -- and reused: the token identifies the family, not the occasion.
  select nullif(trim(l.post_call_token), '') into v_token
  from public.admissions_leads l where l.id = v_lead;

  if v_token is null then
    v_token := encode(gen_random_bytes(32), 'hex');
    update public.admissions_leads
    set post_call_token = v_token
    where id = v_lead;
  end if;

  -- 5 ---------------------------------------------------------- THE TEMPLATE
  -- A campus row wins over the network row, exactly as queueLetter does.
  select t.id, t.channel into v_template, v_channel
  from public.admissions_communication_templates t
  where t.trigger_event = 'staff_inquiry_call_held'
    and t.is_active
    and (t.school_id is null or t.school_id = v_school)
  order by (t.school_id is null)          -- campus row first
  limit 1;

  if v_template is null then
    raise exception
      '514: no active template on staff_inquiry_call_held. The notes letter '
      'is switched off, and queueing against nothing would send nothing.';
  end if;

  -- 6 --------------------------------------------------------- THE QUEUE ROW
  -- interviewDatetime is rendered HERE, in Eastern, because the worker that
  -- sends this later has no idea which appointment it is about. An ISO string
  -- here is how three families were told the wrong hour on 1 October.
  v_when := to_char(v_starts at time zone 'America/New_York',
                    'FMDay, FMMonth FMDD, YYYY @ FMHH12:MI AM');

  insert into public.admissions_communication_queue (
    lead_id, application_id, template_id, template_key,
    trigger_event, channel, scheduled_for, status, merge_overrides
  ) values (
    v_lead, null, v_template, 'staff_record_meeting_notes',
    'staff_inquiry_call_held', v_channel, v_starts, 'pending',
    jsonb_build_object(
      'postCallToken',     v_token,
      'interviewDatetime', v_when,
      'meetingLink',       nullif(v_meeting_link, '')
    )
  );

  raise notice '514: queued the notes letter for Alexandra Gallardo at %', v_when;
end $$;

commit;

-- 7 ------------------------------------------------------------- SEE IT DONE
-- One pending row, timed to Thursday 9:00 AM Eastern, with a token on it.
select
  (l.first_name || ' ' || l.last_name)                      as child,
  coalesce(s.name, '(no campus)')                           as campus,
  q.template_key                                            as letter,
  q.status                                                  as status,
  to_char(q.scheduled_for at time zone 'America/New_York',
          'FMDay, FMMonth FMDD, YYYY @ FMHH12:MI AM')       as goes_out_at,
  q.merge_overrides ->> 'interviewDatetime'                 as letter_will_say,
  coalesce(q.merge_overrides ->> 'meetingLink', '(none)')   as meet_link,
  case when length(coalesce(q.merge_overrides ->> 'postCallToken', '')) = 64
       then 'OK — the RECORD YOUR NOTES button will work'
       else 'BROKEN — no usable token' end                  as button
from public.admissions_communication_queue q
join public.admissions_leads l on l.id = q.lead_id
left join public.schools s on s.id = l.school_id
where q.template_key = 'staff_record_meeting_notes';
