-- 502_record_your_notes_at_the_meeting_time_2026_10_05.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. It adds an outcome the code must
-- already know about.
--
-- Two things:
--
--   1. One more value on lead_call_outcomes.outcome - 'shadow_days_invited',
--      the Virtual and HS button on the notes page.
--   2. The letter itself: "RECORD your notes for {{student_name}}", to the
--      school leader at every campus, at the appointment time.
--
-- ── WHAT CHANGED SINCE THIS MORNING ─────────────────────────────────────────
--
-- Migration 497 prepared a GA and FL letter ten minutes after the inquiry
-- call ended, carrying only the tour decision. Jimmy replaced that on
-- 5 October with one letter at all four campuses, at the appointment time:
--
--   "at the end of 2f or beginning or in place of 3a i want the email to go
--   to the school leader at the exact time of the scheduled appointment. I
--   want the email subject to read - RECORD your notes for [student] ----
--   and the ability to record all of the notes for the conversation/meeting
--   is provided in the email and all the school leader has to do is hit the
--   button or fill in the notes box."
--
-- ── THE WORDING IS HIS, AND SO IS THE SUBJECT ──────────────────────────────
--
-- Given in full on 5 October and ending "----- this is it. nothing more
-- --------------", so nothing was added: no greeting, no sign-off, no
-- inquiry notes, no parent email. The five bare lines at the foot are the
-- five he listed, in his order.
--
-- {{post_call_link}} IS THE "RECORD YOUR NOTES BUTTON". A link, rendered as
-- one - see below for why it cannot be a form.
--
-- FOUR OF THE TOKENS DID NOT EXIST before this deploy and are new code:
--
--   {{student_full_name}}  first and last, never the preferred name alone.
--                          student_name returns "Birdie" where the records
--                          say Beatrice Okonkwo, which is right for a
--                          family's letter and wrong for a staff one.
--   {{student_grade}}      applying_for_grade, falling back to current_grade.
--   {{student_age}}        whole years from date_of_birth, or "not given".
--                          Not a date: nobody should do arithmetic between
--                          two meetings.
--   {{meeting_link}}       the Google Meet link for THIS appointment, read
--                          off the calendar event. Google has been sending
--                          it in every event this scan has ever read.
--
-- {{meeting_link}} IS EMPTY AT GA AND FL, where the inquiry call is a
-- telephone call and Google creates no conference. The letter covers both
-- cases in one sentence - "Call them or go to the google meets link" - so
-- the blank line at the foot is the correct behaviour there, not a fault.
--
-- A NOTES BOX CANNOT LIVE INSIDE AN EMAIL. Mail clients strip forms, so the
-- letter carries one link to a page that is nothing but a notes box and the
-- buttons - no sign-in, the token is the authority, exactly like /call,
-- /application-call and /send-interest-link.
--
-- ── IT IS IN PLACE OF 3a ────────────────────────────────────────────────────
--
-- Marking a child "Interest Meeting Held" is the one step in the whole chain
-- with nothing chasing a school leader for it. A meeting that happened and
-- was never marked leaves the child frozen: no gate opens, nothing chases,
-- and the board looks like a family who never turned up. Writing notes about
-- a meeting is proof the meeting happened, so saving them moves the child.
--
-- ── WHERE EACH BUTTON LEAVES THE CHILD ──────────────────────────────────────
--
--   Send the tour request       GA, FL       tour_requested
--   Send the shadow day invite  Virtual, HS  interest_meeting_held
--   Not the right school        all          declined + the warm close
--   Not yet, I will follow up   all          interest_meeting_held
--
-- "NOT THE RIGHT SCHOOL" NOW SENDS THE FAMILY THE WARM CLOSE, which the first
-- version of this page did not. This page is the 3a gate's second door, and
-- that gate's "no" branch has always posted application_not_invited. Two
-- doors onto one decision must not do two different things. The letter is
-- inquiry_closed_email, live since September.
--
-- ── "THE EXACT TIME" IS AS EXACT AS THE SENDER ALLOWS ───────────────────────
--
-- scheduled_for is the appointment's start, to the second. The job that
-- delivers it runs hourly (`0 * * * *`), so a meeting at 2:15pm produces a
-- letter at 3:00pm. Closing that gap needs a more frequent cron, which is a
-- Vercel plan question. Worth knowing before somebody times a stopwatch.
--
-- Safe to re-run: the constraint is dropped by lookup, the letter upserts.

begin;

-- ── 1. One more outcome ──────────────────────────────────────────────────────

do $$
declare
  v_name text;
