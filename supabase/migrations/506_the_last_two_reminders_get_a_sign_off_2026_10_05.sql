-- 506_the_last_two_reminders_get_a_sign_off_2026_10_05.sql
--
-- RUN THIS *AFTER* THE CODE DEPLOY THAT ADDS staff_parent_unresponsive AS A
-- TRIGGER EVENT. Section 3 puts that event on a row, and the admissions
-- registry gate fails on an event the TypeScript union does not know.
--
-- THREE THINGS, AND NOTHING IS SWITCHED ON. All three rows stay off until
-- Jimmy has read the finished letters.
--
--   1. the shadow-day reminder gets a sign-off, and splits by campus
--   2. the enrollment reminder gets a sign-off
--   3. their escalation stops sharing another letter's trigger event
--
-- ── 1. THE SHADOW-DAY REMINDER SPLITS, FOR THE SAME REASON 5a DID ───────────
--
-- Jimmy, 5 October: "virtual n hs only have 1 shadow day and it comes before
-- the application." Migration 505 made the INVITATION two letters. This is
-- the reminder that chases it, and it has the same problem:
--
--     We invited {{student_first_name}} to spend shadow days with us
--
-- Plural, at a campus that holds one. These rows are already per campus -
-- migration 294 seeded one per school - so no new rows are needed, only
-- different words in four of the eight.
--
--   GA, FL        "to spend 2 Shadow Days with us"   "have not got dates"
--   Virtual, HS   "to spend 1 Shadow Day with us"    "have not got a date"
--
-- Capitalised to match 5a and the invitation to apply, where "Shadow Days"
-- has been capitalised since migration 483.
--
-- ── 2. BOTH GET THE SIGN-OFF, AND KEEP "Hi" ─────────────────────────────────
--
-- Same treatment migration 503 gave 4c, and the same instruction behind it:
-- "keep Hi - bring both into line with the rest." Both letters ended on a
-- bare {{school_name}} where every other letter in the chain ends "Warm
-- regards, / {{admissions_contact_name}} / {{school_name}}". The trailing
-- line is REPLACED by the block, so the school is not named twice.
--
-- ── 3. THE ESCALATION STOPS BORROWING AN EVENT ──────────────────────────────
--
-- staff_parent_unresponsive carries trigger_event 'staff_portal_message',
-- which belongs to a different letter. This is the third row found that way:
-- migration 494 cleared sixteen, 503 moved the five-day letter, this is the
-- last one.
--
-- THE LIVE ROW IS BETTER THAN ITS SEED, which is worth recording because it
-- was reported wrongly in conversation. Migration 294 seeded this letter on
-- channel 'email' - the FAMILY's channel - and is_active true. The live rows
-- read 'staff_email' and off. Something after September fixed both. Only the
-- trigger event was left.
--
-- Safe to re-run: every update is guarded on what it is changing.

begin;

-- ── 1. The shadow-day reminder: campus wording ───────────────────────────────

do $$
declare
  touched integer;
begin
  /* GA and FL: two days. */
  update public.admissions_communication_templates t
     set body = replace(
                  t.body,
                  'to spend shadow days with us at {{school_name}} and have not got dates in the diary yet.',
                  'to spend 2 Shadow Days with us at {{school_name}} and have not got dates in the diary yet.'
                ),
         updated_at = now()
    from public.schools sc
   where sc.id = t.school_id
     and t.template_key = 'parent_reminder_shadow_days_not_scheduled'
     and sc.name in ('The Academy GA', 'The Academy FL')
     and t.body like '%to spend shadow days with us%';

  get diagnostics touched = row_count;
  raise notice 'shadow-day reminder, GA/FL: % rows.', touched;

  /* Virtual and HS: one day. */
  update public.admissions_communication_templates t
     set body = replace(
                  t.body,
                  'to spend shadow days with us at {{school_name}} and have not got dates in the diary yet.',
                  'to spend 1 Shadow Day with us at {{school_name}} and have not got a date in the diary yet.'
                ),
         updated_at = now()
    from public.schools sc
   where sc.id = t.school_id
     and t.template_key = 'parent_reminder_shadow_days_not_scheduled'
     and sc.name in ('The Academy Virtual', 'The Academy HS')
     and t.body like '%to spend shadow days with us%';

  get diagnostics touched = row_count;
  raise notice 'shadow-day reminder, Virtual/HS: % rows.', touched;
end $$;

