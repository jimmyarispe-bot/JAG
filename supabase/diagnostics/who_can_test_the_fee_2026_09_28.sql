-- WHO CAN TEST THE APPLICATION FEE, AND WHOSE MONEY WOULD IT BE
--
-- 28 September 2026. The parent portal lists applications by matching the
-- signed-in address against admissions_leads.guardian_email. Jimmy's staff
-- address is a guardian on nobody, so /apply/portal shows him nothing and the
-- fee panel is unreachable from his own account.
--
-- This asks which applications exist, who their guardian is, what their fee
-- says, and whether their campus can take a payment at all. It reads only.

select a.id                                   as application_id,
       l.first_name || ' ' || l.last_name     as child,
       s.name                                 as campus,
       coalesce(s.square_location_id, '** NO LOCATION - CANNOT TAKE PAYMENT **')
                                              as square_location,
       l.guardian_email                       as portal_sign_in_address,
       a.application_status,
       a.application_fee_status,
       to_char(a.application_fee_cents / 100.0, 'FM999990.00') as fee_dollars,
       coalesce(a.application_fee_reference, '(no payment started)') as square_order_id,
       a.application_fee_paid_at,
       a.application_date
  from public.admissions_applications a
  left join public.admissions_leads l on l.id = a.lead_id
  left join public.schools s          on s.id = l.school_id
 order by a.application_date desc nulls last;

-- Second question: is any of these a row somebody made to try the system,
-- rather than a real family? A test row is the one safe place to take a live
-- payment. Judged by the address, because nothing in the schema says "test".

select l.guardian_email,
       count(*) as applications,
       case
         when l.guardian_email is null then 'NO ADDRESS - this family cannot reach the portal at all'
         when lower(l.guardian_email) like '%@theacademyway.org'
           or lower(l.guardian_email) like '%@theacademyga.org'
           or lower(l.guardian_email) like '%@theacademyfl.org'
              then 'STAFF ADDRESS - almost certainly a test row'
         when lower(l.guardian_email) = 'jimmy.arispe@gmail.com'
              then 'JIMMY''S TEST ADDRESS - safe to use'
         else 'LOOKS LIKE A REAL FAMILY - do not take a test payment here'
       end as verdict
  from public.admissions_applications a
  left join public.admissions_leads l on l.id = a.lead_id
 group by l.guardian_email
 order by applications desc;
