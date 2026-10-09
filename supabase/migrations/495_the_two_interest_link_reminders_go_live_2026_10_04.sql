-- 495_the_two_interest_link_reminders_go_live_2026_10_04.sql
--
-- Switches staff_interest_link_not_sent and staff_interest_link_escalation
-- ON at all four campuses. Nothing else.
--
-- Jimmy read both in full on 4 October and said: "these are fine."
--
-- WHY THIS MATTERS MORE THAN AN ORDINARY TEMPLATE SWITCH. Migration 489 made
-- the family's first letter a decision: a family who inquires now receives
-- NOTHING until a school leader presses send. These two are the only thing
-- standing behind that. Until they are on, the entire safety net for the
-- change is one person noticing one email.
--
--   staff_interest_link_not_sent        24 hours, and again at 48
--                                       to the campus
--
--   staff_interest_link_escalation      72 hours
--                                       to Jimmy and Danni, and the campus
--
-- THE SAME LETTER GOES TWICE at 24 and 48 hours. One template per wait is
-- how the job works, and he accepted it reading both. If the second should
-- say something different it is a second template and a small change to
-- parent-reminders.ts.
--
-- THE DIVERT IS STILL ON. Until EMAIL_DIVERT_TO is removed from Vercel these
-- reach the divert inbox rather than Nina, Danni or Heather - so switching
-- them on protects nobody today. It means they work the moment the divert
-- comes off, which is the order these two changes have to happen in.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set is_active = true,
       updated_at = now()
 where template_key in (
         'staff_interest_link_not_sent',
         'staff_interest_link_escalation'
       )
   and not is_active;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT nine rows: eight letters, every one reading 'ON' and 'staff_email',
-- and a COUNT row reading 8.
--
-- Eight is four campuses times two letters. Anything less means a campus is
-- missing one, and that campus has no safety net at all - which is worse
-- than it sounds, because it would look identical to a campus whose leader
-- is simply quick.

select 'reminder'                                              as what,
       sc.name                                                 as applies_to,
       t.template_key                                          as detail,
       case when t.is_active then 'ON' else '*** STILL OFF ***' end as state,
       t.channel,
       t.subject

  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'staff_interest_link_not_sent',
         'staff_interest_link_escalation'
       )

union all

select 'COUNT live',
       '',
       count(*)::text,
       case when count(*) = 8
            then 'all four campuses, both letters'
            else '*** A CAMPUS IS MISSING ONE ***' end,
       '', ''
  from public.admissions_communication_templates t
 where t.template_key in (
         'staff_interest_link_not_sent',
         'staff_interest_link_escalation'
       )
   and t.is_active

 order by what, applies_to, detail;
