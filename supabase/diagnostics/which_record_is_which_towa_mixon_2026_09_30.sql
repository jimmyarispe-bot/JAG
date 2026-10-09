-- WHICH RECORD IS WHICH - Julian Towa and Maddox Mixon
--
-- 30 September 2026. The first diagnostic found TWO lead rows for each child
-- and listed both ids without saying which id carried which stage, which is
-- useless for deciding which page to open. My fault; this pairs them.
--
-- Reads only.

select l.first_name || ' ' || l.last_name        as child,
       coalesce(s.name, '(no campus)')           as campus,
       coalesce(l.lead_stage, '(none)')          as stage,
       l.created_at::date                        as first_seen,
       case when a.id is null then 'no application'
            else a.application_status || ' / fee ' || coalesce(a.application_fee_status,'?')
       end                                       as application,
       case when l.application_access_token is null then 'NOT invited'
            else 'invited' end                   as invite,
       'https://theacademyway.thejag.org/dashboard/admissions/leads/' || l.id::text as open_this
  from public.admissions_leads l
  left join public.schools s on s.id = l.school_id
  left join lateral (
    select * from public.admissions_applications x
     where x.lead_id = l.id order by x.created_at desc limit 1
  ) a on true
 where (lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%')
    or (lower(l.first_name) like '%maddox%' and lower(l.last_name) like '%mix%')
 order by 1, 4;
