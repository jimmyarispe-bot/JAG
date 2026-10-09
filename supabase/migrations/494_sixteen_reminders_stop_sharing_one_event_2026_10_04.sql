-- 494_sixteen_reminders_stop_sharing_one_event_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. The four new trigger events have
-- to exist in the TypeScript union and in TRIGGER_EVENT_LABELS before any row
-- carries them, or the admissions registry gate fails on an event it does not
-- know.
--
-- WHAT IS WRONG. All sixteen campus parent-reminder templates - four waits at
-- four campuses - carry the same trigger_event:
--
--     parent_reminder_application_not_started        additional_info_requested
--     parent_reminder_application_not_submitted      additional_info_requested
--     parent_reminder_shadow_days_not_scheduled      additional_info_requested
--     parent_reminder_enrollment_not_completed       additional_info_requested
--
-- which is also the event of the network letter additional_info_email.
--
-- WHY THAT IS DANGEROUS. getTemplatesForTrigger reads every active template
-- for an event at that school, sorts network rows first, and de-duplicates by
-- template_key - so all five survive, and all five are delivered. Fire
-- additional_info_requested for a family at GA today and they would receive
-- "Information needed", "A quick reminder about your application", "Your
-- application is nearly done", "Booking your shadow days" and "One step left
-- to enroll", in one go.
--
-- IT HAS NEVER HAPPENED, for one reason only: the sixteen are switched off,
-- and getTemplatesForTrigger filters on is_active. Switch them on as they
-- stand - which is exactly what step 4c of the chain needs - and it happens
-- on the next request for additional information.
--
-- THE NIGHTLY JOB NEVER HAD THE BUG. parent-reminders.ts looks templates up
-- by template_key within the school, not by event, and writes the row's own
-- trigger_event onto the queue entry. So this change is invisible to it, and
-- the queue rows it writes become more accurate rather than less.
--
-- Each wait now has an event of its own, named after the template so the two
-- can never drift apart again.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set trigger_event = template_key,
       updated_at = now()
 where template_key in (
         'parent_reminder_application_not_started',
         'parent_reminder_application_not_submitted',
         'parent_reminder_shadow_days_not_scheduled',
         'parent_reminder_enrollment_not_completed'
       )
   and trigger_event <> template_key;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT seventeen rows and a count.
--
--   16  the campus reminders, every one reading 'own event'
--    1  additional_info_email, 'every campus', still on
--        additional_info_requested - which is correct, it is the only letter
--        that event should reach
--
--   COUNT sharing additional_info_requested: 1. If it reads 5, nothing moved.
--   If it reads 2 or more and is not 1, something else has claimed that
--   event and the rows above will name it.

select * from (

select 1                                                       as seq,
       coalesce(sc.name, 'every campus')                       as applies_to,
       t.template_key                                          as detail,
       t.trigger_event,
       case when t.is_active then 'ON' else 'off' end          as state,
       case when t.trigger_event = t.template_key then 'own event'
            when t.template_key = 'additional_info_email' then 'correct — this is its event'
            else '*** STILL SHARING ***' end                   as check_
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key like 'parent_reminder_application%'
    or t.template_key like 'parent_reminder_shadow%'
    or t.template_key like 'parent_reminder_enrollment%'
    or t.template_key = 'additional_info_email'

union all

select 2,
       '',
       'COUNT sharing additional_info_requested',
       count(*)::text,
       '',
       case when count(*) = 1
            then 'one letter owns it — no family gets five at once'
            else '*** MORE THAN ONE TEMPLATE CLAIMS THAT EVENT ***' end
  from public.admissions_communication_templates t
 where t.trigger_event = 'additional_info_requested'

) rows
order by seq, applies_to, detail;