begin
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'lead_call_outcomes'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%';

  if v_name is null then
    raise exception 'No outcome check constraint found - 497 has not run.';
  end if;

  execute format('alter table public.lead_call_outcomes drop constraint %I', v_name);

  alter table public.lead_call_outcomes
    add constraint lead_call_outcomes_outcome_check
    check (outcome in (
      -- The interest-meeting call, /call/<token>. These only RECORD.
      'spoke_will_book',
      'spoke_not_proceeding',
      'left_message',
      'no_answer',
      -- The five-day application call, /application-call/<token>.
      'application_resent',
      'application_not_proceeding',
      -- The notes page, /post-call/<token>. All four campuses.
      'tour_requested',                 -- GA and FL
      'shadow_days_invited',            -- Virtual and HS
      'post_call_not_the_right_school',
      'post_call_follow_up'
    ));
end $$;

-- ── 2. The letter ────────────────────────────────────────────────────────────
--
-- ONE NETWORK ROW, not four campus rows. Every word of it is identical at
-- every campus: the subject names the child, the body names the school
-- through {{school_name}}, and the only thing that differs - which buttons
-- appear - is decided by the PAGE from the child's campus, not by the letter.
--
-- Seeded ACTIVE. Jimmy specified this letter in full on 5 October, including
-- its subject line, and the divert still catches everything.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category)
values
  (null,
   'staff_record_meeting_notes',
   'RECORD your notes - at the meeting time',
   'staff_email',
   'staff_inquiry_call_held',
   'Meeting w/ parent - {{guardian_name}} happening now; TAKE notes',
   $letter$Your meeting/conversation about student - {{student_full_name}} is scheduled for right now. Call them or go to the google meets link to start your meeting/conversation with them.

Click on this RECORD YOUR NOTES button to document important information revealed in your conversation with them.

{{post_call_link}}

{{student_full_name}}
{{student_grade}}
{{student_age}}
{{parent_phone}}
{{meeting_link}}$letter$,
   0, true, 'inquiry')
on conflict (school_id, template_key) do update set
  name          = excluded.name,
  channel       = excluded.channel,
  trigger_event = excluded.trigger_event,
  subject       = excluded.subject,
  body          = excluded.body,
  delay_hours   = excluded.delay_hours,
  is_active     = true,
  category      = excluded.category,
  updated_at    = now();

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT three rows.
--
--   1  COUNT outcomes       10. If it reads 9, section 1 did not run and the
--                           Virtual/HS button will be refused by the database.
--   2  the letter           ON, staff_email, and the subject printed in full
--   3  COUNT letters on
--      this event           1. If it reads 2, something else claims the event
--                           and a school leader would get both at once -
--                           getTemplatesForTrigger de-duplicates by template
--                           KEY, not by event.

select 1 as seq,
       'COUNT outcomes the constraint allows' as what,
       (
         select count(*)::text
           from pg_constraint con
           join pg_class rel on rel.oid = con.conrelid
          cross join lateral regexp_matches(
                       pg_get_constraintdef(con.oid), '''([a-z_]+)''', 'g') as m(v)
          where rel.relname = 'lead_call_outcomes'
            and con.contype = 'c'
            and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%'
       ) as detail,
       case when (
         select count(*)
           from pg_constraint con
           join pg_class rel on rel.oid = con.conrelid
          cross join lateral regexp_matches(
                       pg_get_constraintdef(con.oid), '''([a-z_]+)''', 'g') as m(v)
          where rel.relname = 'lead_call_outcomes'
            and con.contype = 'c'
            and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%'
       ) = 10 then 'every button can be recorded'
         else '*** THE SHADOW DAY BUTTON WILL BE REFUSED ***' end as state

union all

select 2,
       case when t.is_active then 'ON · ' else '*** off *** · ' end || t.channel,
       t.subject,
       case
         when t.body not like '%{{post_call_link}}%'
              then '*** NO RECORD YOUR NOTES LINK — THE LETTER IS A DEAD END ***'
         when t.body not like '%{{student_full_name}}%'
              then '*** NO FULL NAME ***'
         when t.body not like '%{{meeting_link}}%'
              then '*** NO MEETING LINK ***'
         else 'carries the button, the full name and the meeting link'
       end
  from public.admissions_communication_templates t
 where t.template_key = 'staff_record_meeting_notes'

union all

select 3,
       'COUNT letters on staff_inquiry_call_held',
       count(*)::text,
       case when count(*) = 1 then 'one letter owns the event'
            else '*** MORE THAN ONE — SHE WOULD GET BOTH ***' end
  from public.admissions_communication_templates t
 where t.trigger_event = 'staff_inquiry_call_held'
   and t.is_active

 order by seq;
