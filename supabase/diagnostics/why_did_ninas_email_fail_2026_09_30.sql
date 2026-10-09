-- WHY DID NINA'S EMAIL FAIL? THE ACTUAL REASON.
--
-- 30 September 2026. Nina loses roughly a quarter of her mail. The JAG does
-- NOT store the reason on the communication row - there is no delivery_error
-- column. engine.ts computes it and then, in production only, writes it into
-- a Mission Control item:
--
--     title: "Admissions email delivery failed"
--     body:  the provider's own error text
--     severity: high, assignedRole: ADMISSIONS_DIRECTOR
--
-- So the reason exists, for every failure, in a queue. Which raises its own
-- question: four high-severity items have been sitting there since
-- 17 September and nobody has acted on any of them.
--
-- This reads that queue. The body is the answer to "is this a domain that is
-- not verified, a mailbox that is full, a server refusing us, or something
-- else" - and the four guesses are not worth making when the text is here.
--
-- Times in Eastern. Reads only.

select (m.created_at at time zone 'America/New_York')::timestamp(0) as raised_et,
       m.severity                                        as severity,
       coalesce(m.metadata ->> 'sentTo', '(not recorded)') as sent_to,
       coalesce(m.metadata ->> 'triggerEvent', '(none)')   as trigger_event,
       l.first_name || ' ' || l.last_name                 as child,
       coalesce(s.name, '(no campus)')                    as campus,
       m.body                                             as provider_said
  from public.platform_mission_control_items m
  left join public.admissions_leads l
    on m.entity_type = 'admissions_leads' and l.id = m.entity_id
  left join public.schools s on s.id = l.school_id
 where m.item_type = 'admissions_alert'
   and m.title ilike '%delivery failed%'
 order by m.created_at desc;
