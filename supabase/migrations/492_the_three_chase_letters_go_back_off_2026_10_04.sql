-- 492_the_three_chase_letters_go_back_off_2026_10_04.sql
--
-- Switches the three interest-meeting chase letters OFF. Nothing else.
--
--     parent_reminder_interest_meeting_not_booked_1   day 2, to the family
--     parent_reminder_interest_meeting_not_booked_2   day 3, to the family
--     staff_interest_meeting_no_response              day 4, to the leader
--
-- WHY. Jimmy, 4 October, reading the day-2 letter in the chain: "this is not
-- the text i gave you."
--
-- He is right. I wrote all three on 2 October and migration 479 seeded them
-- SWITCHED OFF, precisely because he sees the exact words a human reads
-- before they ship. On 3 October he turned them on so the diverted test would
-- exercise the whole chain end to end - a test decision, not an approval of
-- the wording - and they have been on since.
--
-- NO FAMILY HAS RECEIVED ONE. EMAIL_DIVERT_TO has been set in Vercel
-- throughout, so every letter the platform composed went to one inbox. That
-- is the only reason this is a tidy-up rather than an incident.
--
-- Jimmy, the same afternoon: "every single itty bitty piece of this build
-- needs to be tested, confirmed and working without fail." A letter nobody
-- has approved, switched on, is the opposite of that - and "on for testing"
-- is a state that survives exactly as long as somebody remembers why.
--
-- THE WORDS ARE KEPT, not deleted. They are a draft waiting on his, and the
-- day he writes them it is an UPDATE rather than a re-seed.
--
-- WHAT THIS DOES TO THE 11PM SCAN. It runs, reads the calendars, records who
-- booked, and writes no chase letters at all - reporting "no active template"
-- rather than sending. That is the designed behaviour for an unapproved
-- letter and it is reported rather than silent.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set is_active = false,
       updated_at = now()
 where template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )
   and is_active;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT four rows: the three letters, every one reading 'off', and a COUNT
-- row reading 0.
--
-- A campus holding its own copy of one of these appears as its own row and
-- was switched off too, which is correct and worth seeing.

select 'chase letter'                                         as what,
       coalesce(sc.name, 'every campus')                      as applies_to,
       t.template_key                                         as detail,
       case when t.is_active then '*** STILL ON ***' else 'off' end as state,
       t.subject                                              as extra

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

union all

select 'COUNT still on',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'none — nothing goes out in words nobody approved'
            else '*** A CHASE LETTER IS STILL ON ***' end,
       ''
  from public.admissions_communication_templates t
 where t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )
   and t.is_active

 order by what, applies_to, detail;