-- ── 2. Both reminders get a sign-off ─────────────────────────────────────────

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates
     set body = replace(
                  body,
                  E'find some that do.\n\n{{school_name}}',
                  E'find some that do.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}}'
                ),
         updated_at = now()
   where template_key = 'parent_reminder_shadow_days_not_scheduled'
     and body like '%find some that do.' || chr(10) || chr(10) || '{{school_name}}';

  get diagnostics touched = row_count;
  raise notice 'shadow-day sign-off: % rows.', touched;

  update public.admissions_communication_templates
     set body = replace(
                  body,
                  E'walk you through it.\n\n{{school_name}}',
                  E'walk you through it.\n\nWarm regards,\n{{admissions_contact_name}}\n{{school_name}}'
                ),
         updated_at = now()
   where template_key = 'parent_reminder_enrollment_not_completed'
     and body like '%walk you through it.' || chr(10) || chr(10) || '{{school_name}}';

  get diagnostics touched = row_count;
  raise notice 'enrollment sign-off: % rows.', touched;
end $$;

-- ── 3. The escalation gets its own event ─────────────────────────────────────

update public.admissions_communication_templates
   set trigger_event = 'staff_parent_unresponsive',
       updated_at = now()
 where template_key = 'staff_parent_unresponsive'
   and trigger_event <> 'staff_parent_unresponsive';

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT twelve rows and three counts. EVERY ROW STILL READS 'off' - that is
-- correct and deliberate. Nothing goes live until Jimmy has read the letters.
--
--   COUNT without a sign-off     : 0
--   COUNT told the wrong number
--     of shadow days             : 0
--   COUNT on a borrowed event    : 0

select case t.template_key
         when 'parent_reminder_shadow_days_not_scheduled' then 'shadow days  reminder'
         when 'parent_reminder_enrollment_not_completed'  then 'enrollment   reminder'
         else 'escalation'
       end                                                     as step,
       sc.name                                                 as campus,
       case when t.is_active then '*** ON ***' else 'off' end  as state,
       t.channel,
       t.trigger_event,
       case
         when t.template_key = 'staff_parent_unresponsive' then '—'
         when t.body like '%Warm regards,' || chr(10) || '{{admissions_contact_name}}%'
              then 'signed off'
         else '*** NO SIGN-OFF ***'
       end                                                     as wording,
       case
         when t.template_key <> 'parent_reminder_shadow_days_not_scheduled' then '—'
         when sc.name in ('The Academy GA','The Academy FL')
              and t.body like '%2 Shadow Days%' then '2 days'
         when sc.name in ('The Academy Virtual','The Academy HS')
              and t.body like '%1 Shadow Day %' then '1 day'
         else '*** WRONG NUMBER FOR THIS CAMPUS ***'
       end                                                     as how_many

  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'parent_reminder_shadow_days_not_scheduled',
         'parent_reminder_enrollment_not_completed',
         'staff_parent_unresponsive'
       )

union all

select 'COUNT without a sign-off', '', count(*)::text, '', '',
       case when count(*) = 0 then 'both read like a person wrote them'
            else '*** A LETTER STILL ENDS ON A BARE SCHOOL NAME ***' end, ''
  from public.admissions_communication_templates t
 where t.template_key in (
         'parent_reminder_shadow_days_not_scheduled',
         'parent_reminder_enrollment_not_completed'
       )
   and t.body not like '%Warm regards,' || chr(10) || '{{admissions_contact_name}}%'

union all

select 'COUNT told the wrong number of shadow days', '', count(*)::text, '', '',
       case when count(*) = 0 then 'each campus is told what it holds'
            else '*** A CAMPUS IS TOLD THE WRONG NUMBER ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key = 'parent_reminder_shadow_days_not_scheduled'
   and (
     (sc.name in ('The Academy Virtual','The Academy HS') and t.body like '%2 Shadow Days%')
     or
     (sc.name in ('The Academy GA','The Academy FL') and t.body like '%1 Shadow Day %')
     or t.body like '%spend shadow days%'
   )

union all

select 'COUNT on a borrowed event', '', count(*)::text, '', '',
       case when count(*) = 0 then 'it owns its own event'
            else '*** STILL ON staff_portal_message ***' end, ''
  from public.admissions_communication_templates t
 where t.template_key = 'staff_parent_unresponsive'
   and t.trigger_event <> 'staff_parent_unresponsive'

 order by step, campus;
