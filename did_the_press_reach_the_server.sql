-- ============================================================================
-- DID THE PRESS REACH THE SERVER?
-- 5 October 2026 — read-only. ONE statement, ONE result grid.
--
-- The Supabase editor only shows the last result, which is why the first file
-- gave you section 3 and nothing else. This is all of it in one grid.
--
-- Section 3 already came back clean: step 1b's letter is ON at all four
-- campuses, on event interest_meeting_link_sent, channel email. So the button
-- had something to send. What is left is whether the press ever arrived.
--
-- HOW TO READ IT. Rows come back in this order:
--
--   1 the lead     — one row. Confirms the token, the campus, the email.
--   2 written      — every letter ever written for that lead, newest first.
--                    A row from this morning means the press ARRIVED and the
--                    letter went; the page just failed to tell you.
--                    No row from this morning means the press never left
--                    your browser, and the fault is a stale page, not the
--                    platform.
--   3 queued       — anything still sitting pending for that lead.
--
--   If sections 2 and 3 are both empty, nothing has ever been sent to this
--   family and the button is the only thing standing between them and us.
-- ============================================================================

with subject as (
  select l.id, l.school_id, l.guardian_email, l.lead_stage, l.created_at,
         coalesce(l.preferred_name, l.first_name || ' ' || l.last_name) as student
    from public.admissions_leads l
   where l.interest_link_token =
         '09b13da902df4b5581fdbb6195f9982d5054a4889d364f54a7560ee16d8112ec'
)

select  1                                   as ord,
        'the lead'                          as section,
        s.student                           as what,
        coalesce(sc.name, '(no campus)')    as campus_or_channel,
        coalesce(s.guardian_email, '(NO EMAIL — button would be greyed out)')
                                            as who,
        s.lead_stage                        as status,
        to_char(s.created_at at time zone 'America/New_York',
                'Mon DD HH12:MI AM')        as eastern_time
   from subject s
   left join public.schools sc on sc.id = s.school_id

union all

select  2,
        'written',
        c.template_key,
        c.communication_type
          || case when c.is_staff_notification
                  then ' (staff)' else ' (THE FAMILY)' end,
        coalesce(c.sent_to, '(nobody)'),
        c.delivery_status,
        to_char(c.created_at at time zone 'America/New_York',
                'Mon DD HH12:MI AM')
   from public.admissions_communications c
  where c.lead_id = (select id from subject)

union all

select  3,
        'queued',
        q.template_key,
        q.channel,
        q.trigger_event,
        q.status,
        to_char(q.scheduled_for at time zone 'America/New_York',
                'Mon DD HH12:MI AM')
   from public.admissions_communication_queue q
  where q.lead_id = (select id from subject)

order by ord, eastern_time desc;
