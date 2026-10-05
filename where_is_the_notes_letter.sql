-- ============================================================================
-- WHERE IS THE NOTES LETTER?
-- 5 October 2026 — read-only. ONE statement, ONE grid.
--
-- MY MISTAKE, NOT THE PLATFORM'S. is_the_tour_step_ready_to_arm.sql joined
-- requirement 1 to public.schools, which throws away any row whose school_id
-- is null. The RECORD-your-notes letter (step 2e / the post-call letter) was
-- built on purpose as ONE row serving every campus, so a network row is
-- exactly what it should be — and exactly what my join could not see.
--
-- A network row IS sufficient. getTemplatesForTrigger selects
--   school_id is null OR school_id = <this school>
-- so one active network row reaches GA and FL both.
--
-- This asks the question without the join, and reports what it means.
-- ============================================================================

select coalesce(sc.name, '*** NETWORK (serves every campus) ***') as campus,
       t.template_key,
       t.channel,
       case when t.is_active then 'ON' else 'off' end             as state,
       t.delay_hours,
       case
         when t.channel not in ('email', 'staff_email')
           then '>>> CHANNEL THE ENGINE DOES NOT SEND'
         when not t.is_active
           then '>>> OFF — the leader gets no notes letter'
         when t.school_id is null
           then 'ready — one row, every campus, GA and FL included'
         else 'ready — this campus only'
       end                                                        as verdict,
       t.subject
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.trigger_event = 'staff_inquiry_call_held'
 order by sc.name nulls first, t.template_key;
