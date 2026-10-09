-- 503_the_application_chase_goes_live_2026_10_05.sql
--
-- RUN THIS *AFTER* COMMIT 05add72d HAS DEPLOYED. It puts a trigger event on a
-- row that the TypeScript union must already know, or the admissions registry
-- gate fails on an event the code cannot name.
--
-- Step 4c and step 4d, together, at all four campuses:
--
--   4c   the three reminders at 24, 72 and 96 hours after the invitation
--        to apply. Two letters - one for a family who never opened the
--        application, one for a family who started and did not submit.
--   4d   the fifth-day letter to the school leader: time to telephone.
--
-- ── WHY THEY CANNOT GO ON SEPARATELY ─────────────────────────────────────────
--
-- This is the same rule as 2c/2d/2e in migration 499, and here it is not a
-- judgement call but arithmetic.
--
-- parent-reminders.ts increments admissions_parent_reminders.reminders_sent
-- ONLY when a reminder actually goes out:
--
--     const sent = await enqueue(...);
--     if (!sent) { errors.push(...); continue; }
--     ... update reminders_sent = row.reminders_sent + 1
--
-- With 4c switched off there is no active template, enqueue returns false,
-- and the counter never leaves 0. The escalation is chosen by that counter -
-- reminders_sent >= schedule.reminders.length - so at 0 it is never chosen.
--
-- SWITCH ON 4d ALONE AND NOTHING HAPPENS. Not late, not wrongly: never. The
-- letter would sit active and unreachable, which looks exactly like a quiet
-- week.
--
-- AND IF IT DID FIRE IT WOULD LIE. Its first line reads "Three reminders have
-- gone to the family and no application has been submitted." With 4c off,
-- none have.
--
-- ── WHAT CHANGED IN THE 4c WORDING ───────────────────────────────────────────
--
-- Jimmy, 5 October: "keep Hi - bring both into line with the rest before they
-- ship."
--
-- So the greeting stays "Hi {{guardian_first_name}}," where every other
-- letter in the chain says "Dear" - his call, and these two are the shortest
-- and most practical letters a family gets.
--
-- WHAT WAS ADDED IS THE SIGN-OFF. Both ended on a bare {{school_name}} while
-- 1d, 2c, 2d, 4a and 4f end "Warm regards, / {{admissions_contact_name}} /
-- {{school_name}}". A family reads these in the same thread as the others,
-- and a letter that stops without a name reads like it came from a system
-- rather than from the person who has been writing to them.
--
-- The trailing {{school_name}} line is REPLACED by the block rather than
-- having one appended after it, so the school is not named twice.
--
-- NOT TOUCHED: parent_reminder_shadow_days_not_scheduled and
-- parent_reminder_enrollment_not_completed. Same two faults - "Hi" and no
-- sign-off - and the same fix when Jimmy gets to them. They stay off, so
-- their escalation stays unreachable too, exactly as 4d was until today.
--
-- ── 4d: ITS EVENT MOVES ──────────────────────────────────────────────────────
--
-- Migration 484 seeded staff_application_call_parent with trigger_event
-- 'staff_portal_message', which belongs to a different letter. Harmless while
-- the letter was off, because getTemplatesForTrigger filters on is_active -
-- and a live collision the moment it is switched on, since that function
-- de-duplicates by template KEY and two keys means two letters delivered.
-- The event named after the template ships in 05add72d. The body is Jimmy's
-- and is not touched.
--
-- Safe to re-run: every update is guarded on what it is changing.

begin;

-- ── 1. The two 4c letters get a sign-off ─────────────────────────────────────

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  E'a person will answer.\n\n{{school_name}}',
                  E'a person will answer.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}}'
                ),
         updated_at = now()
   where template_key = 'parent_reminder_application_not_started'
     and body like '%a person will answer.' || chr(10) || chr(10) || '{{school_name}}';

  get diagnostics touched = row_count;
  raise notice '4c-i sign-off added to % rows.', touched;

  update public.admissions_communication_templates
     set body = replace(
                  body,
                  E'we will help.\n\n{{school_name}}',
                  E'we will help.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}}'
                ),
         updated_at = now()
   where template_key = 'parent_reminder_application_not_submitted'
     and body like '%we will help.' || chr(10) || chr(10) || '{{school_name}}';

  get diagnostics touched = row_count;
  raise notice '4c-ii sign-off added to % rows.', touched;
end $$;

-- ── 2. 4d stops sharing another letter's event ───────────────────────────────

update public.admissions_communication_templates
   set trigger_event = 'staff_application_call_parent',
       updated_at = now()
 where template_key = 'staff_application_call_parent'
   and trigger_event <> 'staff_application_call_parent';

-- ── 3. Both steps go live, together ──────────────────────────────────────────

update public.admissions_communication_templates
   set is_active = true,
       updated_at = now()
 where template_key in (
         'parent_reminder_application_not_started',
         'parent_reminder_application_not_submitted',
         'staff_application_call_parent'
       )
   and not is_active;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT twelve rows and three counts.
--
--   4 campuses x 4c-i, 4c-ii, 4d = 12, every one ON and every one reading
--   'signed off' or '4d — his words'.
--
--   COUNT live at 4c            : 8. Two letters, four campuses.
--   COUNT live at 4d            : 4. One letter, four campuses.
--   COUNT 4d on a shared event  : 0. If it reads 4, section 2 did not run and
--                                 firing staff_portal_message delivers this
--                                 letter as well as the one that owns it.
--
-- THE TWO COUNTS HAVE TO MOVE TOGETHER. 8 and 4, or 0 and 0. Eight without
-- four means a family is chased three times and nobody is ever told; four
-- without eight means a letter that can never fire and, if it did, would
-- claim three reminders that never went.

select 'letter'                                                as what,
       sc.name                                                 as campus,
       case t.template_key
         when 'parent_reminder_application_not_started'   then '4c-i  not started'
         when 'parent_reminder_application_not_submitted' then '4c-ii not submitted'
         else '4d    call the parent'
       end                                                     as step,
       case when t.is_active then 'ON' else '*** off ***' end  as state,
       case
         when t.body like '%Warm regards,' || chr(10) || '{{admissions_contact_name}}%'
              then 'signed off'
         when t.template_key = 'staff_application_call_parent'
              then '4d — his words'
         else '*** NO SIGN-OFF ***'
       end                                                     as wording

  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'parent_reminder_application_not_started',
         'parent_reminder_application_not_submitted',
         'staff_application_call_parent'
       )

union all

select 'COUNT live at 4c', '', count(*)::text,
       case when count(*) = 8 then 'both letters, four campuses'
            else '*** THE FAMILY IS NOT CHASED EVERYWHERE ***' end, ''
  from public.admissions_communication_templates t
 where t.is_active
   and t.template_key in (
         'parent_reminder_application_not_started',
         'parent_reminder_application_not_submitted'
       )

union all

select 'COUNT live at 4d', '', count(*)::text,
       case when count(*) = 4 then 'the escalation can be reached'
            else '*** A FAMILY CAN BE CHASED AND THEN FORGOTTEN ***' end, ''
  from public.admissions_communication_templates t
 where t.is_active
   and t.template_key = 'staff_application_call_parent'

union all

select 'COUNT 4d on a shared event', '', count(*)::text,
       case when count(*) = 0 then 'it owns its own event'
            else '*** STILL ON staff_portal_message ***' end, ''
  from public.admissions_communication_templates t
 where t.template_key = 'staff_application_call_parent'
   and t.trigger_event <> 'staff_application_call_parent'

 order by what, campus, step;
