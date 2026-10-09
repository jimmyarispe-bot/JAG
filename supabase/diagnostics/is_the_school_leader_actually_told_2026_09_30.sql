-- IS THE SCHOOL LEADER ACTUALLY TOLD WHEN AN INQUIRY ARRIVES?
--
-- 30 September 2026. Jimmy: "confirm that when an inquiry form has been
-- submitted that they school leader has been notified by email".
--
-- SENT IS NOT ARRIVED. Nina's two decision emails on 22 September were both
-- recorded as sent and both FAILED on the unverified theacademyga.org domain -
-- she was asked to decide twice and never saw either request. So this reports
-- delivery_status, not merely the existence of a row.
--
-- Times are shown in Eastern. Jimmy, September: "we operate on eastern
-- standard time. everyone else adjusts." sent_at is stored UTC and reading it
-- raw put every timestamp four hours ahead this morning.
--
-- Every inquiry of the last 30 days, one row per inquiry.
--
-- Reads only.

select (l.created_at at time zone 'America/New_York')::timestamp(0) as inquiry_arrived_et,
       l.first_name || ' ' || l.last_name              as child,
       coalesce(s.name, '(no campus)')                 as campus,
       coalesce(
         string_agg(
           c.sent_to || ' [' || coalesce(c.delivery_status, 'status not recorded') || ']',
           '  |  ' order by c.sent_at),
         'NOBODY WAS EMAILED')                         as staff_told,
       count(c.id)                                     as notifications
  from public.admissions_leads l
  left join public.schools s on s.id = l.school_id
  left join public.admissions_communications c
         on c.lead_id = l.id
        and c.is_staff_notification is true
        and c.sent_at between l.created_at - interval '1 minute'
                          and l.created_at + interval '1 hour'
 where l.created_at >= now() - interval '30 days'
 group by 1, 2, 3
 order by 1 desc;
