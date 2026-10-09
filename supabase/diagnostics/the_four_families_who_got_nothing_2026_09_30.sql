-- THE FOUR FAMILIES WHO GOT NOTHING
--
-- 30 September 2026. Between 15 and 18 September, four families were emailed
-- from The Academy GA or The Academy FL and Resend refused every one of them
-- because neither sending domain was verified. The families were never told
-- anything; the JAG raised a high-severity alert for each and nobody opened
-- the queue.
--
--   Dominic Anders   FL   application invite       15 Sept
--   Deidra Williams  FL   application invite       15 Sept
--   Michael Stone    GA   inquiry confirmation     17 Sept
--   Camden Fox       GA   interview scheduled      18 Sept
--
-- Found from the Mission Control items themselves rather than typed in, so
-- if there are more than four this returns them too.
--
-- THE INVITED TWO ALREADY HAVE LINKS. The token is minted before the email
-- is sent, so the mint worked and only the delivery failed - their
-- application link has existed since 15 September and has simply never
-- reached them. It is in the last column. Nothing needs creating.
--
-- Times in Eastern. Reads only.

with failed as (
  select distinct
         m.entity_id                            as lead_id,
         min(m.created_at) over (partition by m.entity_id) as first_failure
    from public.platform_mission_control_items m
   where m.item_type = 'admissions_alert'
     and m.title ilike '%delivery failed%'
     and m.entity_type = 'admissions_leads'
     and coalesce(m.metadata ->> 'sentTo', '') not ilike '%theacademy%'
)
select l.first_name || ' ' || l.last_name                as child,
       coalesce(s.name, '(no campus)')                   as campus,
       l.guardian_email                                  as email_them_here,
       coalesce(l.lead_stage, '(none)')                  as stage_now,
       (f.first_failure at time zone 'America/New_York')::date as silent_since,
       string_agg(distinct coalesce(m2.metadata ->> 'triggerEvent', '?'), ', ')
                                                         as never_received,
       case
         when l.application_access_token is null
           then 'no link exists - tell me and I will mint one'
         else 'https://apply.theacademyway.org/apply/start/' || l.application_access_token
       end                                               as their_link
  from failed f
  join public.admissions_leads l on l.id = f.lead_id
  left join public.schools s on s.id = l.school_id
  left join public.platform_mission_control_items m2
         on m2.entity_id = l.id
        and m2.item_type = 'admissions_alert'
        and m2.title ilike '%delivery failed%'
 group by 1, 2, 3, 4, 5, 7
 order by 5, 1;
